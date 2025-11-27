// pages/notifications/index.js
import request from '../../utils/request'

const typeConfig = {
  like: { icon: '❤️', color: '#ef4444', label: '点赞' },
  comment: { icon: '💬', color: '#3b82f6', label: '评论' },
  reply: { icon: '↩️', color: '#10b981', label: '回复' },
  follow: { icon: '👤', color: '#8b5cf6', label: '关注' },
  want_hear: { icon: '👂', color: '#3b82f6', label: '想听' },
  can_tell: { icon: '🎤', color: '#8b5cf6', label: '我能讲' },
  topic_threshold_reached: { icon: '🎉', color: '#10b981', label: '成团' },
  project_interest: { icon: '🚀', color: '#10b981', label: '感兴趣' },
  match: { icon: '✨', color: '#f59e0b', label: '匹配' },
  system: { icon: '🔔', color: '#6b7280', label: '系统' }
}

Page({
  data: {
    notifications: [],
    loading: true,
    filter: 'all', // all, unread
    page: 1,
    hasMore: true,
    typeConfig
  },

  onLoad() {
    this.loadNotifications()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true })
    this.loadNotifications(true)
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadNotifications()
    }
  },

  // 加载通知列表
  async loadNotifications(refresh = false) {
    try {
      if (refresh) {
        this.setData({ loading: true, notifications: [] })
      }

      const res = await request('/notifications', {
        method: 'GET',
        data: {
          page: this.data.page,
          limit: 20,
          unreadOnly: this.data.filter === 'unread'
        }
      })

      const list = res.data?.data || res.data || []
      const pagination = res.data?.pagination || {}

      this.setData({
        notifications: refresh ? list : [...this.data.notifications, ...list],
        loading: false,
        page: this.data.page + 1,
        hasMore: list.length >= 20
      })

      wx.stopPullDownRefresh()
    } catch (error) {
      console.error('加载通知失败:', error)
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  // 切换筛选
  changeFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ filter, page: 1, hasMore: true })
    this.loadNotifications(true)
  },

  // 标记已读
  async markAsRead(e) {
    const { id } = e.currentTarget.dataset
    try {
      await request(`/notifications/${id}/read`, { method: 'PUT' })
      
      const notifications = this.data.notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      )
      this.setData({ notifications })
    } catch (error) {
      console.error('标记失败:', error)
    }
  },

  // 全部标记已读
  async markAllAsRead() {
    try {
      await request('/notifications/read-all', { method: 'PUT' })
      
      const notifications = this.data.notifications.map(n => ({ ...n, isRead: true }))
      this.setData({ notifications })
      
      wx.showToast({ title: '已全部标记', icon: 'success' })
    } catch (error) {
      console.error('操作失败:', error)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 点击通知
  handleNotificationTap(e) {
    const { id, link, isRead } = e.currentTarget.dataset
    
    // 标记已读
    if (!isRead) {
      this.markAsRead({ currentTarget: { dataset: { id } } })
    }

    // 跳转
    if (link) {
      // 处理链接格式
      let url = link
      if (link.startsWith('/topic/')) {
        url = `/pages/topic-detail/topic-detail?id=${link.replace('/topic/', '')}`
      } else if (link.startsWith('/user/')) {
        url = `/pages/user-profile/index?userId=${link.replace('/user/', '')}`
      }
      
      wx.navigateTo({ url }).catch(() => {
        wx.switchTab({ url: '/pages/plaza/index' })
      })
    }
  },

  // 格式化时间
  formatTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
    
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
})
