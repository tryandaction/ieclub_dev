// pages/auth/index.js
import { login, loginWithCode, register, sendVerifyCode } from '../../api/auth'

Page({
  data: {
    isRegister: false,    // 是否为注册模式
    useCode: false,       // 是否使用验证码登录
    
    email: '',
    password: '',
    code: '',
    
    countdown: 0,         // 验证码倒计时
    timer: null,
    loading: false,       // 提交loading
    
    // 错误提示
    emailError: '',
    passwordError: '',
    codeError: ''
  },

  onLoad(options) {
    // 支持从外部指定模式（例如 ?mode=register）
    if (options.mode === 'register') {
      this.setData({ isRegister: true })
    }
  },

  onUnload() {
    // 清理定时器
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
  },

  // 返回
  goBack() {
    wx.navigateBack({
      fail: () => {
        // 如果返回失败，跳转到首页
        wx.switchTab({ url: '/pages/plaza/index' })
      }
    })
  },

  // 切换登录/注册模式
  toggleMode() {
    this.setData({
      isRegister: !this.data.isRegister,
      email: '',
      password: '',
      code: '',
      useCode: false,
      emailError: '',
      passwordError: '',
      codeError: ''
    })
  },

  // 切换验证码登录
  toggleCodeLogin() {
    this.setData({
      useCode: !this.data.useCode,
      password: '',
      code: '',
      passwordError: '',
      codeError: ''
    })
  },

  // 验证邮箱格式
  validateEmail(email) {
    if (!email) {
      return '请输入邮箱'
    }
    
    // 支持 @mail.sustech.edu.cn 和 @sustech.edu.cn
    const emailReg = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/
    if (!emailReg.test(email)) {
      return '请使用南科大邮箱（@sustech.edu.cn 或 @mail.sustech.edu.cn）'
    }
    
    return ''
  },

  // 验证密码
  validatePassword(password) {
    if (!password) {
      return '请输入密码'
    }
    if (password.length < 8) {
      return '密码至少8位'
    }
    if (password.length > 50) {
      return '密码最多50位'
    }
    // 注册时进行完整的密码强度验证
    if (this.data.isRegister) {
      if (!/[a-zA-Z]/.test(password)) {
        return '密码需包含字母'
      }
      if (!/[0-9]/.test(password)) {
        return '密码需包含数字'
      }
    }
    return ''
  },

  // 验证验证码
  validateCode(code) {
    if (!code) {
      return '请输入验证码'
    }
    if (code.length !== 6) {
      return '验证码为6位数字'
    }
    return ''
  },

  // 输入事件
  onEmailInput(e) {
    const email = e.detail.value.trim()
    this.setData({ 
      email,
      emailError: ''
    })
  },

  onPasswordInput(e) {
    const password = e.detail.value
    this.setData({ 
      password,
      passwordError: ''
    })
  },

  onCodeInput(e) {
    const code = e.detail.value.trim()
    this.setData({ 
      code,
      codeError: ''
    })
  },

  // 发送验证码
  async sendCode() {
    const { email, countdown, isRegister } = this.data

    // 倒计时中不允许重复发送
    if (countdown > 0) {
      return
    }

    // 验证邮箱
    const emailError = this.validateEmail(email)
    if (emailError) {
      this.setData({ emailError })
      wx.showToast({ title: emailError, icon: 'none' })
      return
    }

    try {
      wx.showLoading({ title: '发送中...', mask: true })
      
      // 根据模式发送不同类型的验证码
      const type = isRegister ? 'register' : 'login'
      await sendVerifyCode(email, type)
      
      wx.hideLoading()
      wx.showToast({ title: '验证码已发送到邮箱', icon: 'success', duration: 2000 })
      
      // 开始倒计时
      this.startCountdown()
    } catch (error) {
      wx.hideLoading()
      const errorMsg = error.message || '发送失败，请稍后重试'
      wx.showToast({ 
        title: errorMsg, 
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 倒计时
  startCountdown() {
    this.setData({ countdown: 60 })
    
    const timer = setInterval(() => {
      const { countdown } = this.data
      
      if (countdown <= 1) {
        clearInterval(timer)
        this.setData({ countdown: 0, timer: null })
      } else {
        this.setData({ countdown: countdown - 1 })
      }
    }, 1000)
    
    this.setData({ timer })
  },

  // 提交
  async handleSubmit() {
    const { isRegister, useCode, email, password, code, loading } = this.data

    // 防止重复提交
    if (loading) {
      return
    }

    // 清空之前的错误
    this.setData({
      emailError: '',
      passwordError: '',
      codeError: ''
    })

    // 表单验证
    const emailError = this.validateEmail(email)
    if (emailError) {
      this.setData({ emailError })
      wx.showToast({ title: emailError, icon: 'none' })
      return
    }

    // 验证码模式需要验证码
    if (isRegister || useCode) {
      const codeError = this.validateCode(code)
      if (codeError) {
        this.setData({ codeError })
        wx.showToast({ title: codeError, icon: 'none' })
        return
      }
    }

    // 密码验证
    const passwordError = this.validatePassword(password)
    if (passwordError) {
      this.setData({ passwordError })
      wx.showToast({ title: passwordError, icon: 'none' })
      return
    }

    try {
      this.setData({ loading: true })
      wx.showLoading({ 
        title: isRegister ? '注册中...' : '登录中...',
        mask: true
      })
      
      let result
      
      if (isRegister) {
        // 注册
        result = await register({
          email,
          password,
          verifyCode: code,
          nickname: email.split('@')[0],
          gender: 0
        })
        
        wx.showToast({ 
          title: '注册成功！', 
          icon: 'success',
          duration: 2000
        })
      } else if (useCode) {
        // 验证码登录
        result = await loginWithCode({ email, code })
        wx.showToast({ 
          title: '登录成功！', 
          icon: 'success',
          duration: 2000
        })
      } else {
        // 密码登录
        result = await login({ email, password })
        wx.showToast({ 
          title: '登录成功！', 
          icon: 'success',
          duration: 2000
        })
      }

      // 存储token和用户信息
      const { token, user } = result
      wx.setStorageSync('token', token)
      wx.setStorageSync('user', user)

      // 更新全局数据
      const app = getApp()
      app.globalData.isLogin = true
      app.globalData.token = token
      app.globalData.userInfo = user

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        wx.switchTab({ 
          url: '/pages/plaza/index',
          success: () => {
            // 触发广场页面刷新
            const pages = getCurrentPages()
            const plazaPage = pages.find(page => page.route === 'pages/plaza/index')
            if (plazaPage && plazaPage.onShow) {
              plazaPage.onShow()
            }
          }
        })
      }, 1500)

    } catch (error) {
      wx.hideLoading()
      this.setData({ loading: false })
      
      const errorMsg = error.message || (isRegister ? '注册失败' : '登录失败')
      
      wx.showToast({ 
        title: errorMsg, 
        icon: 'none',
        duration: 2500
      })
      
      // 根据错误类型设置对应的错误提示
      if (errorMsg.includes('邮箱')) {
        this.setData({ emailError: errorMsg })
      } else if (errorMsg.includes('密码')) {
        this.setData({ passwordError: errorMsg })
      } else if (errorMsg.includes('验证码')) {
        this.setData({ codeError: errorMsg })
      }
    }
  }
})
