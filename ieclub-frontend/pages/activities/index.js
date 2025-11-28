// pages/activities/index.js
import { getActivities, toggleParticipation } from '../../api/activity'
import { mixinPage } from '../../utils/mixin'
import paginationMixin from '../../mixins/paginationMixin'

mixinPage({
  mixins: [paginationMixin],
  
  data: {
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
    console.log('✅ 活动页加载')
    
    // 初始化分页
    this.initPagination({
      dataKey: 'activities',
      pageSize: 10,
      autoLoad: true
    })
  },

  onShow() {
    console.log('✅ 活动页显示')
  },

  /**
   * 获取数据（供分页混入调用）
   */
  async fetchData(params) {
    if (this.data.status !== 'all') {
      params.status = this.data.status
    }
    
    return await getActivities(params)
  },

  /**
   * 格式化数据（供分页混入调用）
   */
  formatItem(activity) {
    return {
      ...activity,
      cover: activity.cover || '📅',
      time: this.formatTime(activity.startTime, activity.endTime),
      participants: {
        current: activity.participantCount || 0,
        max: activity.maxParticipants || 100
      },
      status: activity.status || 'upcoming',
      isParticipating: activity.isParticipating || false
    }
  },

  /**
   * 格式化时间
   */
  formatTime(startTime, endTime) {
    if (!startTime) return ''
    
    const start = new Date(startTime)
    const startStr = `${start.getMonth() + 1}/${start.getDate()} ${start.getHours()}:${String(start.getMinutes()).padStart(2, '0')}`
    
    if (!endTime) return startStr
    
    const end = new Date(endTime)
    const endStr = `${end.getHours()}:${String(end.getMinutes()).padStart(2, '0')}`
    
    return `${startStr} - ${endStr}`
  },

  /**
   * 切换状态Tab
   */
  switchStatusTab(e) {
    const { index, key } = e.currentTarget.dataset
    
    if (key === this.data.status) return
    
    this.setData({
      currentTab: index,
      status: key
    })
    
    console.log('🔄 切换状态:', key)
    this.refresh()
  },

  /**
   * 跳转发布活动页面
   */
  goPublishActivity() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/login/index' })
      }, 1500)
      return
    }
    wx.navigateTo({ url: '/pages/publish-activity/index' })
  },

  /**
   * 点击活动卡片
   */
  onActivityTap(e) {
    const { id } = e.currentTarget.dataset
    console.log('🎯 点击活动:', id)
    
    wx.navigateTo({
      url: `/pages/activity-detail/activity-detail?id=${id}`
    })
  },

  /**
   * 报名/取消报名
   */
  async toggleParticipate(e) {
    const { id } = e.currentTarget.dataset
    console.log('🎫 切换报名状态:', id)
    
    try {
      await toggleParticipation(id)
      
      // 更新本地数据
      const activities = this.data.activities.map(activity => {
        if (activity.id === id) {
          const isParticipating = !activity.isParticipating
          return {
            ...activity,
            isParticipating,
            participants: {
              ...activity.participants,
              current: activity.participants.current + (isParticipating ? 1 : -1)
            }
          }
        }
        return activity
      })
      
      this.setData({ activities })
      
      wx.showToast({
        title: activities.find(a => a.id === id)?.isParticipating ? '报名成功' : '取消成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('❌ 切换报名状态失败:', error)
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      })
    }
  }
})

