import { useState } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'system'
  user?: {
    nickname: string
    avatar: string
  }
  content: string
  targetTitle?: string
  time: string
  isRead: boolean
}

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all')
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'like',
      user: {
        nickname: '张三',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1'
      },
      content: '赞了你的话题',
      targetTitle: '高等数学期末重点串讲',
      time: '2024-10-25T10:30:00Z',
      isRead: false
    },
    {
      id: '2',
      type: 'comment',
      user: {
        nickname: '李四',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2'
      },
      content: '评论了你的话题：讲得很清楚，太有帮助了！',
      targetTitle: '高等数学期末重点串讲',
      time: '2024-10-25T09:15:00Z',
      isRead: false
    },
    {
      id: '3',
      type: 'follow',
      user: {
        nickname: '王五',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3'
      },
      content: '关注了你',
      time: '2024-10-24T16:20:00Z',
      isRead: true
    },
    {
      id: '4',
      type: 'system',
      content: '欢迎加入IEClub！开始你的知识分享之旅吧',
      time: '2024-10-24T10:00:00Z',
      isRead: true
    }
  ])

  const getTypeIcon = (type: string) => {
    const iconMap = {
      like: { icon: 'mdi:heart', color: '#FF6B9D' },
      comment: { icon: 'mdi:comment', color: '#5B7FFF' },
      follow: { icon: 'mdi:account-plus', color: '#FFA500' },
      system: { icon: 'mdi:bell', color: '#7C4DFF' }
    }
    return iconMap[type] || iconMap.system
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
    } else {
      return `${Math.floor(diff / day)}天前`
    }
  }

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
    Taro.showToast({
      title: '已全部标为已读',
      icon: 'success'
    })
  }

  const goBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className='notifications-page'>
      {/* 顶部导航栏 */}
      <View className='nav-bar'>
        <View className='nav-left' onClick={goBack}>
          <View className='iconify-icon' data-icon='mdi:arrow-left' />
        </View>
        <Text className='title'>通知</Text>
        <View className='nav-right' onClick={markAllRead}>
          <Text>全部已读</Text>
        </View>
      </View>

      {/* 标签栏 */}
      <View className='tab-bar'>
        <View 
          className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Text>全部</Text>
        </View>
        <View 
          className={`tab-item ${activeTab === 'interaction' ? 'active' : ''}`}
          onClick={() => setActiveTab('interaction')}
        >
          <Text>互动</Text>
        </View>
        <View 
          className={`tab-item ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <Text>系统</Text>
        </View>
      </View>

      {/* 通知列表 */}
      <ScrollView className='content' scrollY>
        <View className='notification-list'>
          {notifications.map(notification => (
            <View 
              key={notification.id}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
            >
              <View className='left'>
                {notification.user ? (
                  <Image 
                    src={notification.user.avatar}
                    className='avatar'
                    mode='aspectFill'
                  />
                ) : (
                  <View 
                    className='type-icon'
                    style={{ background: getTypeIcon(notification.type).color }}
                  >
                    <View 
                      className='iconify-icon'
                      data-icon={getTypeIcon(notification.type).icon}
                    />
                  </View>
                )}
              </View>

              <View className='center'>
                {notification.user && (
                  <Text className='nickname'>{notification.user.nickname} </Text>
                )}
                <Text className='content'>{notification.content}</Text>
                {notification.targetTitle && (
                  <View className='target'>
                    <Text>「{notification.targetTitle}」</Text>
                  </View>
                )}
                <Text className='time'>{formatTime(notification.time)}</Text>
              </View>

              {!notification.isRead && (
                <View className='unread-dot' />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
