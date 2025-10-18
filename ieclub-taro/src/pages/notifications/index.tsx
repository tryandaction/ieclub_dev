// ==================== 通知页面（增强版） ====================

import { View, ScrollView, Text } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { useNotificationStore } from '../../store/notification'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatRelativeTime } from '../../utils/format'
import './index.scss'

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    hasMore,
    loading,
    fetchNotifications,
    markAllRead
  } = useNotificationStore()

  const [refreshing, setRefreshing] = useState(false)

  const loadNotifications = useCallback(async () => {
    try {
      await fetchNotifications(1)
    } catch (error) {
      console.error('加载通知失败:', error)
    }
  }, [fetchNotifications])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchNotifications(1)
    } finally {
      setRefreshing(false)
    }
  }

  const onLoadMore = async () => {
    if (!hasMore || loading) return

    try {
      const currentPage = Math.ceil(notifications.length / 20)
      await fetchNotifications(currentPage + 1, true)
    } catch (error) {
      console.error('加载更多失败:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const handleNotificationClick = (notification: any) => {
    // 根据通知类型跳转到相应页面
    if (notification.topicId) {
      Taro.navigateTo({
        url: `/pages/topic-detail/index?id=${notification.topicId}`
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      like: '❤️',
      comment: '💬',
      reply: '↩️',
      follow: '👤',
      system: '🔔'
    }
    return icons[type] || '📢'
  }

  return (
    <View className='notifications-page'>
      {/* 头部操作栏 */}
      {unreadCount > 0 && (
        <View className='header-actions'>
          <Text className='unread-count'>{unreadCount} 条未读</Text>
          <View className='mark-read-btn' onClick={handleMarkAllRead}>
            全部已读
          </View>
        </View>
      )}

      {/* 通知列表 */}
      <ScrollView
        className='notifications-scroll'
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={onRefresh}
        onScrollToLower={onLoadMore}
        lowerThreshold={100}
      >
        {loading && notifications.length === 0 ? (
          <LoadingSpinner />
        ) : notifications.length === 0 ? (
          <EmptyState
            title='暂无通知'
            description='你还没有收到任何通知'
          />
        ) : (
          <View className='notifications-list'>
            {notifications.map(notification => (
              <View
                key={notification.id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <View className='notification-icon'>
                  {getNotificationIcon(notification.type)}
                </View>

                <View className='notification-content'>
                  <Text className='title'>{notification.title}</Text>
                  <Text className='content'>{notification.content}</Text>
                  <Text className='time'>
                    {formatRelativeTime(notification.createdAt)}
                  </Text>
                </View>

                {!notification.isRead && (
                  <View className='unread-dot'></View>
                )}
              </View>
            ))}

            {hasMore && (
              <View className='load-more'>
                {loading ? '加载中...' : '上拉加载更多'}
              </View>
            )}

            {!hasMore && notifications.length > 0 && (
              <View className='no-more'>没有更多了</View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}