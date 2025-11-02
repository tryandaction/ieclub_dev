// pages/activities/index.js
import { getActivities, toggleParticipation } from '../../api/activity'

Page({
  data: {
    activities: [],
    loading: true,
    page: 1,
    pageSize: 10,
    hasMore: true,
    status: 'all', // all | upcoming | ongoing | ended
    statusTabs: [
      { key: 'all', label: '全部' },
      { key: 'upcoming', label: '即将开始' },
      { key: 'ongoing', label: '进行中' },
      { key: 'ended', label: '已结束' }
    ],
    currentTab: 0
  },

  onLoad() {
    console.log('活动页加载')
    this.loadActivities()
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({
      page: 1,
      activities: [],
      hasMore: true
    })
    this.loadActivities().then(() => {
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
      this.loadActivities()
    }
  },

  /**
   * 加载活动列表
   */
  async loadActivities() {
    if (this.data.loading && this.data.page > 1) {
      return
    }

    try {
      this.setData({ loading: true })

      const params = {
        page: this.data.page,
        limit: this.data.pageSize
      }

      if (this.data.status !== 'all') {
        params.status = this.data.status
      }

      const result = await getActivities(params)
      
      // 处理不同的返回格式
      let activities = []
      let total = 0
      
      if (result.list) {
        activities = result.list
        total = result.total || 0
      } else if (Array.isArray(result)) {
        activities = result
        total = result.length
      } else if (result.data) {
        activities = result.data.list || result.data
        total = result.data.total || 0
      }

      // 格式化活动数据
      const formattedActivities = activities.map(activity => ({
        ...activity,
        cover: activity.cover || '📅',
        time: this.formatTime(activity.startTime, activity.endTime),
        participants: {
          current: activity.participantCount || 0,
          max: activity.maxParticipants || 100
        }
      }))

      this.setData({
        activities: this.data.page === 1 ? formattedActivities : [...this.data.activities, ...formattedActivities],
        hasMore: this.data.activities.length + formattedActivities.length < total,
        loading: false
      })

      console.log('✅ 加载活动列表成功:', {
        page: this.data.page,
        count: formattedActivities.length,
        total
      })
    } catch (error) {
      console.error('❌ 加载活动列表失败:', error)
      this.setData({ loading: false })
      
    wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 格式化时间
   */
  formatTime(startTime, endTime) {
    if (!startTime) return '时间待定'
    
    const start = new Date(startTime)
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    let dateStr = ''
    if (start.toDateString() === now.toDateString()) {
      dateStr = '今天'
    } else if (start.toDateString() === tomorrow.toDateString()) {
      dateStr = '明天'
    } else {
      dateStr = `${start.getMonth() + 1}月${start.getDate()}日`
    }
    
    const startTimeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
    
    if (endTime) {
      const end = new Date(endTime)
      const endTimeStr = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
      return `${dateStr} ${startTimeStr}-${endTimeStr}`
    }
    
    return `${dateStr} ${startTimeStr}`
  },

  /**
   * 切换状态标签
   */
  switchTab(e) {
    const index = e.currentTarget.dataset.index
    const status = this.data.statusTabs[index].key
    
    this.setData({
      currentTab: index,
      status,
      page: 1,
      activities: [],
      hasMore: true
    })
    
    this.loadActivities()
  },

  /**
   * 跳转到活动详情
   */
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/activity-detail/activity-detail?id=${id}`
    })
  },

  /**
   * 报名/取消报名
   */
  async handleParticipate(e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    
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

      wx.showLoading({ title: '处理中...' })
      
      const result = await toggleParticipation(id)
      
      wx.hideLoading()
      
      // 更新本地数据
      const activities = [...this.data.activities]
      activities[index].isParticipating = result.isParticipating
      if (result.participantCount !== undefined) {
        activities[index].participants.current = result.participantCount
      }
      
      this.setData({ activities })
      
      wx.showToast({
        title: result.isParticipating ? '报名成功 ✅' : '已取消报名',
        icon: 'success',
        duration: 1500
      })
    } catch (error) {
      wx.hideLoading()
      console.error('❌ 报名操作失败:', error)
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none',
        duration: 2000
      })
    }
  }
})

