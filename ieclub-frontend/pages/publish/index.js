// pages/publish/index.js
Page({
  data: {
    publishType: 'offer',
    title: '',
    description: ''
  },

  onLoad() {
    console.log('发布页加载')
  },

  switchType(e) {
    const { type } = e.currentTarget.dataset
    this.setData({ publishType: type })
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value })
  },

  publish() {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    if (!this.data.description.trim()) {
      wx.showToast({ title: '请输入描述', icon: 'none' })
      return
    }
    
    wx.showToast({
      title: '发布成功',
      icon: 'success',
      success: () => {
        setTimeout(() => {
          wx.switchTab({ url: '/pages/plaza/index' })
        }, 1500)
      }
    })
  }
})

