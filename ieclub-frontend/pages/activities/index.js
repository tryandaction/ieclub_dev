// pages/activities/index.js
Page({
  data: {
    activities: [
      {
        id: 1,
        title: 'Python数据分析工作坊',
        cover: '🐍',
        time: '明天 14:00-17:00',
        location: '图书馆301',
        participants: { current: 23, max: 30 }
      }
    ]
  },

  onLoad() {
    console.log('活动页加载')
  },

  register(e) {
    wx.showToast({
      title: '报名成功',
      icon: 'success'
    })
  }
})

