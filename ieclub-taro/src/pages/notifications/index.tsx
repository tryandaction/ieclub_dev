import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'system'
  title: string
  content: string
  avatar?: string
  time: string
  isRead: boolean
  link?: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'like',
        title: '收到新的赞',
        content: '数学小天才 赞了你的话题 "线性代数复习资料整理"',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        time: '2024-10-26T10:30:00Z',
        isRead: false,
        link: '/pages/topics/detail/index?id=1'
      },
      {
        id: '2',
        type: 'comment',
        title: '收到新的评论',
        content: '代码侠 评论了你的话题："这个讲解太棒了，期待线下分享！"',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
        time: '2024-10-26T09:15:00Z',
        isRead: false,
        link: '/pages/topics/detail/index?id=1'
      },
      {
        id: '3',
        type: 'follow',
        title: '新的关注',
        content: '创业者Leo 关注了你',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
        time: '2024-10-25T18:20:00Z',
        isRead: true,
        link: '/pages/community/profile/index?id=3'
      },
      {
        id: '4',
        type: 'system',
        title: '系统通知',
        content: '你发布的话题 "高等数学期末串讲" 已达到15人想听，快去创建活动吧！',
        time: '2024-10-25T16:00:00Z',
        isRead: true,
        link: '/pages/activities/create/index?topicId=1'
      }
    ]
    
    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.isRead).length)
  }

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))

    Taro.showToast({
      title: '查看详情',
      icon: 'none'
    })
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    Taro.showToast({
      title: '已全部标记为已读',
      icon: 'success'
    })
  }

  const getTypeIcon = (type: string) => {
    const iconMap = {
      like: 'mdi:heart',
      comment: 'mdi:comment',
      follow: 'mdi:account-plus',
      system: 'mdi:bell'
    }
    return iconMap[type] || 'mdi:bell'
  }

  const getTypeColor = (type: string) => {
    const colorMap = {
      like: '#ff6b9d',
      comment: '#5B7FFF',
      follow: '#FFA500',
      system: '#999'
    }
    return colorMap[type] || '#999'
  }

  const formatTime = (time: string) => {
    const now = new Date().getTime()
    const past = new Date(time).getTime()
    const diff = now - past
    
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    
    if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`
    } else if (diff < 7 * day) {
      return `${Math.floor(diff / day)}天前`
    } else {
      const date = new Date(time)
      return `${date.getMonth() + 1}-${date.getDate()}`
    }
  }

  return (
    <View className='notifications-page'>
      <View className='nav-bar'>
        <View className='nav-left' onClick={() => Taro.navigateBack()}>
          <View className='iconify-icon' data-icon='mdi:arrow-left' />
        </View>
        <Text className='title'>通知</Text>
        <View className='nav-right' onClick={markAllAsRead}>
          <Text>全部已读</Text>
        </View>
      </View>

      {unreadCount > 0 && (
        <View className='unread-banner'>
          <Text>你有 {unreadCount} 条未读通知</Text>
        </View>
      )}

      <ScrollView className='content' scrollY>
        {notifications.length > 0 ? (
          <View className='notification-list'>
            {notifications.map(notification => (
              <View 
                key={notification.id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <View className='left'>
                  {notification.avatar ? (
                    <Image 
                      src={notification.avatar} 
                      className='avatar'
                      mode='aspectFill'
                    />
                  ) : (
                    <View 
                      className='type-icon'
                      style={{ background: getTypeColor(notification.type) }}
                    >
                      <View 
                        className='iconify-icon' 
                        data-icon={getTypeIcon(notification.type)}
                      />
                    </View>
                  )}
                </View>

                <View className='center'>
                  <View className='notification-title'>{notification.title}</View>
                  <View className='notification-content'>{notification.content}</View>
                  <View className='notification-time'>{formatTime(notification.time)}</View>
                </View>

                {!notification.isRead && (
                  <View className='unread-dot' />
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className='empty-state'>
            <View className='iconify-icon' data-icon='mdi:bell-outline' />
            <Text>暂无通知</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
