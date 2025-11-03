// pages/settings/delete-account/index.js
import { deleteAccount } from '../../../api/auth'

Page({
  data: {
    // 表单数据
    password: '',
    reason: '',
    reasonOptions: [
      { value: 'privacy', label: '隐私担忧', icon: '🔒' },
      { value: 'inactive', label: '不再使用', icon: '📴' },
      { value: 'duplicate', label: '有多个账号', icon: '👥' },
      { value: 'dissatisfied', label: '体验不满意', icon: '😞' },
      { value: 'other', label: '其他原因', icon: '💭' }
    ],
    selectedReason: '',

    // 密码显示
    showPassword: false,

    // 确认状态
    confirmed: false,

    // 加载状态
    loading: false
  },

  onLoad(options) {
    console.log('✅ [DeleteAccount] 页面加载')
  },

  // ========== 输入处理 ==========

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  onReasonInput(e) {
    this.setData({
      reason: e.detail.value
    })
  },

  // ========== 选择原因 ==========

  selectReason(e) {
    const { value } = e.currentTarget.dataset
    this.setData({
      selectedReason: value
    })
  },

  // ========== 密码显示切换 ==========

  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    })
  },

  // ========== 确认勾选 ==========

  toggleConfirm() {
    this.setData({
      confirmed: !this.data.confirmed
    })
  },

  // ========== 提交注销 ==========

  async handleSubmit() {
    console.log('🗑️ [DeleteAccount] 开始注销账号')

    const { password, selectedReason, reason, confirmed } = this.data

    // 验证密码
    if (!password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      })
      wx.vibrateShort()
      return
    }

    // 验证确认勾选
    if (!confirmed) {
      wx.showToast({
        title: '请先确认注销条款',
        icon: 'none'
      })
      wx.vibrateShort()
      return
    }

    // 防重复提交
    if (this.data.loading) {
      return
    }

    // 二次确认
    const confirmResult = await new Promise(resolve => {
      wx.showModal({
        title: '⚠️ 最后确认',
        content: '注销账号后，所有数据将无法恢复！确定要注销吗？',
        confirmText: '确认注销',
        confirmColor: '#ef4444',
        cancelText: '我再想想',
        success: (res) => resolve(res.confirm)
      })
    })

    if (!confirmResult) {
      return
    }

    this.setData({ loading: true })

    try {
      // 组装注销原因
      let fullReason = selectedReason
      if (reason.trim()) {
        fullReason += `: ${reason.trim()}`
      }

      console.log('📤 [DeleteAccount] 发送注销请求')
      
      // 调用注销API
      const result = await deleteAccount({
        password,
        reason: fullReason
      })

      console.log('✅ [DeleteAccount] 注销成功:', result)

      // 清除本地存储
      wx.removeStorageSync('token')
      wx.removeStorageSync('userInfo')

      // 显示成功提示
      wx.showModal({
        title: '注销成功',
        content: '您的账号已成功注销，感谢您曾经的使用',
        showCancel: false,
        confirmText: '确定',
        success: () => {
          // 跳转到登录页
          wx.reLaunch({
            url: '/pages/auth/index'
          })
        }
      })

    } catch (error) {
      console.error('❌ [DeleteAccount] 注销失败:', error)
      
      this.setData({ loading: false })
      
      wx.vibrateShort()
      
      wx.showToast({
        title: error.message || '注销失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 返回上一页
   */
  navigateBack() {
    wx.navigateBack()
  }
})

