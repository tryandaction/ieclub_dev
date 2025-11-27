// pages/settings/index.js
import { request } from '../../utils/request'

Page({
  data: {
    // 用户信息
    userInfo: null,
    
    // 通知设置
    notifications: {
      system: true,  // 系统通知
      like: true,    // 点赞通知
      comment: true, // 评论通知
      follow: true,  // 关注通知
      activity: true // 活动通知
    },
    
    // 隐私设置
    privacy: {
      showPhone: false,    // 显示手机号
      showEmail: false,    // 显示邮箱
      allowSearch: true,   // 允许被搜索
      allowMessage: true   // 允许私信
    },
    
    // 通用设置
    general: {
      language: 'zh-CN',    // 语言
      autoPlay: true,       // 自动播放视频
      saveTraffic: false    // 省流量模式
    },
    
    // 缓存信息
    cacheSize: '0 MB',
    
    // 版本信息
    version: '1.9.0',
    
    loading: false
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '设置' })
    this.loadUserInfo()
    this.loadSettings()
    this.calculateCacheSize()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    }
  },

  // 加载设置
  async loadSettings() {
    // 从本地存储加载设置
    const privacy = wx.getStorageSync('privacy_settings')
    const general = wx.getStorageSync('general_settings')
    
    if (privacy) {
      this.setData({ privacy })
    }
    
    if (general) {
      this.setData({ general })
    }
    
    // 从服务器加载通知设置
    try {
      const res = await request('/notifications/settings', { method: 'GET' })
      
      if (res.data?.settings) {
        this.setData({
          notifications: res.data.settings
        })
      }
    } catch (error) {
      console.error('加载通知设置失败:', error)
    }
  },

  // 计算缓存大小
  calculateCacheSize() {
    wx.getStorageInfo({
      success: (res) => {
        const sizeKB = res.currentSize
        const sizeMB = (sizeKB / 1024).toFixed(2)
        this.setData({
          cacheSize: `${sizeMB} MB`
        })
      }
    })
  },

  // 切换通知设置
  async toggleNotification(e) {
    const { type } = e.currentTarget.dataset
    const newValue = !this.data.notifications[type]
    
    this.setData({
      [`notifications.${type}`]: newValue
    })
    
    // 更新到服务器
    try {
      await request('/notifications/settings', { method: 'PUT', data: this.data.notifications })
    } catch (error) {
      console.error('更新通知设置失败:', error)
      // 回滚
      this.setData({
        [`notifications.${type}`]: !newValue
      })
      wx.showToast({
        title: '设置失败',
        icon: 'none'
      })
    }
  },

  // 切换隐私设置
  togglePrivacy(e) {
    const { type } = e.currentTarget.dataset
    const newValue = !this.data.privacy[type]
    
    this.setData({
      [`privacy.${type}`]: newValue
    })
    
    // 保存到本地
    wx.setStorageSync('privacy_settings', this.data.privacy)
    
    wx.showToast({
      title: '设置成功',
      icon: 'success',
      duration: 1000
    })
  },

  // 切换通用设置
  toggleGeneral(e) {
    const { type } = e.currentTarget.dataset
    const newValue = !this.data.general[type]
    
    this.setData({
      [`general.${type}`]: newValue
    })
    
    // 保存到本地
    wx.setStorageSync('general_settings', this.data.general)
    
    wx.showToast({
      title: '设置成功',
      icon: 'success',
      duration: 1000
    })
  },

  // 选择语言
  selectLanguage() {
    const languages = ['简体中文', 'English']
    wx.showActionSheet({
      itemList: languages,
      success: (res) => {
        const langMap = ['zh-CN', 'en-US']
        const lang = langMap[res.tapIndex]
        
        this.setData({
          'general.language': lang
        })
        
        wx.setStorageSync('general_settings', this.data.general)
        
        wx.showToast({
          title: '语言设置成功',
          icon: 'success'
        })
      }
    })
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除缓存吗？这不会删除你的个人数据。',
      confirmText: '清除',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清除中...' })
          
          // 保留重要数据
          const token = wx.getStorageSync('token')
          const userInfo = wx.getStorageSync('userInfo')
          const privacySettings = wx.getStorageSync('privacy_settings')
          const generalSettings = wx.getStorageSync('general_settings')
          
          wx.clearStorage({
            success: () => {
              // 恢复重要数据
              wx.setStorageSync('token', token)
              wx.setStorageSync('userInfo', userInfo)
              wx.setStorageSync('privacy_settings', privacySettings)
              wx.setStorageSync('general_settings', generalSettings)
              
              wx.hideLoading()
              
              wx.showToast({
                title: '缓存已清除',
                icon: 'success'
              })
              
              this.calculateCacheSize()
            },
            fail: () => {
              wx.hideLoading()
              wx.showToast({
                title: '清除失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  // 检查更新
  checkUpdate() {
    wx.showLoading({ title: '检查中...' })
    
    // 模拟检查更新
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '已是最新版本',
        icon: 'success'
      })
    }, 1000)
  },

  // 跳转到账号安全
  goToAccountSecurity() {
    wx.navigateTo({
      url: '/pages/account-security/index'
    })
  },

  // 跳转到关于我们
  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/index'
    })
  },

  // 跳转到隐私政策
  goToPrivacyPolicy() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转到用户协议
  goToUserAgreement() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 联系客服
  contactSupport() {
    wx.navigateTo({
      url: '/pages/feedback/index'
    })
  }
})
