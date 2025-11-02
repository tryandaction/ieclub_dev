// pages/plaza/index.js
import { getTopics, likeTopic, unlikeTopic } from '../../api/topic'

Page({
  data: {
    activeTab: 'all',
    topics: [],
    loading: true,
    page: 1,
    pageSize: 10,
    hasMore: true,
    tabs: [
      { id: 'all', label: '推荐', icon: '✨' },
      { id: 'offer', label: '我来讲', icon: '🎤' },
      { id: 'demand', label: '想听', icon: '👂' },
      { id: 'project', label: '项目', icon: '🚀' }
    ]
  },

  onLoad() {
    console.log('话题广场页加载')
    this.loadTopics()
  },

  onShow() {
    console.log('话题广场页显示')
    // 如果是从发布页返回，刷新列表
    if (this.data.topics.length > 0) {
      this.refreshTopics()
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.refreshTopics().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadTopics()
    }
  },

  /**
   * 刷新话题列表
   */
  async refreshTopics() {
    this.setData({
      page: 1,
      topics: [],
      hasMore: true
    })
    await this.loadTopics()
  },

  /**
   * 加载话题列表
   */
  async loadTopics() {
    if (this.data.loading && this.data.page > 1) {
      return
    }

    try {
      this.setData({ loading: true })

      const params = {
        page: this.data.page,
        limit: this.data.pageSize
      }

      if (this.data.activeTab !== 'all') {
        params.type = this.data.activeTab
      }

      const result = await getTopics(params)
      
      // 处理不同的返回格式
      let topics = []
      let total = 0
      
      if (result.list) {
        topics = result.list
        total = result.total || 0
      } else if (Array.isArray(result)) {
        topics = result
        total = result.length
      } else if (result.data) {
        topics = result.data.list || result.data
        total = result.data.total || 0
      }

      // 格式化话题数据
      const formattedTopics = topics.map(topic => ({
        ...topic,
        cover: this.getTopicIcon(topic.type),
        author: topic.author || { name: '匿名用户', avatar: '👤', level: 0 },
        tags: topic.tags || [],
        stats: {
          views: topic.viewCount || 0,
          likes: topic.likeCount || 0,
          comments: topic.commentCount || 0,
          wantCount: topic.wantCount || 0
        }
      }))

      this.setData({
        topics: this.data.page === 1 ? formattedTopics : [...this.data.topics, ...formattedTopics],
        hasMore: this.data.topics.length + formattedTopics.length < total,
        loading: false
      })

      console.log('✅ 加载话题列表成功:', {
        page: this.data.page,
        count: formattedTopics.length,
        total
      })
    } catch (error) {
      console.error('❌ 加载话题列表失败:', error)
      this.setData({ loading: false })
      
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 获取话题图标
   */
  getTopicIcon(type) {
    const icons = {
      offer: '🎤',
      demand: '👂',
      project: '🚀'
    }
    return icons[type] || '📝'
  },

  /**
   * 切换 Tab
   */
  switchTab(e) {
    const { tab } = e.currentTarget.dataset
    if (tab === this.data.activeTab) return
    
    this.setData({
      activeTab: tab,
      page: 1,
      topics: [],
      hasMore: true
    })
    
    console.log('切换到:', tab)
    this.loadTopics()
  },

  /**
   * 点击话题卡片
   */
  onTopicTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/topic-detail/topic-detail?id=${id}`
    })
  },

  /**
   * 点赞/取消点赞
   */
  async handleLike(e) {
    const { id, index } = e.currentTarget.dataset
    
    try {
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

      const topics = [...this.data.topics]
      const topic = topics[index]
      const isLiked = topic.isLiked

      // 乐观更新 UI
      topic.isLiked = !isLiked
      topic.stats.likes += isLiked ? -1 : 1
      this.setData({ topics })

      // 调用 API
      if (isLiked) {
        await unlikeTopic(id)
      } else {
        await likeTopic(id)
      }

      console.log('✅ 点赞操作成功:', { id, isLiked: !isLiked })
    } catch (error) {
      console.error('❌ 点赞操作失败:', error)
      
      // 回滚 UI
      const topics = [...this.data.topics]
      const topic = topics[index]
      topic.isLiked = !topic.isLiked
      topic.stats.likes += topic.isLiked ? 1 : -1
      this.setData({ topics })
      
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none',
        duration: 2000
      })
    }
  }
})

