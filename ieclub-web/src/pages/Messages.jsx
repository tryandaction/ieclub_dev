import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import request from '../utils/request'

export default function Messages() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const messagesEndRef = useRef(null)
  
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadConversations()
  }, [user])

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId)
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      const res = await request.get('/messages/conversations')
      setConversations(res.data?.data || res.data || [])
    } catch (error) {
      console.error('加载会话列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (convId) => {
    try {
      const res = await request.get(`/messages/conversation/${convId}/messages`)
      setMessages(res.data?.data || res.data || [])
      
      // 更新当前会话信息
      const conv = conversations.find(c => c.id === convId)
      if (conv) {
        setActiveConversation(conv)
        // 清除未读
        setConversations(prev => prev.map(c => 
          c.id === convId ? { ...c, unreadCount: 0 } : c
        ))
      }
    } catch (error) {
      console.error('加载消息失败:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return

    try {
      setSending(true)
      const res = await request.post('/messages/send', {
        receiverId: activeConversation.otherUser.id,
        content: newMessage.trim()
      })
      
      setMessages(prev => [...prev, res.data])
      setNewMessage('')
      
      // 更新会话列表
      setConversations(prev => prev.map(c => 
        c.id === activeConversation.id
          ? { ...c, lastMessage: newMessage.trim(), lastMessageAt: new Date() }
          : c
      ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)))
    } catch (error) {
      console.error('发送失败:', error)
      showToast('发送失败', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
    
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* 会话列表 */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">💬 私信</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => navigate(`/messages/${conv.id}`)}
                className={`p-4 border-b cursor-pointer transition hover:bg-gray-50 ${
                  activeConversation?.id === conv.id ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={conv.otherUser.avatar || '/default-avatar.png'}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 truncate">
                        {conv.otherUser.nickname}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {conv.lastMessage || '暂无消息'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">💬</div>
              <p>暂无私信</p>
              <p className="text-sm mt-2">去关注感兴趣的用户开始聊天吧</p>
            </div>
          )}
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* 聊天头部 */}
            <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
              <img
                src={activeConversation.otherUser.avatar || '/default-avatar.png'}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="font-bold text-gray-900">
                  {activeConversation.otherUser.nickname}
                </h3>
              </div>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, index) => {
                const isMine = msg.senderId === user.id
                return (
                  <div
                    key={msg.id || index}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[70%] ${isMine ? 'flex-row-reverse' : ''}`}>
                      <img
                        src={msg.sender?.avatar || '/default-avatar.png'}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isMine
                              ? 'bg-purple-500 text-white rounded-br-md'
                              : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className={`text-xs text-gray-400 mt-1 ${isMine ? 'text-right' : ''}`}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息..."
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-3 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? '...' : '发送'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">选择一个会话开始聊天</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
