import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './NotificationsPage.scss'

/**
 * 通知页 - 小程序版本
 * 展示系统通知、活动提醒、互动消息等
 */
export default class NotificationsPage extends Component {
  state = {
    notifications: [],
    loading: true,
    filter: 'all' // all, system, event, social
  }

  componentDidMount() {
    this.loadNotifications()
  }

  onPullDownRefresh() {
    this.loadNotifications()
  }

  async loadNotifications() {
    try {
      // 模拟加载延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟通知数据
      const mockData = [
        {
          id: 1,
          type: 'system',
          icon: '📢',
          title: '系统通知',
          content: '欢迎使用IEClub小程序！连接思想，激发创新，共同成长。',
          time: '刚刚',
          read: false
        },
        {
          id: 2,
          type: 'event',
          icon: '📅',
          title: '活动提醒',
          content: '您报名的"跨学科创新论坛"将于明天14:00在慧园行政楼报告厅举行',
          time: '1小时前',
          read: false
        },
        {
          id: 3,
          type: 'social',
          icon: '💬',
          title: '新评论',
          content: '李思 评论了你的帖子："很有意思的项目！"',
          time: '2小时前',
          read: true
        },
        {
          id: 4,
          type: 'social',
          icon: '❤️',
          title: '点赞通知',
          content: '王浩 赞了你的帖子',
          time: '3小时前',
          read: true
        },
        {
          id: 5,
          type: 'event',
          icon: '🎉',
          title: '活动报名成功',
          content: '您已成功报名"Python数据分析工作坊"',
          time: '昨天',
          read: true
        }
      ]

      this.setState({
        notifications: mockData,
        loading: false
      })

      Taro.stopPullDownRefresh()
    } catch (error) {
      console.error('[NotificationsPage] Load failed:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      })
      this.setState({ loading: false })
      Taro.stopPullDownRefresh()
    }
  }

  handleNotificationClick = (notification) => {
    // 标记为已读
    const { notifications } = this.state
    const updatedNotifications = notifications.map(item =>
      item.id === notification.id ? { ...item, read: true } : item
    )
    this.setState({ notifications: updatedNotifications })
    
    // 显示详情或跳转
    Taro.showToast({
      title: '已标记为已读',
      icon: 'none',
      duration: 1500
    })
  }

  handleClearAll = () => {
    Taro.showModal({
      title: '清除所有通知',
      content: '确定要清除所有通知吗？',
      success: (res) => {
        if (res.confirm) {
          this.setState({ notifications: [] })
          Taro.showToast({
            title: '已清除',
            icon: 'success',
            duration: 1500
          })
        }
      }
    })
  }

  handleMarkAllRead = () => {
    const { notifications } = this.state
    const updatedNotifications = notifications.map(item => ({ ...item, read: true }))
    this.setState({ notifications: updatedNotifications })
    Taro.showToast({
      title: '全部已读',
      icon: 'success',
      duration: 1500
    })
  }

  handleBack = () => {
    Taro.navigateBack()
  }

  getTypeIcon = (type) => {
    const icons = {
      system: '📢',
      event: '📅',
      social: '👥'
    }
    return icons[type] || '📌'
  }

  render() {
    const { loading, notifications } = this.state
    const unreadCount = notifications.filter(n => !n.read).length

    if (loading) {
      return (
        <View className="notifications-page loading">
          <View className="loading-spinner"></View>
          <Text className="loading-text">加载中...</Text>
        </View>
      )
    }

  return (
      <View className="notifications-page">
        {/* 页面头部 */}
        <View className="page-header">
          <View className="header-title">
            <Text className="title-icon">🔔</Text>
            <Text className="title-text">通知中心</Text>
              {unreadCount > 0 && (
              <View className="unread-badge">
                <Text className="badge-text">{unreadCount}</Text>
              </View>
            )}
          </View>
          
          <View className="header-actions">
            <View className="action-btn" onClick={this.handleMarkAllRead} hoverClass="btn-hover">
              <Text className="action-text">全部已读</Text>
            </View>
          </View>
        </View>

      {/* 通知列表 */}
        {notifications.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">📭</Text>
            <Text className="empty-text">暂无通知</Text>
            <Text className="empty-hint">有新消息时会在这里显示</Text>
          </View>
        ) : (
          <ScrollView scrollY className="notifications-list">
            {notifications.map((item) => (
              <View
                key={item.id}
                className={`notification-item ${item.read ? 'read' : 'unread'}`}
                onClick={() => this.handleNotificationClick(item)}
                hoverClass="item-hover"
              >
                <View className="item-icon">
                  <Text className="icon-emoji">{item.icon}</Text>
                </View>
                
                <View className="item-content">
                  <View className="item-header">
                    <Text className="item-title">{item.title}</Text>
                    <Text className="item-time">{item.time}</Text>
                  </View>
                  <Text className="item-text">{item.content}</Text>
                </View>
                
                {!item.read && <View className="unread-dot"></View>}
              </View>
            ))}
          </ScrollView>
        )}

        {/* 底部操作栏 */}
        {notifications.length > 0 && (
          <View className="footer-actions">
            <View className="clear-btn" onClick={this.handleClearAll} hoverClass="btn-hover">
              <Text className="btn-text">清除所有</Text>
            </View>
          </View>
        )}

        {/* 返回按钮 */}
        <View className="back-btn" onClick={this.handleBack} hoverClass="btn-hover">
          <Text className="btn-text">返回</Text>
        </View>
      </View>
    )
  }
}

// Taro 4.x 配置必须独立导出
NotificationsPage.config = {
  navigationBarTitleText: '通知中心',
  enablePullDownRefresh: true,
  navigationBarBackgroundColor: '#ffffff',
  navigationBarTextStyle: 'black'
}
