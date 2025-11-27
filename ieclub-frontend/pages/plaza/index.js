// pages/plaza/index.js
import { getTopics, likeTopic, unlikeTopic } from '../../api/topic'
import { mixinPage } from '../../utils/mixin'
import paginationMixin from '../../mixins/paginationMixin'

mixinPage({
  mixins: [paginationMixin],
  
  data: {
    activeTab: 'all',
    isLogin: false,
    tabs: [
      { id: 'all', label: '推荐', icon: '✨' },
      { id: 'demand', label: '我想听', icon: '👂' },
      { id: 'offer', label: '我来讲', icon: '🎤' },
      { id: 'project', label: '项目', icon: '🚀' },
      { id: 'share', label: '分享', icon: '💡' }
    ]
  },

  onLoad() {
    console.log('✅ 话题广场页加载')
    this.checkLoginStatus()
    
    // 初始化分页
    this.initPagination({
      dataKey: 'topics',
      pageSize: 10,
      autoLoad: true
    })
  },

  onShow() {
    console.log('✅ 话题广场页显示')
    this.checkLoginStatus()
    
    // 如果是从发布页返回，刷新列表
    if (this.data.topics && this.data.topics.length > 0) {
      this.refresh()
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const app = getApp()
    this.setData({
      isLogin: !!token || !!app.globalData.isLogin
    })
    console.log('🔐 登录状态:', this.data.isLogin)
  },

  /**
   * 获取数据（供分页混入调用）
   */
  async fetchData(params) {
    // 添加类型筛选
    if (this.data.activeTab !== 'all') {
      params.type = this.data.activeTab
    }
    
    return await getTopics(params)
  },

  /**
   * 格式化数据（供分页混入调用）
   */
  formatItem(topic) {
    return {
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
    
    this.setData({ activeTab: tab })
    console.log('🔄 切换到:', tab)
    this.refresh()
  },

  /**
   * 点击话题卡片
   */
  onTopicTap(e) {
    const { id } = e.currentTarget.dataset
    console.log('🎯 点击话题:', id)
    wx.navigateTo({
      url: `/pages/topic-detail/topic-detail?id=${id}`
    })
  },

  /**
   * 点赞/取消点赞
   */
  async handleLike(e) {
    const { id, index } = e.currentTarget.dataset
    
    console.log('❤️ 点赞操作:', { id, index })
    
    // 检查登录状态
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 1500
      })
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/auth/index'
        })
      }, 1500)
      return
    }

    try {
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
        console.log('✅ 取消点赞成功')
      } else {
        await likeTopic(id)
        console.log('✅ 点赞成功')
      }
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
  },

  /**
   * 跳转到登录页
   */
  goToLogin() {
    wx.navigateTo({
      url: '/pages/auth/index'
    })
  },

  /**
   * 跳转到注册页
   */
  goToRegister() {
    wx.navigateTo({
      url: '/pages/auth/index'
    })
  },

  /**
   * 跳转到发布页
   */
  goToPublish() {
    wx.navigateTo({
      url: '/pages/publish/index'
    })
  }
})

