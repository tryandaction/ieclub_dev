// pages/forgot-password/index.js
import { sendVerifyCode, verifyCode, resetPassword } from '../../api/auth'

Page({
  data: {
    step: 1, // 1: 发送验证码, 2: 验证验证码, 3: 重置密码
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
    
    // UI状态
    countdown: 0,
    codeSending: false,
    verifying: false,
    resetting: false,
    showPassword: false,
    showConfirmPassword: false,
    
    // 错误信息
    errors: {
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: ''
    }
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '忘记密码' })
  },

  // ========== 输入处理 ==========
  onEmailInput(e) {
    this.setData({ 
      email: e.detail.value,
      'errors.email': ''
    })
  },

  onCodeInput(e) {
    this.setData({ 
      code: e.detail.value,
      'errors.code': ''
    })
  },

  onNewPasswordInput(e) {
    this.setData({ 
      newPassword: e.detail.value,
      'errors.newPassword': ''
    })
  },

  onConfirmPasswordInput(e) {
    this.setData({ 
      confirmPassword: e.detail.value,
      'errors.confirmPassword': ''
    })
  },

  // ========== 密码显示切换 ==========
  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword })
  },

  toggleConfirmPassword() {
    this.setData({ showConfirmPassword: !this.data.showConfirmPassword })
  },

  // ========== 步骤1: 发送验证码 ==========
  async handleSendCode() {
    const { email, countdown, codeSending } = this.data

    // 防重复点击
    if (countdown > 0 || codeSending) return

    // 验证邮箱
    if (!email) {
      this.setData({ 'errors.email': '请输入邮箱' })
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      this.setData({ 'errors.email': '邮箱格式不正确' })
      return
    }

    this.setData({ codeSending: true })

    try {
      const res = await sendVerifyCode(email, 'reset_password')
      
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      })

      // 开始倒计时
      this.startCountdown()

      // 进入下一步
      this.setData({ step: 2 })

    } catch (error) {
      console.error('发送验证码失败:', error)
      this.setData({ 
        'errors.email': error.message || '发送失败，请重试'
      })
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none'
      })
    } finally {
      this.setData({ codeSending: false })
    }
  },

  // 重新发送验证码
  async resendCode() {
    const { countdown } = this.data
    if (countdown > 0) return

    await this.handleSendCode()
  },

  // 倒计时
  startCountdown() {
    let countdown = 60
    this.setData({ countdown })

    const timer = setInterval(() => {
      countdown--
      if (countdown <= 0) {
        clearInterval(timer)
        this.setData({ countdown: 0 })
      } else {
        this.setData({ countdown })
      }
    }, 1000)
  },

  // ========== 步骤2: 验证验证码 ==========
  async handleVerifyCode() {
    const { email, code, verifying } = this.data

    if (verifying) return

    // 验证输入
    if (!code) {
      this.setData({ 'errors.code': '请输入验证码' })
      return
    }

    if (code.length !== 6) {
      this.setData({ 'errors.code': '验证码为6位数字' })
      return
    }

    this.setData({ verifying: true })

    try {
      await verifyCode(email, code)
      
      wx.showToast({
        title: '验证成功',
        icon: 'success'
      })

      // 进入下一步
      this.setData({ step: 3 })

    } catch (error) {
      console.error('验证失败:', error)
      this.setData({ 
        'errors.code': error.message || '验证码错误或已过期'
      })
      wx.showToast({
        title: error.message || '验证失败',
        icon: 'none'
      })
    } finally {
      this.setData({ verifying: false })
    }
  },

  // ========== 步骤3: 重置密码 ==========
  async handleResetPassword() {
    const { email, code, newPassword, confirmPassword, resetting } = this.data

    if (resetting) return

    // 验证输入
    if (!newPassword) {
      this.setData({ 'errors.newPassword': '请输入新密码' })
      return
    }

    if (newPassword.length < 6 || newPassword.length > 20) {
      this.setData({ 'errors.newPassword': '密码长度为6-20个字符' })
      return
    }

    if (!confirmPassword) {
      this.setData({ 'errors.confirmPassword': '请确认密码' })
      return
    }

    if (newPassword !== confirmPassword) {
      this.setData({ 'errors.confirmPassword': '两次密码不一致' })
      return
    }

    this.setData({ resetting: true })

    try {
      await resetPassword(email, code, newPassword)
      
      wx.showToast({
        title: '密码重置成功',
        icon: 'success',
        duration: 2000
      })

      // 2秒后返回登录页
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)

    } catch (error) {
      console.error('重置密码失败:', error)
      wx.showToast({
        title: error.message || '重置失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ resetting: false })
    }
  },

  // ========== 返回上一步 ==========
  goBack() {
    if (this.data.step > 1) {
      this.setData({ step: this.data.step - 1 })
    } else {
      wx.navigateBack()
    }
  }
})
