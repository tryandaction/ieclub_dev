// pages/my-stats/index.js
// 我的数据统计页面
import { request } from '../../utils/request'

Page({
  data: {
    loading: true,
    userInfo: null,
    stats: null,
    
    // 数据卡片
    overviewCards: [],
    
    // 发布类型分布
    postTypes: [],
    
    // 成长数据
    growthData: {
      level: 0,
      exp: 0,
      expToNext: 100,
      progress: 0,
      credits: 0
    },
    
    // 活跃度数据
    activityData: {
      lastActiveAt: null,
      activeDays: 0,
      postsThisMonth: 0,
      likesThisMonth: 0
    }
  },

  onLoad() {
    this.loadUserInfo()
    this.loadStats()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadUserInfo()
    this.loadStats()
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (!userInfo || !userInfo.id) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        })
        setTimeout(() => {
          wx.switchTab({ url: '/pages/profile/index' })
        }, 1500)
        return
      }

      // 获取完整的用户信息（包含level、exp等）
      const res = await request({
        url: `/profile/${userInfo.id}`,
        method: 'GET'
      })

      const profile = res.data || res
      
      this.setData({
        userInfo: profile,
        growthData: {
          level: profile.level || 1,
          exp: profile.exp || 0,
          expToNext: this.calculateExpToNext(profile.level || 1),
          progress: this.calculateProgress(profile.exp || 0, profile.level || 1),
          credits: profile.credits || 0
        }
      })
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  },

  // 加载统计数据
  async loadStats() {
    this.setData({ loading: true })

    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (!userInfo || !userInfo.id) return

      const res = await request({
        url: `/profile/${userInfo.id}/stats`,
        method: 'GET'
      })

      const stats = res.data || res
      
      // 处理概览卡片数据
      const overviewCards = [
        {
          icon: '📝',
          label: '总发布',
          value: stats.totalPosts || 0,
          color: '#8b5cf6'
        },
        {
          icon: '👁️',
          label: '总浏览',
          value: this.formatNumber(stats.totalViews || 0),
          color: '#3b82f6'
        },
        {
          icon: '👍',
          label: '总点赞',
          value: this.formatNumber(stats.totalLikes || 0),
          color: '#ec4899'
        },
        {
          icon: '💬',
          label: '总评论',
          value: this.formatNumber(stats.totalComments || 0),
          color: '#10b981'
        }
      ]

      // 处理发布类型分布
      const postTypes = this.processPostTypes(stats.postsByType || {})

      // 处理活跃度数据
      const activityData = {
        lastActiveAt: stats.lastActiveAt ? this.formatDate(stats.lastActiveAt) : '暂无记录',
        activeDays: this.calculateActiveDays(stats.lastActiveAt),
        postsThisMonth: stats.totalPosts || 0, // 简化处理
        likesThisMonth: stats.totalLikes || 0  // 简化处理
      }

      this.setData({
        stats,
        overviewCards,
        postTypes,
        activityData,
        loading: false
      })

      wx.stopPullDownRefresh()
    } catch (error) {
      console.error('加载统计数据失败:', error)
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  // 处理发布类型分布
  processPostTypes(postsByType) {
    const typeMap = {
      'topic': { name: '话题讨论', icon: '💬', color: '#8b5cf6' },
      'question': { name: '提问求助', icon: '❓', color: '#3b82f6' },
      'share': { name: '经验分享', icon: '📚', color: '#10b981' },
      'activity': { name: '活动发布', icon: '🎉', color: '#f59e0b' }
    }

    const types = []
    let total = 0

    for (const [key, count] of Object.entries(postsByType)) {
      total += count
    }

    for (const [key, count] of Object.entries(postsByType)) {
      const typeInfo = typeMap[key] || { name: key, icon: '📄', color: '#6b7280' }
      types.push({
        ...typeInfo,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      })
    }

    // 按数量排序
    types.sort((a, b) => b.count - a.count)

    return types
  },

  // 计算升级所需经验
  calculateExpToNext(level) {
    return level * 100 // 简化公式：每级需要 level * 100 经验
  },

  // 计算经验进度百分比
  calculateProgress(exp, level) {
    const expToNext = this.calculateExpToNext(level)
    const currentLevelExp = exp % expToNext
    return Math.round((currentLevelExp / expToNext) * 100)
  },

  // 计算活跃天数
  calculateActiveDays(lastActiveAt) {
    if (!lastActiveAt) return 0
    const now = new Date()
    const lastActive = new Date(lastActiveAt)
    const diffTime = Math.abs(now - lastActive)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  },

  // 格式化数字
  formatNumber(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  },

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 分享页面
  onShareAppMessage() {
    return {
      title: '我的数据统计',
      path: '/pages/my-stats/index'
    }
  }
})
