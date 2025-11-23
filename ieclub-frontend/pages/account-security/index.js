// pages/account-security/index.js
import { sendPhoneCode, bindPhone, unbindPhone, bindWechat, unbindWechat } from '../../api/auth'

Page({
  data: {
    user: null,
    
    // 绑定状态
    hasPhone: false,
    hasWechat: false,
    hasPassword: false,
    
    // UI状态
    showPhoneModal: false,
    showWechatModal: false,
    
    // 手机号绑定
    phone: '',
    phoneCode: '',
    phoneCountdown: 0,
    phoneSending: false,
    phoneBinding: false,
    
    // 错误信息
    errors: {
      phone: '',
      phoneCode: ''
    }
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '账号与安全' })
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        user: userInfo,
        hasPhone: !!userInfo.phone,
        hasWechat: !!userInfo.openid,
        hasPassword: !!userInfo.hasPassword
      })
    }
  },

  // ========== 手机号绑定 ==========
  showPhoneBindModal() {
    this.setData({ 
      showPhoneModal: true,
      phone: '',
      phoneCode: '',
      'errors.phone': '',
      'errors.phoneCode': ''
    })
  },

  hidePhoneModal() {
    this.setData({ showPhoneModal: false })
  },

  onPhoneInput(e) {
    this.setData({ 
      phone: e.detail.value,
      'errors.phone': ''
    })
  },

  onPhoneCodeInput(e) {
    this.setData({ 
      phoneCode: e.detail.value,
      'errors.phoneCode': ''
    })
  },

  // 发送手机验证码
  async sendPhoneVerifyCode() {
    const { phone, phoneCountdown, phoneSending } = this.data

    if (phoneCountdown > 0 || phoneSending) return

    // 验证手机号
    if (!phone) {
      this.setData({ 'errors.phone': '请输入手机号' })
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      this.setData({ 'errors.phone': '手机号格式不正确' })
      return
    }

    this.setData({ phoneSending: true })

    try {
      const res = await sendPhoneCode(phone)
      
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      })

      // 开发环境显示验证码
      if (res.verificationCode) {
        console.log('📱 验证码:', res.verificationCode)
        wx.showModal({
          title: '开发环境',
          content: `验证码: ${res.verificationCode}`,
          showCancel: false
        })
      }

      // 开始倒计时
      this.startPhoneCountdown()

    } catch (error) {
      console.error('发送验证码失败:', error)
      this.setData({ 'errors.phone': error.message || '发送失败' })
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none'
      })
    } finally {
      this.setData({ phoneSending: false })
    }
  },

  // 倒计时
  startPhoneCountdown() {
    let countdown = 60
    this.setData({ phoneCountdown: countdown })

    const timer = setInterval(() => {
      countdown--
      if (countdown <= 0) {
        clearInterval(timer)
        this.setData({ phoneCountdown: 0 })
      } else {
        this.setData({ phoneCountdown: countdown })
      }
    }, 1000)
  },

  // 确认绑定手机号
  async confirmBindPhone() {
    const { phone, phoneCode, phoneBinding } = this.data

    if (phoneBinding) return

    // 验证
    if (!phone) {
      this.setData({ 'errors.phone': '请输入手机号' })
      return
    }

    if (!phoneCode) {
      this.setData({ 'errors.phoneCode': '请输入验证码' })
      return
    }

    if (phoneCode.length !== 6) {
      this.setData({ 'errors.phoneCode': '验证码为6位数字' })
      return
    }

    this.setData({ phoneBinding: true })

    try {
      await bindPhone(phone, phoneCode)
      
      wx.showToast({
        title: '绑定成功',
        icon: 'success'
      })

      // 更新本地用户信息
      const userInfo = wx.getStorageSync('userInfo') || {}
      userInfo.phone = phone
      wx.setStorageSync('userInfo', userInfo)

      // 关闭弹窗并刷新
      this.setData({ showPhoneModal: false })
      this.loadUserInfo()

    } catch (error) {
      console.error('绑定失败:', error)
      wx.showToast({
        title: error.message || '绑定失败',
        icon: 'none'
      })
    } finally {
      this.setData({ phoneBinding: false })
    }
  },

  // 解绑手机号
  async handleUnbindPhone() {
    const { hasPassword, hasWechat } = this.data

    // 检查是否还有其他登录方式
    if (!hasPassword && !hasWechat) {
      wx.showModal({
        title: '无法解绑',
        content: '请先设置密码或绑定微信，否则将无法登录',
        showCancel: false
      })
      return
    }

    wx.showModal({
      title: '确认解绑',
      content: '解绑后将无法使用手机号登录',
      success: async (res) => {
        if (res.confirm) {
          try {
            await unbindPhone()
            
            wx.showToast({
              title: '解绑成功',
              icon: 'success'
            })

            // 更新本地用户信息
            const userInfo = wx.getStorageSync('userInfo') || {}
            userInfo.phone = null
            wx.setStorageSync('userInfo', userInfo)

            this.loadUserInfo()

          } catch (error) {
            console.error('解绑失败:', error)
            wx.showToast({
              title: error.message || '解绑失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // ========== 微信绑定 ==========
  showWechatBindModal() {
    this.setData({ showWechatModal: true })
  },

  hideWechatModal() {
    this.setData({ showWechatModal: false })
  },

  // 绑定微信
  async handleBindWechat() {
    try {
      // 获取微信授权
      const loginRes = await wx.login()
      
      if (!loginRes.code) {
        throw new Error('获取微信授权失败')
      }

      // 获取用户信息（需要用户授权）
      const { userInfo } = await wx.getUserProfile({
        desc: '用于完善用户资料'
      })

      // 调用后端绑定接口
      await bindWechat({
        code: loginRes.code,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        gender: userInfo.gender
      })

      wx.showToast({
        title: '绑定成功',
        icon: 'success'
      })

      // 更新本地用户信息
      const localUserInfo = wx.getStorageSync('userInfo') || {}
      localUserInfo.openid = 'bound' // 标记已绑定
      wx.setStorageSync('userInfo', localUserInfo)

      this.setData({ showWechatModal: false })
      this.loadUserInfo()

    } catch (error) {
      console.error('绑定微信失败:', error)
      wx.showToast({
        title: error.message || '绑定失败',
        icon: 'none'
      })
    }
  },

  // 解绑微信
  async handleUnbindWechat() {
    const { hasPassword, hasPhone } = this.data

    // 检查是否还有其他登录方式
    if (!hasPassword && !hasPhone) {
      wx.showModal({
        title: '无法解绑',
        content: '请先设置密码或绑定手机号，否则将无法登录',
        showCancel: false
      })
      return
    }

    wx.showModal({
      title: '确认解绑',
      content: '解绑后将无法使用微信快速登录',
      success: async (res) => {
        if (res.confirm) {
          try {
            await unbindWechat()
            
            wx.showToast({
              title: '解绑成功',
              icon: 'success'
            })

            // 更新本地用户信息
            const userInfo = wx.getStorageSync('userInfo') || {}
            userInfo.openid = null
            wx.setStorageSync('userInfo', userInfo)

            this.loadUserInfo()

          } catch (error) {
            console.error('解绑失败:', error)
            wx.showToast({
              title: error.message || '解绑失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // ========== 其他功能 ==========
  goToChangePassword() {
    wx.navigateTo({
      url: '/pages/settings/change-password/index'
    })
  },

  goToSetPassword() {
    wx.navigateTo({
      url: '/pages/settings/set-password/index'
    })
  }
})
