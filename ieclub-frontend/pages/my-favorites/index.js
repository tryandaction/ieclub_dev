// pages/my-favorites/index.js
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
    isEmpty: false
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '我的收藏' })
    this.loadFavorites(true)
  },

  onShow() {
    // 从详情页返回时刷新
    if (this.data.topics.length > 0) {
      this.loadFavorites(true)
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ 
      refreshing: true,
      page: 1,
      hasMore: true
    })
    this.loadFavorites(true)
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    this.loadFavorites(false)
  },

  // 加载收藏列表
  async loadFavorites(isRefresh = false) {
    if (this.data.loading) return

    const { page, limit } = this.data

    this.setData({ loading: true })

    try {
      const currentPage = isRefresh ? 1 : page
      const res = await request('/me/bookmarks', {
        method: 'GET',
        data: { page: currentPage, limit }
      })

      const { data: topics = [], pagination = {} } = res.data || res
      
      this.setData({
        topics: isRefresh ? topics : [...this.data.topics, ...topics],
        total: pagination.total || 0,
        page: currentPage + 1,
        hasMore: topics.length >= limit,
        isEmpty: isRefresh && topics.length === 0,
        loading: false,
        refreshing: false
      })

      if (isRefresh) {
        wx.stopPullDownRefresh()
      }

    } catch (error) {
      console.error('加载收藏失败:', error)
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

  // 跳转到话题详情
  goToTopicDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/topic-detail/index?id=${id}`
    })
  },

  // 取消收藏
  async handleUnbookmark(e) {
    const { id, index } = e.currentTarget.dataset
    
    wx.showModal({
      title: '提示',
      content: '确定要取消收藏吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request(`/topics/${id}/bookmark`, { method: 'POST' })

            // 从列表中移除
            const topics = [...this.data.topics]
            topics.splice(index, 1)

            this.setData({
              topics,
              total: this.data.total - 1,
              isEmpty: topics.length === 0
            })

            wx.showToast({
              title: '已取消收藏',
              icon: 'success'
            })
          } catch (error) {
            wx.showToast({
              title: error.message || '操作失败',
              icon: 'none'
            })
          }
        }
      }
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
      return '刚刚收藏'
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前收藏`
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前收藏`
    } else if (diff < month) {
      return `${Math.floor(diff / day)}天前收藏`
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日收藏`
    }
  },

  // 去发现话题
  goToPlaza() {
    wx.switchTab({
      url: '/pages/plaza/index'
    })
  }
})
