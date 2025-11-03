// pages/community/index.js
import { getUsers, followUser, unfollowUser } from '../../api/user'
import { mixinPage } from '../../utils/mixin'
import paginationMixin from '../../mixins/paginationMixin'

mixinPage({
  mixins: [paginationMixin],
  
  data: {},

  onLoad() {
    console.log('✅ 社区页加载')
    
    // 初始化分页
    this.initPagination({
      dataKey: 'users',
      pageSize: 20,
      autoLoad: true
    })
  },

  onShow() {
    console.log('✅ 社区页显示')
  },

  /**
   * 获取数据（供分页混入调用）
   */
  async fetchData(params) {
    return await getUsers(params)
  },

  /**
   * 格式化数据（供分页混入调用）
   */
  formatItem(user) {
    return {
      ...user,
      name: user.nickname || user.name || '匿名用户',
      avatar: user.avatar || '👤',
      major: user.major || '未设置专业',
      level: user.level || 0,
      score: user.score || 0,
      isFollowing: user.isFollowing || false
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
    console.log('🎯 查看用户详情:', id)
    wx.navigateTo({
      url: `/pages/user-detail/user-detail?id=${id}`,
      fail: () => {
        wx.showToast({
          title: '页面开发中',
          icon: 'none'
        })
      }
    })
  }
})

