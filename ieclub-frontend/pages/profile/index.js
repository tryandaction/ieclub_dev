// pages/profile/index.js
import { getCurrentUser, logout } from '../../api/auth'
import { mixinPage } from '../../utils/mixin'
import dataLoadMixin from '../../mixins/dataLoadMixin'

mixinPage({
  mixins: [dataLoadMixin],
  
  data: {
    isLogin: false,
    stats: {
      topics: 0,
      followers: 0,
      following: 0
    }
  },

  onLoad() {
    console.log('✅ 个人中心页加载')
    this.checkLoginAndLoadUser()
  },

  onShow() {
    console.log('✅ 个人中心页显示')
    this.checkLoginAndLoadUser()
  },

  /**
   * 检查登录并加载用户信息
   */
  async checkLoginAndLoadUser() {
    const token = wx.getStorageSync('token')
    const app = getApp()
    
    if (!token && !app.globalData.isLogin) {
      this.setData({ isLogin: false })
      return
    }
    
    this.setData({ isLogin: true })
    
    // 使用数据加载混入
    if (!this.dataLoadInitialized) {
      this.initDataLoad({
        dataKey: 'user',
        autoLoad: true
      })
      this.dataLoadInitialized = true
    } else {
      this.loadData()
    }
  },

  /**
   * 获取数据（供混入调用）
   */
  async fetchData() {
    return await getCurrentUser()
  },

  /**
   * 格式化数据（供混入调用）
   */
  formatData(user) {
    return {
      ...user,
      nickname: user.nickname || user.name || '未设置昵称',
      avatar: user.avatar || '👤',
      major: user.major || '未设置专业',
      grade: user.grade || '',
      level: user.level || 1,
      score: user.score || 0
    }
  },

  /**
   * 数据加载成功回调
   */
  onDataLoaded(user) {
    // 格式化统计数据
    const stats = {
      topics: user.topicCount || 0,
      followers: user.followerCount || 0,
      following: user.followingCount || 0
    }

    this.setData({ stats })

    // 更新全局状态
    const app = getApp()
    app.globalData.userInfo = this.data.user

    console.log('✅ 加载用户信息成功')
  },

  /**
   * 数据加载失败回调
   */
  onDataLoadError(error) {
    console.error('❌ 加载用户信息失败:', error)
    
    // 如果是 401 错误，清除登录状态
    if (error.code === 401 || error.statusCode === 401) {
      wx.removeStorageSync('token')
      wx.removeStorageSync('user')
      this.setData({ isLogin: false, user: null })
    }
  },

  // 跳转到我的话题
  goToMyTopics() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  // 跳转到我的收藏
  goToFavorites() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  // 跳转到参与的活动
  goToParticipated() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  // 跳转到账号安全
  goToAccountSecurity() {
    wx.navigateTo({
      url: '/pages/account-security/index'
    })
  },

  // 跳转到数据统计
  goToStats() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  // 跳转到设置
  goToSettings() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  // 跳转到意见反馈
  goToFeedback() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  // 跳转到关于我们
  goToAbout() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  // 跳转到粉丝列表
  goToFollowers() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  // 跳转到关注列表
  goToFollowing() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  /**
   * 退出登录
   */
  async handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '退出中...' })
            
            // 调用退出登录 API
            await logout()
            
            // 清除本地存储
            wx.removeStorageSync('token')
            wx.removeStorageSync('user')
            
            wx.hideLoading()
            
            wx.showToast({
              title: '已退出登录',
              icon: 'success',
              duration: 1500
            })

            // 跳转到认证页
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/auth/index'
              })
            }, 1500)

            console.log('✅ 退出登录成功')
          } catch (error) {
            wx.hideLoading()
            console.error('❌ 退出登录失败:', error)
            
            // 即使 API 调用失败，也清除本地数据
            wx.removeStorageSync('token')
            wx.removeStorageSync('user')
            
            wx.showToast({
              title: '已退出登录',
              icon: 'success',
              duration: 1500
            })

            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/auth/index'
              })
            }, 1500)
          }
        }
      }
    })
  },

  /**
   * 去登录
   */
  goToLogin() {
    wx.reLaunch({
      url: '/pages/auth/index'
    })
  }
})
