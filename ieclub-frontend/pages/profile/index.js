// pages/profile/index.js
import { getCurrentUser, logout } from '../../api/auth'
import { getMyActivities } from '../../api/activity'

Page({
  data: {
    user: null,
    loading: true,
    menuItems: [
      { id: 'topics', label: '我的话题', icon: '📝', path: '/pages/my-topics/my-topics' },
      { id: 'activities', label: '我的活动', icon: '📅', path: '/pages/my-activities/my-activities' },
      { id: 'favorites', label: '我的收藏', icon: '⭐', path: '/pages/my-favorites/my-favorites' },
      { id: 'following', label: '我的关注', icon: '👥', path: '/pages/my-following/my-following' },
      { id: 'settings', label: '设置', icon: '⚙️', path: '/pages/settings/settings' }
    ]
  },

  onLoad() {
    console.log('个人中心页加载')
  },

  onShow() {
    console.log('个人中心页显示')
    this.loadUserInfo()
  },

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    try {
      // 检查登录状态
      const token = wx.getStorageSync('token')
      if (!token) {
        this.setData({
          user: null,
          loading: false
        })
        return
      }

      this.setData({ loading: true })

      const user = await getCurrentUser()
      
      // 格式化用户数据
      const formattedUser = {
        ...user,
        name: user.nickname || user.name || '未设置昵称',
        avatar: user.avatar || '👤',
        major: user.major || '未设置专业',
        grade: user.grade || '未设置年级',
        level: user.level || 0,
        score: user.score || 0,
        stats: {
          topics: user.topicCount || 0,
          followers: user.followerCount || 0,
          following: user.followingCount || 0
        }
      }

      this.setData({
        user: formattedUser,
        loading: false
      })

      // 保存到本地存储
      wx.setStorageSync('user', JSON.stringify(formattedUser))

      console.log('✅ 加载用户信息成功:', formattedUser)
    } catch (error) {
      console.error('❌ 加载用户信息失败:', error)
      this.setData({ loading: false })
      
      // 如果是 401 错误，清除登录状态
      if (error.code === 401) {
        wx.removeStorageSync('token')
        wx.removeStorageSync('user')
        this.setData({ user: null })
      }
    }
  },

  /**
   * 点击菜单项
   */
  onMenuTap(e) {
    const { path, label } = e.currentTarget.dataset
    
    // 检查登录状态
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 1500
      })
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/auth/index'
        })
      }, 1500)
      return
    }

    if (path) {
      wx.navigateTo({
        url: path,
        fail: () => {
          wx.showToast({
            title: `${label}功能开发中`,
            icon: 'none',
            duration: 2000
          })
        }
      })
    } else {
      wx.showToast({
        title: label,
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 编辑个人资料
   */
  editProfile() {
    // 检查登录状态
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 1500
      })
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/auth/index'
        })
      }, 1500)
      return
    }

    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile',
      fail: () => {
        wx.showToast({
          title: '编辑资料功能开发中',
          icon: 'none',
          duration: 2000
        })
      }
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
  }
})

