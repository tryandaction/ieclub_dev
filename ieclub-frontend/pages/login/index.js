// pages/login/index.js
import { wechatLogin } from '../../api/auth'

Page({
  data: {
    loading: false
  },

  onLoad() {
    console.log('登录页加载')
    
    // 检查是否已登录
    const token = wx.getStorageSync('token')
    if (token) {
      // 已登录，跳转到首页
      wx.switchTab({
        url: '/pages/plaza/index'
      })
    }
  },

  // 微信快速登录
  handleWechatLogin() {
    this.setData({ loading: true })

    // 1. 获取用户授权
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (profileRes) => {
        const userInfo = profileRes.userInfo
        console.log('获取用户信息成功:', userInfo)

        // 2. 获取登录凭证
        wx.login({
          success: async (loginRes) => {
            console.log('获取登录凭证成功:', loginRes.code)

            try {
              // 3. 调用后端登录接口
              const { token, user } = await wechatLogin({
                code: loginRes.code,
                nickName: userInfo.nickName,
                avatarUrl: userInfo.avatarUrl,
                gender: userInfo.gender
              })
              
              console.log('登录成功:', user)

              // 4. 存储 Token 和用户信息
              wx.setStorageSync('token', token)
              wx.setStorageSync('user', user)

              // 5. 更新全局状态
              const app = getApp()
              app.globalData.isLogin = true
              app.globalData.token = token
              app.globalData.userInfo = user

              // 6. 提示成功
              wx.showToast({
                title: '登录成功',
                icon: 'success',
                duration: 1500
              })

              // 7. 跳转到首页
              setTimeout(() => {
                wx.switchTab({
                  url: '/pages/plaza/index'
                })
              }, 1500)

            } catch (error) {
              console.error('登录失败:', error)
              this.setData({ loading: false })
              
              wx.showToast({
                title: error.message || '登录失败，请重试',
                icon: 'none',
                duration: 2000
              })
            }
          },
          fail: (error) => {
            console.error('获取登录凭证失败:', error)
            this.setData({ loading: false })
            
            wx.showToast({
              title: '获取登录凭证失败',
              icon: 'none',
              duration: 2000
            })
          }
        })
      },
      fail: (error) => {
        console.error('获取用户信息失败:', error)
        this.setData({ loading: false })
        
        wx.showToast({
          title: '需要授权才能使用',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
})
