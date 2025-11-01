// pages/auth/index.js
import { login, register, sendVerifyCode } from '../../api/auth'

Page({
  data: {
    tabIndex: 0, // 0: 登录, 1: 注册
    showPassword: false,
    showConfirmPassword: false,
    loginForm: {
      email: '',
      password: ''
    },
    registerForm: {
      email: '',
      code: '',
      password: '',
      confirmPassword: ''
    },
    loginLoading: false,
    registerLoading: false,
    codeSending: false,
    countdown: 0,
    statusBarHeight: 0,
    navBarHeight: 0
  },

  onLoad() {
    console.log('✅ 认证页加载成功')
    console.log('📡 API Base URL:', getApp().globalData.apiBase)
    
    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 0
    const navBarHeight = statusBarHeight + 44 // 导航栏高度 = 状态栏高度 + 44px
    
    console.log('📱 系统信息:', {
      statusBarHeight,
      navBarHeight,
      platform: systemInfo.platform,
      version: systemInfo.version
    })
    
    this.setData({
      statusBarHeight,
      navBarHeight
    })
    
    // 检查是否已登录
    const token = wx.getStorageSync('token')
    if (token) {
      console.log('🔑 已有 Token，跳转到广场')
      wx.switchTab({
        url: '/pages/plaza/index'
      })
    }
  },

  // 切换 Tab
  switchTab(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      tabIndex: index
    })
  },

  // 登录表单输入
  onLoginEmailInput(e) {
    this.setData({
      'loginForm.email': e.detail.value
    })
  },

  onLoginPasswordInput(e) {
    this.setData({
      'loginForm.password': e.detail.value
    })
  },

  // 注册表单输入
  onRegisterEmailInput(e) {
    this.setData({
      'registerForm.email': e.detail.value
    })
  },

  onRegisterCodeInput(e) {
    this.setData({
      'registerForm.code': e.detail.value
    })
  },

  onRegisterPasswordInput(e) {
    this.setData({
      'registerForm.password': e.detail.value
    })
  },

  onRegisterConfirmPasswordInput(e) {
    this.setData({
      'registerForm.confirmPassword': e.detail.value
    })
  },

  // 切换密码显示
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    })
  },

  toggleConfirmPassword() {
    this.setData({
      showConfirmPassword: !this.data.showConfirmPassword
    })
  },

  // 发送验证码
  async sendCode() {
    const { email } = this.data.registerForm
    
    console.log('📧 发送验证码 - 邮箱:', email)
    
    if (!email) {
      wx.showToast({
        title: '请输入邮箱',
        icon: 'none'
      })
      return
    }

    // 验证邮箱格式（南科大邮箱）
    const emailRegex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/
    if (!emailRegex.test(email)) {
      wx.showToast({
        title: '请使用南科大邮箱',
        icon: 'none',
        duration: 2000
      })
      return
    }

    this.setData({ codeSending: true })

    try {
      console.log('📤 正在发送验证码请求...')
      const result = await sendVerifyCode(email, 'register')
      console.log('✅ 验证码发送成功:', result)
      
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      })

      // 开始倒计时
      this.startCountdown()
    } catch (error) {
      console.error('❌ 发送验证码失败:', error)
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ codeSending: false })
    }
  },

  // 倒计时
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

  // 登录
  async handleLogin() {
    const { email, password } = this.data.loginForm

    console.log('🔐 开始登录 - 邮箱:', email)

    // 验证表单
    if (!email || !password) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    // 验证邮箱格式（南科大邮箱）
    const emailRegex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/
    if (!emailRegex.test(email)) {
      wx.showToast({
        title: '请使用南科大邮箱',
        icon: 'none',
        duration: 2000
      })
      return
    }

    this.setData({ loginLoading: true })

    try {
      console.log('📤 正在发送登录请求...')
      const result = await login({ email, password })
      console.log('✅ 登录成功:', result)
      
      const { token, user } = result
      
      // 存储 Token 和用户信息
      wx.setStorageSync('token', token)
      wx.setStorageSync('user', user)

      // 更新全局状态
      const app = getApp()
      app.globalData.isLogin = true
      app.globalData.token = token
      app.globalData.userInfo = user

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/plaza/index'
        })
      }, 1500)

    } catch (error) {
      console.error('❌ 登录失败:', error)
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ loginLoading: false })
    }
  },

  // 注册
  async handleRegister() {
    const { email, code, password, confirmPassword } = this.data.registerForm

    console.log('📝 开始注册 - 邮箱:', email)

    // 验证表单
    if (!email || !code || !password || !confirmPassword) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    // 验证邮箱格式（南科大邮箱）
    const emailRegex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/
    if (!emailRegex.test(email)) {
      wx.showToast({
        title: '请使用南科大邮箱',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次密码不一致',
        icon: 'none'
      })
      return
    }

    if (password.length < 6 || password.length > 20) {
      wx.showToast({
        title: '密码长度为6-20位',
        icon: 'none'
      })
      return
    }

    this.setData({ registerLoading: true })

    try {
      console.log('📤 正在发送注册请求...')
      const result = await register({
        email,
        password,
        verificationCode: code
      })
      console.log('✅ 注册成功:', result)

      wx.showToast({
        title: '注册成功',
        icon: 'success'
      })

      // 切换到登录页
      setTimeout(() => {
        this.setData({
          tabIndex: 0,
          registerForm: {
            email: '',
            code: '',
            password: '',
            confirmPassword: ''
          }
        })
      }, 1500)

    } catch (error) {
      console.error('❌ 注册失败:', error)
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      wx.showToast({
        title: error.message || '注册失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ registerLoading: false })
    }
  },

  // 跳转到忘记密码
  goToForgotPassword() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转到微信登录
  goToWechatLogin() {
    wx.navigateTo({
      url: '/pages/login/index'
    })
  }
})

