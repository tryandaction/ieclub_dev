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
    // API 基础地址配置
    // 根据环境自动选择（可在 config.js 中配置）
    // 生产环境: https://ieclub.online/api
    // 测试环境: https://test.ieclub.online/api
    apiBase: 'https://ieclub.online/api' // 生产环境（必须与小程序域名白名单一致）
    // 如需测试环境，修改为: 'https://test.ieclub.online/api'
  }
})

