/**
 * 私信聊天页面
 * 支持实时通信、消息列表、在线状态显示
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../../components/common/Avatar.jsx';
import Icon from '../../components/common/Icon.jsx';
import { Button } from '../../components/common/Button.jsx';
import Loading from '../../components/common/Loading.jsx';
import { Send, Image, Smile, MoreVertical, Search, Phone, Video, Info } from 'lucide-react';
import api from '../../services/api.js';

/**
 * 消息列表页面
 */
export const MessagesListPage = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.messages.getConversations();
      if (response.success) {
        setConversations(response.data || []);
      } else {
        // 使用模拟数据
        setConversations(getMockConversations());
      }
    } catch (error) {
      console.error('加载对话列表失败:', error);
      setConversations(getMockConversations());
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversationId) => {
    navigate(`/messages/${conversationId}`);
  };

  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'unread' && conv.unreadCount === 0) return false;
    if (searchQuery) {
      return conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading size="lg" text="加载中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题栏 */}
      <div className="bg-white sticky top-0 z-10 border-b">
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>💬</span>
            <span>消息</span>
          </h1>
        </div>

        {/* 搜索框 */}
        <div className="px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索对话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Tab切换 */}
        <div className="flex border-t">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 text-center font-semibold transition-all relative ${
              activeTab === 'all' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            全部
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-3 text-center font-semibold transition-all relative ${
              activeTab === 'unread' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <span>未读</span>
              {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {conversations.filter(c => c.unreadCount > 0).length}
                </span>
              )}
            </div>
            {activeTab === 'unread' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
            )}
          </button>
        </div>
      </div>

      {/* 对话列表 */}
      <div className="px-4 py-4">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Icon icon="message" size="3xl" color="#D1D5DB" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {activeTab === 'unread' ? '没有未读消息' : '暂无对话'}
            </h3>
            <p className="text-sm text-gray-500 text-center">
              {activeTab === 'unread' 
                ? '所有消息已读完' 
                : '开始与他人聊天吧'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleConversationClick(conv.id)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
              >
                <div className="flex items-start gap-3">
                  {/* 用户头像 */}
                  <div className="relative">
                    <Avatar
                      src={conv.user.avatar}
                      name={conv.user.name}
                      size="lg"
                      status={conv.user.online ? 'online' : 'offline'}
                    />
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* 消息内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900">{conv.user.name}</h3>
                      <span className="text-xs text-gray-500">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p className={`text-sm line-clamp-1 ${
                      conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                    }`}>
                      {conv.lastMessage.type === 'image' ? '[图片]' : conv.lastMessage.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 聊天对话页面
 */
export const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.messages.getMessages(conversationId);
      if (response.success) {
        setMessages(response.data.messages || []);
        setOtherUser(response.data.otherUser || null);
      } else {
        // 使用模拟数据
        const mockData = getMockMessages();
        setMessages(mockData.messages);
        setOtherUser(mockData.otherUser);
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      const mockData = getMockMessages();
      setMessages(mockData.messages);
      setOtherUser(mockData.otherUser);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    const messageContent = inputValue.trim();
    setInputValue('');

    const newMessage = {
      id: Date.now(),
      content: messageContent,
      type: 'text',
      isSelf: true,
      createdAt: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, newMessage]);

    try {
      setSending(true);
      const response = await api.messages.send({
        conversationId,
        content: messageContent,
        type: 'text'
      });

      if (response.success) {
        // 更新消息状态为已发送
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, id: response.data.id, status: 'sent' }
            : msg
        ));
      } else {
        // 发送失败，标记消息状态
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'failed' }
            : msg
        ));
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: 'failed' }
          : msg
      ));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading size="lg" text="加载中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Icon icon="chevron-left" size="lg" color="#6B7280" />
            </button>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setShowUserInfo(!showUserInfo)}
            >
              <Avatar
                src={otherUser?.avatar}
                name={otherUser?.name}
                size="md"
                status={otherUser?.online ? 'online' : 'offline'}
              />
              <div>
                <h2 className="font-bold text-gray-900">{otherUser?.name}</h2>
                <p className="text-xs text-gray-500">
                  {otherUser?.online ? '在线' : '离线'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Phone size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Video size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* 用户信息面板 */}
        {showUserInfo && otherUser && (
          <div className="border-t bg-gradient-to-br from-purple-50 to-pink-50 p-4 animate-slideDown">
            <div className="flex items-start gap-3">
              <Avatar src={otherUser.avatar} name={otherUser.name} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{otherUser.name}</h3>
                  {otherUser.level && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-600 rounded-full text-xs font-bold">
                      LV{otherUser.level}
                    </span>
                  )}
                </div>
                {otherUser.department && (
                  <p className="text-sm text-gray-600 mb-2">
                    {otherUser.department} · {otherUser.grade}
                  </p>
                )}
                {otherUser.bio && (
                  <p className="text-sm text-gray-700 mb-2">{otherUser.bio}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/profile/${otherUser.id}`)}
                  >
                    查看主页
                  </Button>
                  {!otherUser.isFollowing && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => console.log('关注用户')}
                    >
                      关注
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.isSelf ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* 头像 */}
            {!message.isSelf && (
              <Avatar
                src={otherUser?.avatar}
                name={otherUser?.name}
                size="sm"
                className="flex-shrink-0"
              />
            )}

            {/* 消息气泡 */}
            <div className={`flex flex-col ${message.isSelf ? 'items-end' : 'items-start'} max-w-[70%]`}>
              <div
                className={`rounded-2xl px-4 py-2 ${
                  message.isSelf
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white shadow-sm text-gray-900'
                }`}
              >
                {message.type === 'text' && (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
                {message.type === 'image' && (
                  <img
                    src={message.content}
                    alt="图片消息"
                    className="max-w-full rounded-lg"
                  />
                )}
              </div>
              
              {/* 消息状态和时间 */}
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                {message.isSelf && message.status === 'sending' && (
                  <span>发送中...</span>
                )}
                {message.isSelf && message.status === 'failed' && (
                  <span className="text-red-500">发送失败</span>
                )}
                <span>{formatTime(message.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="bg-white border-t px-4 py-3 sticky bottom-0">
        <div className="flex items-end gap-2">
          {/* 附加功能按钮 */}
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors mb-1">
            <Image size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors mb-1">
            <Smile size={20} className="text-gray-600" />
          </button>

          {/* 输入框 */}
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              rows={1}
              className="w-full bg-transparent border-none outline-none resize-none text-sm max-h-24"
              style={{ minHeight: '24px' }}
            />
          </div>

          {/* 发送按钮 */}
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || sending}
            className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-1"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// 工具函数：格式化时间
function formatTime(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now - date;
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 其他
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 模拟数据
function getMockConversations() {
  return [
    {
      id: 1,
      user: {
        id: 1,
        name: '张明',
        avatar: null,
        online: true
      },
      lastMessage: {
        content: '好的，明天见！',
        type: 'text',
        createdAt: new Date(Date.now() - 300000).toISOString()
      },
      unreadCount: 2
    },
    {
      id: 2,
      user: {
        id: 2,
        name: '李思',
        avatar: null,
        online: false
      },
      lastMessage: {
        content: '这个项目很有意思，我想了解更多细节',
        type: 'text',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      unreadCount: 0
    },
    {
      id: 3,
      user: {
        id: 3,
        name: '王浩',
        avatar: null,
        online: true
      },
      lastMessage: {
        content: '[图片]',
        type: 'image',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      unreadCount: 1
    }
  ];
}

function getMockMessages() {
  return {
    otherUser: {
      id: 1,
      name: '张明',
      avatar: null,
      online: true,
      level: 8,
      department: '计算机科学与技术',
      grade: '大三',
      bio: '代码改变世界，学习永无止境',
      isFollowing: false
    },
    messages: [
      {
        id: 1,
        content: '你好！看到你发布的Python教程话题，很感兴趣',
        type: 'text',
        isSelf: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        status: 'sent'
      },
      {
        id: 2,
        content: '嗨！欢迎！你想学习Python的哪方面内容呢？',
        type: 'text',
        isSelf: true,
        createdAt: new Date(Date.now() - 3500000).toISOString(),
        status: 'sent'
      },
      {
        id: 3,
        content: '主要是数据分析和可视化方面，我最近在做一个项目需要用到',
        type: 'text',
        isSelf: false,
        createdAt: new Date(Date.now() - 3400000).toISOString(),
        status: 'sent'
      },
      {
        id: 4,
        content: '没问题！这些都在我的教程范围内。我们可以从pandas和matplotlib开始',
        type: 'text',
        isSelf: true,
        createdAt: new Date(Date.now() - 3300000).toISOString(),
        status: 'sent'
      },
      {
        id: 5,
        content: '太好了！什么时候方便开始呢？',
        type: 'text',
        isSelf: false,
        createdAt: new Date(Date.now() - 300000).toISOString(),
        status: 'sent'
      },
      {
        id: 6,
        content: '明天下午2点怎么样？我们可以在图书馆讨论室见面',
        type: 'text',
        isSelf: true,
        createdAt: new Date(Date.now() - 240000).toISOString(),
        status: 'sent'
      },
      {
        id: 7,
        content: '好的，明天见！',
        type: 'text',
        isSelf: false,
        createdAt: new Date(Date.now() - 180000).toISOString(),
        status: 'sent'
      }
    ]
  };
}

// 导出
export default MessagesListPage;

