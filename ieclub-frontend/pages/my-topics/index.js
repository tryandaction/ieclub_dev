// pages/my-topics/index.js
import { request } from '../../utils/request'

Page({
  data: {
    topics: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    limit: 10,
    total: 0,
    
    // 统计数据
    stats: {
      total: 0,
      totalLikes: 0,
      totalComments: 0,
      totalBookmarks: 0
    },
    
    // 空状态
    isEmpty: false
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '我的话题' })
    this.loadTopics(true)
  },

  onShow() {
    // 从详情页返回时刷新
    if (this.data.topics.length > 0) {
      this.loadTopics(true)
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ 
      refreshing: true,
      page: 1,
      hasMore: true
    })
    this.loadTopics(true)
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    this.loadTopics(false)
  },

  // 加载话题列表
  async loadTopics(isRefresh = false) {
    if (this.data.loading) return

    const { page, limit } = this.data
    const userInfo = wx.getStorageSync('userInfo')
    
    if (!userInfo || !userInfo.id) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      const currentPage = isRefresh ? 1 : page
      const res = await request({
        url: `/users/${userInfo.id}/topics`,
        method: 'GET',
        data: { page: currentPage, limit }
      })

      const { topics = [], pagination = {} } = res.data || res
      
      // 计算统计数据
      const stats = this.calculateStats(topics)

      this.setData({
        topics: isRefresh ? topics : [...this.data.topics, ...topics],
        total: pagination.total || 0,
        page: currentPage + 1,
        hasMore: topics.length >= limit,
        isEmpty: isRefresh && topics.length === 0,
        stats,
        loading: false,
        refreshing: false
      })

      if (isRefresh) {
        wx.stopPullDownRefresh()
      }

    } catch (error) {
      console.error('加载话题失败:', error)
      this.setData({ 
        loading: false,
        refreshing: false 
      })
      
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  // 计算统计数据
  calculateStats(topics) {
    return topics.reduce((stats, topic) => {
      return {
        total: stats.total + 1,
        totalLikes: stats.totalLikes + (topic._count?.likes || 0),
        totalComments: stats.totalComments + (topic._count?.comments || 0),
        totalBookmarks: stats.totalBookmarks + (topic._count?.bookmarks || 0)
      }
    }, { total: 0, totalLikes: 0, totalComments: 0, totalBookmarks: 0 })
  },

  // 跳转到话题详情
  goToTopicDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/topic-detail/index?id=${id}`
    })
  },

  // 格式化时间
  formatTime(dateString) {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    const month = 30 * day
    
    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`
    } else if (diff < month) {
      return `${Math.floor(diff / day)}天前`
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  },

  // 发布新话题
  goToPublish() {
    wx.navigateTo({
      url: '/pages/publish/index'
    })
  }
})
