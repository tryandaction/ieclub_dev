import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUnreadCount } from '../api/notification'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../hooks/useWebSocket'

/**
 * 通知徽章组件
 * 显示未读数量，点击跳转到通知页面，支持实时更新
 */
export default function NotificationBadge() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  // 监听实时通知
  useNotifications((notification) => {
    // 收到新通知时，未读数+1
    if (!notification.isRead) {
      setUnreadCount((prev) => prev + 1)
    }
    
    // 可以添加音效提示
    // playNotificationSound()
  })

  useEffect(() => {
    // 只在用户登录时获取未读数量
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }

    fetchUnreadCount()

    // 每60秒刷新一次（降低频率，因为有实时推送）
    const interval = setInterval(fetchUnreadCount, 60000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return
    
    try {
      const res = await getUnreadCount()
      // 修复：正确处理响应数据结构
      if (res?.data?.data?.count !== undefined) {
        setUnreadCount(res.data.data.count)
      } else if (res?.data?.count !== undefined) {
        setUnreadCount(res.data.count)
      } else if (typeof res?.data === 'number') {
        setUnreadCount(res.data)
      }
    } catch (error) {
      // 静默失败，不影响用户体验
      console.error('获取未读数量失败:', error)
    }
  }

  const handleClick = () => {
    navigate('/notifications')
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      title="消息通知"
    >
      {/* 铃铛图标 */}
      <svg
        className="w-6 h-6 text-gray-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* 未读数量徽章 */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 flex items-center justify-center text-xs font-bold text-white bg-red-600 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}

