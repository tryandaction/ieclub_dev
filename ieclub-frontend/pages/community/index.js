// pages/community/index.js
import { getUsers, followUser, unfollowUser } from '../../api/user'

Page({
  data: {
    users: [],
    loading: true,
    page: 1,
    pageSize: 20,
    hasMore: true
  },

  onLoad() {
    console.log('社区页加载')
    this.loadUsers()
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({
      page: 1,
      users: [],
      hasMore: true
    })
    this.loadUsers().then(() => {
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
      this.loadUsers()
    }
  },

  /**
   * 加载用户列表
   */
  async loadUsers() {
    if (this.data.loading && this.data.page > 1) {
      return
    }

    try {
      this.setData({ loading: true })

      const params = {
        page: this.data.page,
        limit: this.data.pageSize
      }

      const result = await getUsers(params)
      
      // 处理不同的返回格式
      let users = []
      let total = 0
      
      if (result.list) {
        users = result.list
        total = result.total || 0
      } else if (Array.isArray(result)) {
        users = result
        total = result.length
      } else if (result.data) {
        users = result.data.list || result.data
        total = result.data.total || 0
      }

      // 格式化用户数据
      const formattedUsers = users.map(user => ({
        ...user,
        name: user.nickname || user.name || '匿名用户',
        avatar: user.avatar || '👤',
        major: user.major || '未设置专业',
        level: user.level || 0,
        score: user.score || 0,
        isFollowing: user.isFollowing || false
      }))

      this.setData({
        users: this.data.page === 1 ? formattedUsers : [...this.data.users, ...formattedUsers],
        hasMore: this.data.users.length + formattedUsers.length < total,
        loading: false
      })

      console.log('✅ 加载用户列表成功:', {
        page: this.data.page,
        count: formattedUsers.length,
        total
      })
    } catch (error) {
      console.error('❌ 加载用户列表失败:', error)
      this.setData({ loading: false })
      
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 关注/取消关注
   */
  async toggleFollow(e) {
    const { index, id } = e.currentTarget.dataset
    
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

      const users = [...this.data.users]
      const user = users[index]
      const isFollowing = user.isFollowing

      // 乐观更新 UI
      user.isFollowing = !isFollowing
      this.setData({ users })

      // 调用 API
      if (isFollowing) {
        await unfollowUser(id)
      } else {
        await followUser(id)
      }

      wx.showToast({
        title: user.isFollowing ? '关注成功 ✅' : '已取消关注',
        icon: 'success',
        duration: 1500
      })

      console.log('✅ 关注操作成功:', { id, isFollowing: !isFollowing })
    } catch (error) {
      console.error('❌ 关注操作失败:', error)
      
      // 回滚 UI
      const users = [...this.data.users]
      const user = users[index]
      user.isFollowing = !user.isFollowing
    this.setData({ users })
    
    wx.showToast({
        title: error.message || '操作失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 查看用户详情
   */
  viewUserDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/user-detail/user-detail?id=${id}`
    })
  }
})

