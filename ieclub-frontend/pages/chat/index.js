// pages/chat/index.js
// 聊天详情页
import request from '../../utils/request'

Page({
  data: {
    conversationId: '',
    userId: '',
    nickname: '',
    avatar: '',
    messages: [],
    inputValue: '',
    loading: true,
    sending: false,
    currentUserId: '',
    scrollToMessage: ''
  },

  onLoad(options) {
    const { conversationId, userId, nickname, avatar } = options
    const userInfo = wx.getStorageSync('userInfo')
    
    this.setData({
      conversationId,
      userId,
      nickname: decodeURIComponent(nickname || ''),
      avatar: decodeURIComponent(avatar || ''),
      currentUserId: userInfo?.id || ''
    })

    if (conversationId) {
      this.loadMessages()
    }
  },

  // 加载消息
  async loadMessages() {
    try {
      this.setData({ loading: true })

      const res = await request(`/messages/conversation/${this.data.conversationId}/messages`, {
        method: 'GET',
        data: { limit: 50 }
      })

      const messages = res.data?.data || res.data || []
      
      this.setData({
        messages,
        loading: false,
        scrollToMessage: messages.length > 0 ? `msg-${messages.length - 1}` : ''
      })
    } catch (error) {
      console.error('加载消息失败:', error)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 输入消息
  onInput(e) {
    this.setData({ inputValue: e.detail.value })
  },

  // 发送消息
  async sendMessage() {
    const content = this.data.inputValue.trim()
    if (!content || this.data.sending) return

    try {
      this.setData({ sending: true })

      const res = await request('/messages/send', {
        method: 'POST',
        data: {
          receiverId: this.data.userId,
          content
        }
      })

      const newMessage = res.data || res
      const messages = [...this.data.messages, newMessage]

      this.setData({
        messages,
        inputValue: '',
        sending: false,
        scrollToMessage: `msg-${messages.length - 1}`
      })
    } catch (error) {
      console.error('发送失败:', error)
      this.setData({ sending: false })
      wx.showToast({ title: '发送失败', icon: 'none' })
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
    
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    if (diff < 86400000) return `${hours}:${minutes}`
    
    return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`
  },

  // 查看用户主页
  goToProfile() {
    wx.navigateTo({
      url: `/pages/user-profile/index?userId=${this.data.userId}`
    })
  }
})
