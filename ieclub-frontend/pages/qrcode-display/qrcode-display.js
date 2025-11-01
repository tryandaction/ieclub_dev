// pages/qrcode-display/qrcode-display.js
Page({
  data: {
    qrCodeData: null,
    activityTitle: '',
    expiresAt: '',
    countdown: '',
    countdownTimer: null
  },

  onLoad(options) {
    if (options.data) {
      try {
        const data = JSON.parse(decodeURIComponent(options.data))
        this.setData({
          qrCodeData: data.qrCodeDataURL,
          activityTitle: data.activityTitle,
          expiresAt: data.expiresAt
        })
        
        // 启动倒计时
        this.startCountdown()
      } catch (error) {
        console.error('解析二维码数据失败:', error)
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    }
  },

  onUnload() {
    // 清除倒计时定时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer)
    }
  },

  /**
   * 启动倒计时
   */
  startCountdown() {
    const updateCountdown = () => {
      const now = new Date()
      const expires = new Date(this.data.expiresAt)
      const diff = expires - now

      if (diff <= 0) {
        this.setData({ countdown: '已过期' })
        if (this.data.countdownTimer) {
          clearInterval(this.data.countdownTimer)
        }
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      this.setData({
        countdown: `${hours}小时 ${minutes}分钟 ${seconds}秒`
      })
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    this.setData({ countdownTimer: timer })
  },

  /**
   * 保存二维码到相册
   */
  async saveQRCode() {
    try {
      // 请求保存图片到相册的权限
      const { authSetting } = await wx.getSetting()
      
      if (!authSetting['scope.writePhotosAlbum']) {
        const { authSetting: newAuthSetting } = await wx.authorize({
          scope: 'scope.writePhotosAlbum'
        })
      }

      // 将 base64 转换为临时文件
      const fs = wx.getFileSystemManager()
      const base64Data = this.data.qrCodeData.replace(/^data:image\/\w+;base64,/, '')
      const filePath = `${wx.env.USER_DATA_PATH}/qrcode_${Date.now()}.png`
      
      fs.writeFileSync(filePath, base64Data, 'base64')

      // 保存到相册
      await wx.saveImageToPhotosAlbum({
        filePath
      })

      wx.showToast({
        title: '已保存到相册',
        icon: 'success'
      })
    } catch (error) {
      console.error('保存二维码失败:', error)
      
      if (error.errMsg && error.errMsg.includes('auth deny')) {
        wx.showModal({
          title: '需要授权',
          content: '请允许保存图片到相册',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting()
            }
          }
        })
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    }
  },

  /**
   * 分享二维码
   */
  onShareAppMessage() {
    return {
      title: `${this.data.activityTitle} - 签到二维码`,
      path: `/pages/qrcode-display/qrcode-display?data=${encodeURIComponent(JSON.stringify({
        qrCodeDataURL: this.data.qrCodeData,
        activityTitle: this.data.activityTitle,
        expiresAt: this.data.expiresAt
      }))}`,
      imageUrl: this.data.qrCodeData
    }
  }
})

