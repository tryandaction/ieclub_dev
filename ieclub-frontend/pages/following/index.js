// pages/following/index.js
import { request } from '../../utils/request'

Page({
  data: {
    users: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    limit: 10,
    total: 0,
    isEmpty: false,
    userId: '' // 当前查看的用户ID
  },

  onLoad(options) {
    const userId = options.userId || wx.getStorageSync('userInfo')?.id
    if (!userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/profile/index' })
      }, 1500)
      return
    }

    this.setData({ userId })
    
    // 判断是查看自己还是他人的关注列表
    const currentUserId = wx.getStorageSync('userInfo')?.id
    const title = userId === currentUserId ? '我的关注' : 'TA的关注'
    wx.setNavigationBarTitle({ title })
    
    this.loadFollowing(true)
  },

  onShow() {
    // 从用户详情页返回时刷新
    if (this.data.users.length > 0) {
      this.loadFollowing(true)
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ 
      refreshing: true,
      page: 1,
      hasMore: true
    })
    this.loadFollowing(true)
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    this.loadFollowing(false)
  },

  // 加载关注列表
  async loadFollowing(isRefresh = false) {
    if (this.data.loading) return

    const { page, limit, userId } = this.data

    this.setData({ loading: true })

    try {
      const currentPage = isRefresh ? 1 : page
      const res = await request(`/users/${userId}/following`, {
        method: 'GET',
        data: { page: currentPage, limit }
      })

      const { following = [], pagination = {} } = res.data || res
      
      this.setData({
        users: isRefresh ? following : [...this.data.users, ...following],
        total: pagination.total || 0,
        page: currentPage + 1,
        hasMore: following.length >= limit,
        isEmpty: isRefresh && following.length === 0,
        loading: false,
        refreshing: false
      })

      if (isRefresh) {
        wx.stopPullDownRefresh()
      }

    } catch (error) {
      console.error('加载关注列表失败:', error)
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

  // 跳转到用户详情
  goToUserDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/user-detail/index?id=${id}`
    })
  },

  // 取消关注
  async handleUnfollow(e) {
    e.stopPropagation() // 阻止事件冒泡
    const { id, index } = e.currentTarget.dataset
    
    wx.showModal({
      title: '提示',
      content: '确定要取消关注吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request(`/users/${id}/follow`, { method: 'POST' })

            // 从列表中移除
            const users = [...this.data.users]
            users.splice(index, 1)

            this.setData({
              users,
              total: this.data.total - 1,
              isEmpty: users.length === 0
            })

            wx.showToast({
              title: '已取消关注',
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

  // 去发现用户
  goToUserList() {
    wx.navigateTo({
      url: '/pages/user-list/index'
    })
  }
})
