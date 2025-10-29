// pages/plaza/index.js
Page({
  data: {
    activeTab: 'all',
    topics: [
      {
        id: 1,
        type: 'offer',
        title: 'Python爬虫实战',
        cover: '🐍',
        author: { name: '张三', avatar: '👨‍💻', level: 12 },
        tags: ['Python', '爬虫'],
        stats: { views: 456, likes: 89, comments: 34 }
      },
      {
        id: 2,
        type: 'demand',
        title: '线性代数期末串讲',
        cover: '📐',
        author: { name: '李四', avatar: '👩‍🎓', level: 8 },
        tags: ['数学', '期末'],
        stats: { views: 234, likes: 45, comments: 23, wantCount: 12 }
      },
      {
        id: 3,
        type: 'project',
        title: '智能选课助手',
        cover: '🚀',
        author: { name: '王五', avatar: '🎯', level: 10 },
        tags: ['创业', 'AI'],
        stats: { views: 890, likes: 156, comments: 67 }
      }
    ],
    tabs: [
      { id: 'all', label: '推荐', icon: '✨' },
      { id: 'offer', label: '我来讲', icon: '🎤' },
      { id: 'demand', label: '想听', icon: '👂' },
      { id: 'project', label: '项目', icon: '🚀' }
    ]
  },

  onLoad() {
    console.log('话题广场页加载')
  },

  onShow() {
    console.log('话题广场页显示')
  },

  // 切换 Tab
  switchTab(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({
      activeTab: tab
    })
    console.log('切换到:', tab)
  },

  // 点击话题卡片
  onTopicTap(e) {
    const { topic } = e.currentTarget.dataset
    wx.showToast({
      title: `点击了: ${topic.title}`,
      icon: 'none',
      duration: 2000
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    setTimeout(() => {
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    }, 1000)
  }
})

