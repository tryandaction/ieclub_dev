// pages/settings/reset-password/index.js
import { sendVerifyCode, resetPasswordByCode } from '../../../api/auth'

Page({
  data: {
    // 表单数据
    form: {
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: ''
    },

    // 表单错误
    errors: {
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: ''
    },

    // 密码显示状态
    showNewPassword: false,
    showConfirmPassword: false,

    // 验证码状态
    codeSending: false,
    countdown: 0,

    // 加载状态
    loading: false,

    // 步骤：1-输入邮箱验证码, 2-设置新密码
    step: 1
  },

  onLoad(options) {
    console.log('✅ [ResetPassword] 页面加载')
    
    // 如果从URL参数传入邮箱
    if (options.email) {
      this.setData({
        'form.email': options.email
      })
    }
  },

  // ========== 输入处理 ==========

  onEmailInput(e) {
    this.setData({
      'form.email': e.detail.value,
      'errors.email': ''
    })
  },

  onCodeInput(e) {
    this.setData({
      'form.code': e.detail.value,
      'errors.code': ''
    })
  },

  onNewPasswordInput(e) {
    this.setData({
      'form.newPassword': e.detail.value,
      'errors.newPassword': ''
    })
  },

  onConfirmPasswordInput(e) {
    this.setData({
      'form.confirmPassword': e.detail.value,
      'errors.confirmPassword': ''
    })
  },

  // ========== 密码显示切换 ==========

  toggleNewPassword() {
    this.setData({
      showNewPassword: !this.data.showNewPassword
    })
  },

  toggleConfirmPassword() {
    this.setData({
      showConfirmPassword: !this.data.showConfirmPassword
    })
  },

  // ========== 发送验证码 ==========

  async sendCode() {
    const { email } = this.data.form

    // 验证邮箱
    if (!email) {
      this.setData({ 'errors.email': '请输入邮箱' })
      wx.vibrateShort()
      return
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/
    if (!emailRegex.test(email)) {
      this.setData({ 'errors.email': '请使用南科大邮箱' })
      wx.vibrateShort()
      return
    }

    // 防重复发送
    if (this.data.codeSending || this.data.countdown > 0) {
      return
    }

    this.setData({ codeSending: true })

    try {
      console.log('📤 [ResetPassword] 发送验证码:', email)
      await sendVerifyCode(email, 'reset_password')

      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      })

      // 开始倒计时
      this.startCountdown()

    } catch (error) {
      console.error('❌ [ResetPassword] 发送验证码失败:', error)
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none'
      })
    } finally {
      this.setData({ codeSending: false })
    }
  },

  /**
   * 开始倒计时
   */
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

  // ========== 表单验证 ==========

  validateForm() {
    const { email, code, newPassword, confirmPassword } = this.data.form
    const errors = {}
    let isValid = true

    // 验证邮箱
    if (!email) {
      errors.email = '请输入邮箱'
      isValid = false
    } else {
      const emailRegex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/
      if (!emailRegex.test(email)) {
        errors.email = '请使用南科大邮箱'
        isValid = false
      }
    }

    // 验证验证码
    if (!code) {
      errors.code = '请输入验证码'
      isValid = false
    } else if (code.length !== 6) {
      errors.code = '验证码为6位数字'
      isValid = false
    }

    // 验证新密码
    if (!newPassword) {
      errors.newPassword = '请输入新密码'
      isValid = false
    } else if (newPassword.length < 6 || newPassword.length > 20) {
      errors.newPassword = '密码长度为6-20位'
      isValid = false
    }

    // 验证确认密码
    if (!confirmPassword) {
      errors.confirmPassword = '请再次输入新密码'
      isValid = false
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = '两次密码不一致'
      isValid = false
    }

    this.setData({ errors })
    return isValid
  },

  // ========== 提交处理 ==========

  async handleSubmit() {
    console.log('🔐 [ResetPassword] 开始重置密码')

    // 验证表单
    if (!this.validateForm()) {
      wx.vibrateShort()
      return
    }

    // 防重复提交
    if (this.data.loading) {
      return
    }

    const { email, code, newPassword } = this.data.form

    this.setData({ loading: true })

    try {
      console.log('📤 [ResetPassword] 发送重置密码请求:', { email })
      
      // 调用重置密码API
      const result = await resetPasswordByCode({
        email,
        code,
        newPassword
      })

      console.log('✅ [ResetPassword] 重置密码成功:', result)

      // 显示成功提示
      wx.showModal({
        title: '重置成功',
        content: '密码已重置，请使用新密码登录',
        showCancel: false,
        success: () => {
          // 跳转到登录页
          wx.reLaunch({
            url: '/pages/auth/index'
          })
        }
      })

    } catch (error) {
      console.error('❌ [ResetPassword] 重置密码失败:', error)
      
      this.setData({ loading: false })
      
      wx.vibrateShort()
      
      wx.showToast({
        title: error.message || '重置失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 返回登录
   */
  backToLogin() {
    wx.reLaunch({
      url: '/pages/auth/index'
    })
  }
})

