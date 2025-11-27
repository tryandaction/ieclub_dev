// pages/profile/index.js
import { logout } from '../../api/auth'
import { getProfile } from '../../api/profile'
import request from '../../utils/request'

Page({
  data: {
    isLogin: false,
    loading: false,
    user: null,
    stats: {
      topics: 0,
      followers: 0,
      following: 0
    },
    unreadCount: 0,
    messageUnread: 0
  },

  onLoad() {
    console.log('✅ 个人中心页加载')
    this.loadUserProfile()
  },

  onShow() {
    console.log('✅ 个人中心页显示')
    // 每次显示时刷新数据，确保与网站同步
    this.loadUserProfile()
    this.loadUnreadCount()
    this.loadMessageUnread()
  },

  /**
   * 加载用户完整资料（使用与网站相同的API）
   */
  async loadUserProfile() {
    const token = wx.getStorageSync('token')
    
    if (!token) {
      this.setData({ isLogin: false, user: null })
      return
    }
    
    this.setData({ isLogin: true, loading: true })
    
    try {
      // 第一步：获取当前用户ID
      const authRes = await request('/auth/profile', { method: 'GET', loading: false })
      const userId = authRes?.id
      
      if (!userId) {
        throw new Error('无法获取用户ID')
      }
      
      // 第二步：使用完整的 profile API 获取数据（与网站一致）
      const profile = await getProfile(userId)
      
      console.log('📥 获取到完整用户数据:', profile)
      
      // 格式化数据
      const user = {
        ...profile,
        nickname: profile.nickname || '未设置昵称',
        major: profile.major || '未设置专业',
        grade: profile.grade || '',
        level: profile.level || 1,
        credits: profile.credits || 0
      }
      
      // 统计数据
      const stats = {
        topics: profile.topicsCount || 0,
        followers: profile.followerCount || 0,
        following: profile.followingCount || 0
      }
      
      this.setData({ 
        user,
        stats,
        loading: false 
      })
      
      // 更新本地存储
      wx.setStorageSync('user', user)
      
      // 更新全局状态
      const app = getApp()
      app.globalData.userInfo = user
      
      console.log('✅ 用户资料加载成功，数据已与网站同步')
      
    } catch (error) {
      console.error('❌ 加载用户资料失败:', error)
      this.setData({ loading: false })
      
      if (error.code === 401 || error.statusCode === 401) {
        wx.removeStorageSync('token')
        wx.removeStorageSync('user')
        this.setData({ isLogin: false, user: null })
      }
    }
  },

  // 跳转到个人主页（查看自己的公开主页）
  goToMyProfile() {
    const userId = this.data.user?.id
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/user-profile/index?userId=${userId}`
    })
  },

  // 跳转到我的话题
  goToMyTopics() {
    wx.navigateTo({
      url: '/pages/my-topics/index'
    })
  },

  // 跳转到我的话题（别名，保持兼容性）
  goToTopics() {
    this.goToMyTopics()
  },

  // 跳转到我的收藏
  goToFavorites() {
    wx.navigateTo({
      url: '/pages/my-favorites/index'
    })
  },

  // 跳转到参与的活动
  goToParticipated() {
    wx.navigateTo({
      url: '/pages/my-activities/index'
    })
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
    wx.navigateTo({
      url: '/pages/settings/index'
    })
  },

  // 跳转到意见反馈
  goToFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/index'
    })
  },

  // 跳转到关于我们
  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/index'
    })
  },

  // 跳转到编辑资料
  goToEditProfile() {
    wx.navigateTo({
      url: '/pages/edit-profile/index'
    })
  },

  // 跳转到数据统计
  goToMyStats() {
    wx.navigateTo({
      url: '/pages/my-stats/index'
    })
  },

  // 跳转到粉丝列表
  goToFollowers() {
    const userId = this.data.user?.id
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/followers/index?userId=${userId}`
    })
  },

  // 跳转到关注列表
  goToFollowing() {
    const userId = this.data.user?.id
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/following/index?userId=${userId}`
    })
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
  },

  /**
   * 去通知页面
   */
  goToNotifications() {
    wx.navigateTo({
      url: '/pages/notifications/index'
    })
  },

  /**
   * 加载未读通知数
   */
  async loadUnreadCount() {
    try {
      const res = await request('/notifications/unread-count', { method: 'GET', loading: false })
      const count = res?.count || res?.data?.count || 0
      this.setData({ unreadCount: count })
    } catch (error) {
      console.error('加载未读数失败:', error)
    }
  },

  /**
   * 加载私信未读数
   */
  async loadMessageUnread() {
    try {
      const res = await request('/messages/unread-count', { method: 'GET', loading: false })
      const count = res?.count || res?.data?.count || 0
      this.setData({ messageUnread: count })
    } catch (error) {
      console.error('加载私信未读数失败:', error)
    }
  },

  /**
   * 去私信页面
   */
  goToMessages() {
    wx.navigateTo({
      url: '/pages/messages/index'
    })
  }
})
