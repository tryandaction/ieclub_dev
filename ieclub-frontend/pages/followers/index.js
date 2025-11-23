// pages/followers/index.js
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
    userId: '', // 当前查看的用户ID
    currentUserId: '' // 当前登录用户ID
  },

  onLoad(options) {
    const userId = options.userId || wx.getStorageSync('userInfo')?.id
    const currentUserId = wx.getStorageSync('userInfo')?.id
    
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

    this.setData({ userId, currentUserId })
    
    // 判断是查看自己还是他人的粉丝列表
    const title = userId === currentUserId ? '我的粉丝' : 'TA的粉丝'
    wx.setNavigationBarTitle({ title })
    
    this.loadFollowers(true)
  },

  onShow() {
    // 从用户详情页返回时刷新
    if (this.data.users.length > 0) {
      this.loadFollowers(true)
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ 
      refreshing: true,
      page: 1,
      hasMore: true
    })
    this.loadFollowers(true)
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    this.loadFollowers(false)
  },

  // 加载粉丝列表
  async loadFollowers(isRefresh = false) {
    if (this.data.loading) return

    const { page, limit, userId } = this.data

    this.setData({ loading: true })

    try {
      const currentPage = isRefresh ? 1 : page
      const res = await request({
        url: `/users/${userId}/followers`,
        method: 'GET',
        data: { page: currentPage, limit }
      })

      const { followers = [], pagination = {} } = res.data || res
      
      // 检查当前用户是否关注了这些粉丝（用于显示互关状态）
      const usersWithFollowStatus = await this.checkFollowStatus(followers)
      
      this.setData({
        users: isRefresh ? usersWithFollowStatus : [...this.data.users, ...usersWithFollowStatus],
        total: pagination.total || 0,
        page: currentPage + 1,
        hasMore: followers.length >= limit,
        isEmpty: isRefresh && followers.length === 0,
        loading: false,
        refreshing: false
      })

      if (isRefresh) {
        wx.stopPullDownRefresh()
      }

    } catch (error) {
      console.error('加载粉丝列表失败:', error)
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

  // 检查关注状态（批量）
  async checkFollowStatus(followers) {
    const { currentUserId, userId } = this.data
    
    // 如果查看的是自己的粉丝列表，需要检查是否已回关
    if (currentUserId === userId) {
      try {
        // 获取当前用户的关注列表
        const res = await request({
          url: `/users/${currentUserId}/following`,
          method: 'GET',
          data: { page: 1, limit: 1000 } // 获取所有关注
        })
        
        const followingIds = (res.data?.following || []).map(u => u.id)
        
        return followers.map(follower => ({
          ...follower,
          isFollowing: followingIds.includes(follower.id)
        }))
      } catch (error) {
        console.error('检查关注状态失败:', error)
        return followers.map(f => ({ ...f, isFollowing: false }))
      }
    }
    
    return followers.map(f => ({ ...f, isFollowing: false }))
  },

  // 跳转到用户详情
  goToUserDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/user-detail/index?id=${id}`
    })
  },

  // 关注/取消关注
  async handleFollow(e) {
    e.stopPropagation() // 阻止事件冒泡
    const { id, index, following } = e.currentTarget.dataset
    
    try {
      await request({
        url: `/users/${id}/follow`,
        method: 'POST'
      })

      // 更新列表中的关注状态
      const users = [...this.data.users]
      users[index].isFollowing = !following

      this.setData({ users })

      wx.showToast({
        title: following ? '已取消关注' : '关注成功',
        icon: 'success'
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      })
    }
  },

  // 去发现用户
  goToUserList() {
    wx.navigateTo({
      url: '/pages/user-list/index'
    })
  }
})
