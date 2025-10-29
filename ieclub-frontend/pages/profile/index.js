// pages/profile/index.js
Page({
  data: {
    user: {
      name: '张三',
      avatar: '👨‍💻',
      major: '计算机科学与技术',
      grade: '大三',
      level: 12,
      score: 1420,
      stats: { topics: 23, followers: 890, following: 145 }
    }
  },

  onLoad() {
    console.log('个人中心页加载')
  },

  onMenuTap(e) {
    const { label } = e.currentTarget.dataset
    wx.showToast({
      title: label,
      icon: 'none'
    })
  }
})

