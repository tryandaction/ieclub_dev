// pages/settings/account-binding/index.js
import { bindPhone, getUserInfo } from '../../../api/auth'

Page({
  data: {
    userInfo: null,
    phone: '',
    code: '',
    countdown: 0,
    loading: false,
    codeSending: false
  },

  onLoad() {
    console.log('✅ [AccountBinding] 账号绑定页面加载')
    this.loadUserInfo()
  },

  async loadUserInfo() {
    try {
      const res = await getUserInfo()
      console.log('📱 [AccountBinding] 用户信息:', res.data)
      this.setData({
        userInfo: res.data
      })
    } catch (err) {
      console.error('❌ [AccountBinding] 获取用户信息失败:', err)
      wx.showToast({
        title: '获取信息失败',
        icon: 'error'
      })
    }
  },

  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    })
  },

  onCodeInput(e) {
    this.setData({
      code: e.detail.value
    })
  },

  async sendCode() {
    const { phone, codeSending, countdown } = this.data
    
    if (!phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return
    }

    if (codeSending || countdown > 0) {
      return
    }

    this.setData({ codeSending: true })

    try {
      // TODO: 调用发送验证码API
      console.log('📤 [AccountBinding] 发送验证码:', phone)
      
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      })
      
      this.startCountdown()
    } catch (err) {
      console.error('❌ [AccountBinding] 发送验证码失败:', err)
      wx.showToast({
        title: err.message || '发送失败',
        icon: 'error'
      })
    } finally {
      this.setData({ codeSending: false })
    }
  },

  startCountdown() {
    this.setData({ countdown: 60 })
    const timer = setInterval(() => {
      const countdown = this.data.countdown - 1
      if (countdown <= 0) {
        clearInterval(timer)
        this.setData({ countdown: 0 })
      } else {
        this.setData({ countdown })
      }
    }, 1000)
  },

  async handleBind() {
    const { phone, code, loading } = this.data

    if (loading) return

    if (!phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return
    }

    if (!code || code.length !== 6) {
      wx.showToast({
        title: '请输入6位验证码',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      const res = await bindPhone({ phone, code })
      console.log('✅ [AccountBinding] 绑定成功:', res)
      
      wx.showToast({
        title: '绑定成功',
        icon: 'success'
      })

      setTimeout(() => {
        this.loadUserInfo()
        this.setData({
          phone: '',
          code: ''
        })
      }, 1500)
    } catch (err) {
      console.error('❌ [AccountBinding] 绑定失败:', err)
      wx.showToast({
        title: err.message || '绑定失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
})
