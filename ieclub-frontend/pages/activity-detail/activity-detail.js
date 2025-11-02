// pages/activity-detail/activity-detail.js
import { getActivityDetail, toggleParticipation, checkIn, generateCheckInQRCode, getCheckInStats } from '../../api/activity'

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
      
      const activity = await getActivityDetail(this.data.activityId)
      
      // 获取当前用户信息
      const userStr = wx.getStorageSync('user')
      const currentUserId = userStr ? JSON.parse(userStr).id : null
      
      this.setData({
        activity,
        isParticipating: activity.isParticipating || false,
        hasCheckedIn: activity.hasCheckedIn || false,
        isOrganizer: activity.organizer?.id === currentUserId,
        loading: false
      })

      console.log('✅ 加载活动详情成功:', {
        id: activity.id,
        title: activity.title,
        isParticipating: activity.isParticipating,
        isOrganizer: activity.organizer?.id === currentUserId
      })
    } catch (error) {
      console.error('❌ 加载活动详情失败:', error)
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
        duration: 2000
      })
      this.setData({ loading: false })
      
      // 如果加载失败，返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)
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
        icon: 'none',
        duration: 1500
      })
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/auth/index'
        })
      }, 1500)
      return
    }

    try {
      wx.showLoading({ title: '处理中...' })
      
      const result = await toggleParticipation(this.data.activityId)

      wx.hideLoading()
      
      this.setData({
        isParticipating: result.isParticipating
      })

      wx.showToast({
        title: result.isParticipating ? '报名成功 ✅' : '已取消报名',
        icon: 'success',
        duration: 1500
      })

      // 重新加载详情以更新参与人数
      this.loadActivityDetail()
    } catch (error) {
      wx.hideLoading()
      console.error('❌ 报名操作失败:', error)
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 扫码签到
   */
  async handleScanCheckIn() {
    try {
      // 调用微信扫码 API
      wx.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode'],
        success: async (scanRes) => {
          try {
            const qrData = JSON.parse(scanRes.result)
            
            // 验证二维码类型
            if (qrData.type !== 'activity_checkin') {
              wx.showToast({
                title: '无效的签到二维码',
                icon: 'none',
                duration: 2000
              })
              return
            }

            // 验证活动ID
            if (qrData.activityId != this.data.activityId) {
              wx.showToast({
                title: '二维码与当前活动不匹配',
                icon: 'none',
                duration: 2000
              })
              return
            }

            // 检查是否过期
            const expiresAt = new Date(qrData.expiresAt)
            if (new Date() > expiresAt) {
              wx.showToast({
                title: '签到二维码已过期',
                icon: 'none',
                duration: 2000
              })
              return
            }

            // 执行签到
            wx.showLoading({ title: '签到中...' })
            
            await checkIn(this.data.activityId, qrData.token)

            wx.hideLoading()
            wx.showToast({
              title: '签到成功 ✅',
              icon: 'success',
              duration: 1500
            })

            this.setData({
              hasCheckedIn: true
            })

            // 重新加载详情
            this.loadActivityDetail()
          } catch (error) {
            wx.hideLoading()
            console.error('❌ 签到失败:', error)
            wx.showToast({
              title: error.message || '签到失败',
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: (error) => {
          console.error('❌ 扫码失败:', error)
          if (error.errMsg !== 'scanCode:fail cancel') {
            wx.showToast({
              title: '扫码失败',
              icon: 'none',
              duration: 2000
            })
          }
        }
      })
    } catch (error) {
      console.error('❌ 扫码签到失败:', error)
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 生成签到二维码（组织者）
   */
  async handleGenerateQRCode() {
    try {
      wx.showLoading({ title: '生成中...' })
      
      const qrCodeData = await generateCheckInQRCode(this.data.activityId, 300)

      wx.hideLoading()
      
      console.log('✅ 生成签到二维码成功:', qrCodeData)
      
      // 跳转到二维码展示页面
      wx.navigateTo({
        url: `/pages/qrcode-display/qrcode-display?activityId=${this.data.activityId}&data=${encodeURIComponent(JSON.stringify(qrCodeData))}`
      })
    } catch (error) {
      wx.hideLoading()
      console.error('❌ 生成签到二维码失败:', error)
      wx.showToast({
        title: error.message || '生成失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 查看签到统计（组织者）
   */
  async handleViewStats() {
    try {
      wx.showLoading({ title: '加载中...' })
      
      const stats = await getCheckInStats(this.data.activityId)

      wx.hideLoading()
      
      console.log('✅ 获取签到统计成功:', stats)
      
      // 跳转到统计页面
      wx.navigateTo({
        url: `/pages/checkin-stats/checkin-stats?activityId=${this.data.activityId}&data=${encodeURIComponent(JSON.stringify(stats))}`
      })
    } catch (error) {
      wx.hideLoading()
      console.error('❌ 获取签到统计失败:', error)
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
        duration: 2000
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

