// pages/my-activities/index.js
import { request } from '../../utils/request'

Page({
  data: {
    activities: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    total: 0,
    isEmpty: false,
    
    // Tab切换
    currentTab: 0, // 0: 我参加的, 1: 我组织的
    tabs: ['我参加的', '我组织的']
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '我的活动' })
    this.loadActivities(true)
  },

  onShow() {
    // 从详情页返回时刷新
    if (this.data.activities.length > 0) {
      this.loadActivities(true)
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ 
      refreshing: true,
      page: 1,
      hasMore: true
    })
    this.loadActivities(true)
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    this.loadActivities(false)
  },

  // 切换Tab
  switchTab(e) {
    const { index } = e.currentTarget.dataset
    if (index === this.data.currentTab) return
    
    this.setData({
      currentTab: index,
      page: 1,
      hasMore: true,
      activities: []
    })
    
    this.loadActivities(true)
  },

  // 加载活动列表
  async loadActivities(isRefresh = false) {
    if (this.data.loading) return

    const { page, pageSize, currentTab } = this.data
    const type = currentTab === 0 ? 'joined' : 'organized'

    this.setData({ loading: true })

    try {
      const currentPage = isRefresh ? 1 : page
      const res = await request({
        url: '/activities/me/activities',
        method: 'GET',
        data: { type, page: currentPage, pageSize }
      })

      const { activities = [], total = 0, hasMore = false } = res.data || res
      
      // 格式化活动数据
      const formattedActivities = activities.map(activity => this.formatActivity(activity))
      
      this.setData({
        activities: isRefresh ? formattedActivities : [...this.data.activities, ...formattedActivities],
        total,
        page: currentPage + 1,
        hasMore,
        isEmpty: isRefresh && activities.length === 0,
        loading: false,
        refreshing: false
      })

      if (isRefresh) {
        wx.stopPullDownRefresh()
      }

    } catch (error) {
      console.error('加载活动失败:', error)
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

  // 格式化活动数据
  formatActivity(activity) {
    const now = new Date()
    const startTime = new Date(activity.startTime)
    const endTime = new Date(activity.endTime)
    
    let status = 'upcoming'
    let statusText = '即将开始'
    
    if (now > endTime) {
      status = 'ended'
      statusText = '已结束'
    } else if (now >= startTime && now <= endTime) {
      status = 'ongoing'
      statusText = '进行中'
    }
    
    return {
      ...activity,
      status,
      statusText,
      timeText: this.formatTime(activity.startTime, activity.endTime),
      participantText: `${activity._count?.participants || 0}/${activity.maxParticipants || 0}人`,
      categoryName: activity.category?.name || '其他'
    }
  },

  // 格式化时间
  formatTime(startTime, endTime) {
    if (!startTime) return ''
    
    const start = new Date(startTime)
    const month = start.getMonth() + 1
    const date = start.getDate()
    const hours = start.getHours()
    const minutes = String(start.getMinutes()).padStart(2, '0')
    
    let timeStr = `${month}/${date} ${hours}:${minutes}`
    
    if (endTime) {
      const end = new Date(endTime)
      const endHours = end.getHours()
      const endMinutes = String(end.getMinutes()).padStart(2, '0')
      timeStr += ` - ${endHours}:${endMinutes}`
    }
    
    return timeStr
  },

  // 跳转到活动详情
  goToActivityDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/activity-detail/index?id=${id}`
    })
  },

  // 去发现活动
  goToActivities() {
    wx.switchTab({
      url: '/pages/activities/index'
    })
  }
})
