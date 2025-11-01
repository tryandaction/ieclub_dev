// pages/activity-detail/activity-detail.js
const app = getApp()
const api = require('../../utils/api')

Page({
  data: {
    activityId: '',
    activity: null,
    loading: true,
    isParticipating: false,
    hasCheckedIn: false,
    isOrganizer: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ activityId: options.id })
      this.loadActivityDetail()
    }
  },

  /**
   * 加载活动详情
   */
  async loadActivityDetail() {
    try {
      this.setData({ loading: true })
      
      const res = await api.request({
        url: `/activities/${this.data.activityId}`,
        method: 'GET'
      })

      const activity = res.data
      const currentUserId = wx.getStorageSync('userId')
      
      this.setData({
        activity,
        isParticipating: activity.isParticipating || false,
        hasCheckedIn: activity.hasCheckedIn || false,
        isOrganizer: activity.organizer?.id === currentUserId,
        loading: false
      })
    } catch (error) {
      console.error('加载活动详情失败:', error)
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  /**
   * 报名/取消报名
   */
  async handleParticipate() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }

    try {
      wx.showLoading({ title: '处理中...' })
      
      await api.request({
        url: `/activities/${this.data.activityId}/participate`,
        method: 'POST'
      })

      wx.hideLoading()
      wx.showToast({
        title: this.data.isParticipating ? '已取消报名' : '报名成功',
        icon: 'success'
      })

      this.setData({
        isParticipating: !this.data.isParticipating
      })

      // 重新加载详情
      this.loadActivityDetail()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      })
    }
  },

  /**
   * 扫码签到
   */
  async handleScanCheckIn() {
    try {
      // 调用微信扫码 API
      const scanRes = await wx.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode']
      })

      const qrData = JSON.parse(scanRes.result)
      
      // 验证二维码类型
      if (qrData.type !== 'activity_checkin') {
        wx.showToast({
          title: '无效的签到二维码',
          icon: 'none'
        })
        return
      }

      // 验证活动ID
      if (qrData.activityId !== this.data.activityId) {
        wx.showToast({
          title: '二维码与当前活动不匹配',
          icon: 'none'
        })
        return
      }

      // 检查是否过期
      const expiresAt = new Date(qrData.expiresAt)
      if (new Date() > expiresAt) {
        wx.showToast({
          title: '签到二维码已过期',
          icon: 'none'
        })
        return
      }

      // 执行签到
      wx.showLoading({ title: '签到中...' })
      
      await api.request({
        url: `/activities/${this.data.activityId}/checkin`,
        method: 'POST',
        data: {
          token: qrData.token
        }
      })

      wx.hideLoading()
      wx.showToast({
        title: '签到成功 ✅',
        icon: 'success'
      })

      this.setData({
        hasCheckedIn: true
      })

      // 重新加载详情
      this.loadActivityDetail()
    } catch (error) {
      wx.hideLoading()
      console.error('签到失败:', error)
      wx.showToast({
        title: error.message || '签到失败',
        icon: 'none'
      })
    }
  },

  /**
   * 生成签到二维码（组织者）
   */
  async handleGenerateQRCode() {
    try {
      wx.showLoading({ title: '生成中...' })
      
      const res = await api.request({
        url: `/activities/${this.data.activityId}/qrcode`,
        method: 'POST'
      })

      wx.hideLoading()
      
      // 跳转到二维码展示页面
      wx.navigateTo({
        url: `/pages/qrcode-display/qrcode-display?data=${encodeURIComponent(JSON.stringify(res.data))}`
      })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '生成失败',
        icon: 'none'
      })
    }
  },

  /**
   * 查看签到统计（组织者）
   */
  async handleViewStats() {
    try {
      wx.showLoading({ title: '加载中...' })
      
      const res = await api.request({
        url: `/activities/${this.data.activityId}/checkin-stats`,
        method: 'GET'
      })

      wx.hideLoading()
      
      // 跳转到统计页面
      wx.navigateTo({
        url: `/pages/checkin-stats/checkin-stats?data=${encodeURIComponent(JSON.stringify(res.data))}`
      })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 格式化时间
   */
  formatTime(dateString) {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  /**
   * 检查活动是否正在进行
   */
  isActivityOngoing() {
    if (!this.data.activity) return false
    const now = new Date()
    const start = new Date(this.data.activity.startTime)
    const end = new Date(this.data.activity.endTime)
    return now >= start && now <= end
  },

  /**
   * 分享活动
   */
  onShareAppMessage() {
    return {
      title: this.data.activity?.title || '精彩活动',
      path: `/pages/activity-detail/activity-detail?id=${this.data.activityId}`,
      imageUrl: this.data.activity?.images?.[0] || ''
    }
  }
})

