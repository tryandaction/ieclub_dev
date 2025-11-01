import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, clearReadNotifications } from '../api/notification'
import { useNotifications } from '../hooks/useWebSocket'
import toast from '../utils/toast'
import Loading from '../components/Loading'

/**
 * 通知页面 - 支持实时通知
 */
export default function Notifications() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // all, unread
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // 监听实时通知
  useNotifications((newNotification) => {
    // 如果在第一页且显示全部通知，将新通知添加到列表顶部
    if (page === 1 && filter === 'all') {
      setNotifications((prev) => [newNotification, ...prev])
      setTotal((prev) => prev + 1)
    } else if (page === 1 && filter === 'unread' && !newNotification.isRead) {
      setNotifications((prev) => [newNotification, ...prev])
      setTotal((prev) => prev + 1)
    }
    
    // 显示 Toast 提示
    toast.success(`新通知：${newNotification.title}`)
  })

  const typeConfig = {
    like: {
      icon: '❤️',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    comment: {
      icon: '💬',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    reply: {
      icon: '↩️',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    follow: {
      icon: '👤',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    match: {
      icon: '✨',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    system: {
      icon: '🔔',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  }

  useEffect(() => {
    fetchNotifications()
  }, [filter, page])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await getNotifications({
        page,
        limit: 20,
        unreadOnly: filter === 'unread',
      })

      setNotifications(res.data.data)
      setTotal(res.data.pagination.total)
    } catch (error) {
      console.error('获取通知失败:', error)
      toast.error(error.response?.data?.message || '获取通知失败')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id)
      fetchNotifications()
    } catch (error) {
      console.error('标记失败:', error)
      toast.error('操作失败')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const res = await markAllAsRead()
      toast.success(res.data.message || '已全部标记为已读')
      fetchNotifications()
    } catch (error) {
      console.error('标记全部失败:', error)
      toast.error('操作失败')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条通知吗？')) return

    try {
      await deleteNotification(id)
      toast.success('删除成功')
      fetchNotifications()
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    }
  }

  const handleClearRead = async () => {
    if (!confirm('确定要清空所有已读通知吗？')) return

    try {
      const res = await clearReadNotifications()
      toast.success(res.data.message || '清空成功')
      fetchNotifications()
    } catch (error) {
      console.error('清空失败:', error)
      toast.error('清空失败')
    }
  }

  const handleNotificationClick = async (notification) => {
    // 如果未读，标记为已读
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }

    // 跳转到相关页面
    if (notification.link) {
      const path = notification.link.replace(/^\/pages/, '')
      navigate(path)
    }
  }

  const formatTime = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`

    return d.toLocaleDateString('zh-CN')
  }

  if (loading && notifications.length === 0) {
    return <Loading show={true} fullscreen={false} />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">消息通知</h1>
        <div className="flex gap-2">
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            全部已读
          </button>
          <button
            onClick={handleClearRead}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            清空已读
          </button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            未读
          </button>
        </div>
      </div>

      {/* 通知列表 */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">暂无通知</h3>
          <p className="text-gray-500">
            {filter === 'unread' ? '所有通知都已读啦' : '还没有收到任何通知'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type] || typeConfig.system

            return (
              <div
                key={notification.id}
                className={`bg-white rounded-2xl shadow-sm p-6 transition-all cursor-pointer hover:shadow-md ${
                  !notification.isRead ? 'border-l-4 border-primary-600' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-4">
                  {/* 图标 */}
                  <div className={`flex-shrink-0 w-12 h-12 ${config.bgColor} rounded-full flex items-center justify-center text-2xl`}>
                    {config.icon}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    {/* 标题和时间 */}
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-gray-900">
                        {notification.title}
                        {!notification.isRead && (
                          <span className="ml-2 inline-block w-2 h-2 bg-red-600 rounded-full"></span>
                        )}
                      </h3>
                      <span className="text-sm text-gray-500 ml-2 flex-shrink-0">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>

                    {/* 内容 */}
                    <p className="text-gray-600 text-sm mb-2">
                      {notification.content}
                    </p>

                    {/* 操作者头像和名称 */}
                    {notification.actor && (
                      <div className="flex items-center gap-2 mb-3">
                        <img
                          src={notification.actor.avatar || '/default-avatar.png'}
                          alt={notification.actor.nickname}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm text-gray-700">
                          {notification.actor.nickname}
                        </span>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead(notification.id)
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700"
                        >
                          标记已读
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notification.id)
                        }}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 分页 */}
      {total > 20 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            上一页
          </button>
          <span className="px-4 py-2">
            第 {page} 页，共 {Math.ceil(total / 20)} 页
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}

