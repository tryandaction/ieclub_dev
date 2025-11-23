// pages/auth/index.js
import { login, loginWithCode, register, sendVerifyCode } from '../../api/auth'

/**
 * 认证页面（登录/注册）
 * 专业高端版本 - 2025年11月3日重制
 */
Page({
  data: {
    // Tab 状态
    tabIndex: 0, // 0: 登录, 1: 注册
    
    // 显示控制
    showPassword: false,
    showConfirmPassword: false,
    loginType: 'password', // password 或 code
    
    // 登录表单
    loginForm: {
      email: '',
      password: '',
      code: ''
    },
    
    // 注册表单
    registerForm: {
      email: '',
      code: '',
      password: '',
      confirmPassword: ''
    },
    
    // 表单验证错误
    loginErrors: {
      email: '',
      password: ''
    },
    
    registerErrors: {
      email: '',
      code: '',
      password: '',
      confirmPassword: ''
    },
    
    // 加载状态
    loginLoading: false,
    registerLoading: false,
    codeSending: false,
    countdown: 0,
    
    // 系统信息
    statusBarHeight: 0,
    navBarHeight: 0
  },

  /**
   * 页面加载
   */
  onLoad(options) {
    console.log('✅ [Auth] 认证页面加载')
    console.log('📡 [Auth] API Base URL:', getApp().globalData.apiBase)
    
    // 检查来源参数，决定默认显示登录还是注册
    const tab = options.tab || '0'
    const tabIndex = parseInt(tab)
    console.log('📋 [Auth] 默认Tab:', tabIndex === 0 ? '登录' : '注册')
    
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 0
    const navBarHeight = statusBarHeight + 44
    
    console.log('📱 [Auth] 系统信息:', {
      statusBarHeight,
      navBarHeight,
      platform: systemInfo.platform,
      version: systemInfo.version,
      screenWidth: systemInfo.screenWidth,
      screenHeight: systemInfo.screenHeight
    })
    
    this.setData({
      tabIndex,
      statusBarHeight,
      navBarHeight
    })
    
    // 检查登录状态
    this.checkLoginStatus()
  },

  /**
   * 页面显示时
   */
  onShow() {
    console.log('👁️ [Auth] 页面显示')
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const user = wx.getStorageSync('user')
    
    if (token && user) {
      console.log('🔑 [Auth] 用户已登录，跳转到广场')
      wx.switchTab({
        url: '/pages/plaza/index',
        fail: (err) => {
          console.error('❌ [Auth] 跳转失败:', err)
        }
      })
    } else {
      console.log('🔓 [Auth] 用户未登录')
    }
  },

  /**
   * 切换 Tab
   */
  switchTab(e) {
    const index = e.currentTarget.dataset.index
    console.log('🔄 [Auth] 切换Tab:', index === 0 ? '登录' : '注册')
    
    this.setData({
      tabIndex: index
    })
    
    // 清除表单错误
    this.clearErrors()
  },

  /**
   * 清除表单错误
   */
  clearErrors() {
    this.setData({
      loginErrors: { email: '', password: '' },
      registerErrors: { email: '', code: '', password: '', confirmPassword: '' }
    })
  },

  // ==================== 登录相关 ====================

  /**
   * 登录表单 - 邮箱输入
   */
  onLoginEmailInput(e) {
    const email = e.detail.value
    this.setData({
      'loginForm.email': email,
      'loginErrors.email': ''
    })
  },

  /**
   * 登录表单 - 密码输入
   */
  onLoginPasswordInput(e) {
    const password = e.detail.value
    this.setData({
      'loginForm.password': password,
      'loginErrors.password': ''
    })
  },

  /**
   * 切换密码显示（用于登录和注册）
   */
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    })
    console.log('👁️ [Auth] 切换密码显示状态:', this.data.showPassword)
  },

  /**
   * 切换登录方式
   */
  switchLoginType() {
    const newType = this.data.loginType === 'password' ? 'code' : 'password'
    console.log('🔄 [Auth] 切换登录方式:', newType)
    this.setData({
      loginType: newType,
      'loginForm.password': '',
      'loginForm.code': '',
      loginErrors: {}
    })
  },

  /**
   * 登录验证码输入
   */
  onLoginCodeInput(e) {
    this.setData({
      'loginForm.code': e.detail.value,
      'loginErrors.code': ''
    })
  },

  /**
   * 发送登录验证码
   */
  async sendLoginCode() {
    const { email } = this.data.loginForm
    
    if (!email) {
      this.setData({ 'loginErrors.email': '请输入邮箱' })
      wx.vibrateShort()
      return
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/
    if (!emailRegex.test(email)) {
      this.setData({ 'loginErrors.email': '请使用南科大邮箱' })
      wx.vibrateShort()
      return
    }

    this.setData({ codeSending: true })

    try {
      await sendVerifyCode(email, 'login')
      wx.showToast({
        title: '验证码已发送',
        icon: 'success',
        duration: 1500
      })
      this.startCountdown()
    } catch (error) {
      console.error('❌ [Auth] 发送验证码失败:', error)
      this.setData({ codeSending: false })
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 验证登录表单
   */
  validateLoginForm() {
    const { email, password, code } = this.data.loginForm
    const { loginType } = this.data
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

    // 根据登录方式验证
    if (loginType === 'password') {
      if (!password) {
        errors.password = '请输入密码'
        isValid = false
      } else if (password.length < 6) {
        errors.password = '密码长度至少6位'
        isValid = false
      }
    } else {
      if (!code) {
        errors.code = '请输入验证码'
        isValid = false
      } else if (code.length !== 6) {
        errors.code = '验证码为6位数字'
        isValid = false
      }
    }

    this.setData({ loginErrors: errors })
    return isValid
  },

  /**
   * 处理登录
   */
  async handleLogin() {
    console.log('🔐 [Auth] 开始登录流程')

    // 验证表单
    if (!this.validateLoginForm()) {
      console.log('❌ [Auth] 表单验证失败')
      wx.vibrateShort()
      return
    }

    const { email, password, code } = this.data.loginForm
    const { loginType } = this.data

    this.setData({ loginLoading: true })

    try {
      console.log('📤 [Auth] 发送登录请求:', { 
        email: email.substring(0, 3) + '***',  // 只显示前3个字符
        loginType,
        hasPassword: !!password,
        hasCode: !!code
      })
      
      let result
      if (loginType === 'password') {
        console.log('🔑 [Auth] 使用密码登录')
        result = await login({ email, password })
      } else {
        console.log('🔢 [Auth] 使用验证码登录')
        result = await loginWithCode({ email, code })
      }
      
      console.log('✅ [Auth] 登录成功')
      
      const { token, accessToken, refreshToken, user } = result
      
      // 存储登录信息（支持新旧格式）
      const finalAccessToken = accessToken || token
      wx.setStorageSync('token', finalAccessToken)
      if (refreshToken) {
        wx.setStorageSync('refreshToken', refreshToken)
      }
      wx.setStorageSync('user', user)
      
      console.log('💾 [Auth] 已保存Token和用户信息', { 
        hasAccessToken: !!finalAccessToken, 
        hasRefreshToken: !!refreshToken 
      })

      // 更新全局状态
      const app = getApp()
      app.globalData.isLogin = true
      app.globalData.token = finalAccessToken
      app.globalData.userInfo = user

      // 显示成功提示
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })

      // 延迟跳转到首页
      setTimeout(() => {
        console.log('🚀 [Auth] 跳转到广场页面')
        wx.switchTab({
          url: '/pages/plaza/index',
          success: () => {
            console.log('✅ [Auth] 跳转成功')
          },
          fail: (err) => {
            console.error('❌ [Auth] 跳转失败:', err)
          }
        })
      }, 1500)

    } catch (error) {
      console.error('❌ [Auth] 登录失败:', error)
      
      this.setData({ loginLoading: false })
      
      wx.vibrateShort()
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // ==================== 注册相关 ====================

  /**
   * 注册表单 - 邮箱输入
   */
  onRegisterEmailInput(e) {
    const email = e.detail.value
    this.setData({
      'registerForm.email': email,
      'registerErrors.email': ''
    })
  },

  /**
   * 注册表单 - 验证码输入
   */
  onRegisterCodeInput(e) {
    const code = e.detail.value
    this.setData({
      'registerForm.code': code,
      'registerErrors.code': ''
    })
  },

  /**
   * 注册表单 - 密码输入
   */
  onRegisterPasswordInput(e) {
    const password = e.detail.value
    this.setData({
      'registerForm.password': password,
      'registerErrors.password': ''
    })
  },

  /**
   * 注册表单 - 确认密码输入
   */
  onRegisterConfirmPasswordInput(e) {
    const confirmPassword = e.detail.value
    this.setData({
      'registerForm.confirmPassword': confirmPassword,
      'registerErrors.confirmPassword': ''
    })
  },

  /**
   * 切换确认密码显示
   */
  toggleConfirmPassword() {
    this.setData({
      showConfirmPassword: !this.data.showConfirmPassword
    })
    console.log('👁️ [Auth] 切换确认密码显示状态:', this.data.showConfirmPassword)
  },

  /**
   * 验证注册表单
   */
  validateRegisterForm() {
    const { email, code, password, confirmPassword } = this.data.registerForm
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

    // 验证密码
    if (!password) {
      errors.password = '请输入密码'
      isValid = false
    } else if (password.length < 6 || password.length > 20) {
      errors.password = '密码长度为6-20位'
      isValid = false
    }

    // 验证确认密码
    if (!confirmPassword) {
      errors.confirmPassword = '请再次输入密码'
      isValid = false
    } else if (password !== confirmPassword) {
      errors.confirmPassword = '两次密码不一致'
      isValid = false
    }

    this.setData({ registerErrors: errors })
    return isValid
  },

  /**
   * 发送验证码
   */
  async sendCode() {
    console.log('📧 [Auth] 发送验证码')
    
    const { email } = this.data.registerForm
    
    // 验证邮箱
    if (!email) {
      this.setData({
        'registerErrors.email': '请输入邮箱'
      })
      wx.vibrateShort()
      return
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/
    if (!emailRegex.test(email)) {
      this.setData({
        'registerErrors.email': '请使用南科大邮箱'
      })
      wx.vibrateShort()
      return
    }

    this.setData({ codeSending: true })

    try {
      console.log('📤 [Auth] 发送验证码请求:', { email })
      
      await sendVerifyCode(email, 'register')
      
      console.log('✅ [Auth] 验证码发送成功')
      
      wx.showToast({
        title: '验证码已发送',
        icon: 'success',
        duration: 1500
      })

      // 开始倒计时
      this.startCountdown()
      
    } catch (error) {
      console.error('❌ [Auth] 验证码发送失败:', error)
      
      this.setData({ codeSending: false })
      
      wx.vibrateShort()
      
      // 特殊处理"已注册"错误，提示用户切换到登录
      if (error.message && error.message.includes('已注册')) {
        wx.showModal({
          title: '该邮箱已注册',
          content: '请切换到登录页面进行登录',
          showCancel: true,
          cancelText: '留在注册',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              this.switchTab({ detail: { index: 0 } })
            }
          }
        })
      } else {
        wx.showToast({
          title: error.message || '发送失败',
          icon: 'none',
          duration: 2000
        })
      }
    }
  },

  /**
   * 开始倒计时
   */
  startCountdown() {
    this.setData({ 
      countdown: 60,
      codeSending: false
    })
    
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

  /**
   * 处理注册
   */
  async handleRegister() {
    console.log('📝 [Auth] 开始注册流程')

    // 验证表单
    if (!this.validateRegisterForm()) {
      console.log('❌ [Auth] 表单验证失败')
      wx.vibrateShort()
      return
    }

    const { email, code, password } = this.data.registerForm

    this.setData({ registerLoading: true })

    try {
      console.log('📤 [Auth] 发送注册请求:', { email })
      
      const result = await register({
        email,
        password,
        verificationCode: code
      })
      
      console.log('✅ [Auth] 注册成功:', result)

      wx.showToast({
        title: '注册成功',
        icon: 'success',
        duration: 1500
      })

      // 切换到登录页，并预填邮箱
      setTimeout(() => {
        this.setData({
          tabIndex: 0,
          'loginForm.email': email,
          'loginForm.password': '',
          registerForm: {
            email: '',
            code: '',
            password: '',
            confirmPassword: ''
          },
          registerLoading: false
        })
        
        wx.showToast({
          title: '请登录',
          icon: 'none',
          duration: 1500
        })
      }, 1500)

    } catch (error) {
      console.error('❌ [Auth] 注册失败:', error)
      
      this.setData({ registerLoading: false })
      
      wx.vibrateShort()
      wx.showToast({
        title: error.message || '注册失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // ==================== 其他功能 ====================

  /**
   * 跳转到忘记密码
   */
  goToForgotPassword() {
    wx.navigateTo({
      url: '/pages/forgot-password/index'
    })
  },

  /**
   * 跳转到微信登录
   */
  goToWechatLogin() {
    console.log('🚀 [Auth] 跳转到微信登录')
    wx.navigateTo({
      url: '/pages/login/index',
      success: () => {
        console.log('✅ [Auth] 跳转成功')
      },
      fail: (err) => {
        console.error('❌ [Auth] 跳转失败:', err)
      }
    })
  },

  /**
   * 查看用户协议
   */
  viewUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '用户协议内容开发中...',
      showCancel: false
    })
  },

  /**
   * 查看隐私政策
   */
  viewPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '隐私政策内容开发中...',
      showCancel: false
    })
  }
})
