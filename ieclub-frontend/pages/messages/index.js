// pages/messages/index.js
// 私信会话列表页
import request from '../../utils/request'

Page({
  data: {
    conversations: [],
    loading: true,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadConversations()
  },

  onShow() {
    // 每次显示页面时刷新
    this.loadConversations(true)
  },

  onPullDownRefresh() {
    this.loadConversations(true)
  },

  // 加载会话列表
  async loadConversations(refresh = false) {
    try {
      if (refresh) {
        this.setData({ page: 1, loading: true })
      }

      const res = await request('/messages/conversations', {
        method: 'GET',
        data: { page: this.data.page, limit: 20 }
      })

      const data = res.data?.data || res.data || []
      
      this.setData({
        conversations: refresh ? data : [...this.data.conversations, ...data],
        hasMore: data.length >= 20,
        loading: false
      })

      if (refresh) wx.stopPullDownRefresh()
    } catch (error) {
      console.error('加载会话列表失败:', error)
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  // 进入聊天
  goToChat(e) {
    const { id, user } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/chat/index?conversationId=${id}&userId=${user.id}&nickname=${encodeURIComponent(user.nickname)}&avatar=${encodeURIComponent(user.avatar || '')}`
    })
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

    return `${date.getMonth() + 1}/${date.getDate()}`
  }
})
