// pages/community/index.js
Page({
  data: {
    users: [
      {
        id: 1,
        name: '张三',
        avatar: '👨‍💻',
        major: '计算机科学',
        level: 12,
        score: 1420,
        isFollowing: false
      },
      {
        id: 2,
        name: '李四',
        avatar: '👩‍🎓',
        major: '数学系',
        level: 9,
        score: 820,
        isFollowing: true
      }
    ]
  },

  onLoad() {
    console.log('社区页加载')
  },

  toggleFollow(e) {
    const { index } = e.currentTarget.dataset
    const users = this.data.users
    users[index].isFollowing = !users[index].isFollowing
    this.setData({ users })
    
    wx.showToast({
      title: users[index].isFollowing ? '关注成功' : '已取消关注',
      icon: 'success'
    })
  }
})

