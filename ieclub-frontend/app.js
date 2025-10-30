// app.js
App({
  onLaunch() {
    console.log('IEClub 小程序启动')
    
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
    // API 基础地址 - 使用HTTPS域名
    apiBase: 'https://www.ieclub.online/api'
  }
})

