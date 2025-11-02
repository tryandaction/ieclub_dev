// app.js
const { validateAll } = require('./utils/configValidator')

App({
  onLaunch() {
    console.log('🚀 IEClub 小程序启动')
    
    // 验证配置
    const configResult = validateAll()
    if (!configResult.valid) {
      console.error('⚠️ 配置验证失败，小程序可能无法正常工作')
    }
    
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo
    
    // 检查登录状态
    this.checkLoginStatus()
  },

  onShow() {
    console.log('IEClub 小程序显示')
  },

  onHide() {
    console.log('IEClub 小程序隐藏')
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.isLogin = true
      this.globalData.token = token
    }
  },

  // 全局数据
  globalData: {
    isLogin: false,
    token: '',
    userInfo: null,
    systemInfo: null,
    // API 基础地址 - 使用HTTPS域名（带www，与微信后台配置一致）
    apiBase: 'https://www.ieclub.online/api'
  }
})

