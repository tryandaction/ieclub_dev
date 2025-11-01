// pages/checkin-stats/checkin-stats.js
Page({
  data: {
    stats: null,
    loading: true,
    filterType: 'all', // all, checked, unchecked
    searchKeyword: '',
    filteredParticipants: []
  },

  onLoad(options) {
    if (options.data) {
      try {
        const stats = JSON.parse(decodeURIComponent(options.data))
        this.setData({
          stats,
          filteredParticipants: stats.participants,
          loading: false
        })
      } catch (error) {
        console.error('解析统计数据失败:', error)
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    }
  },

  /**
   * 切换筛选类型
   */
  onFilterChange(e) {
    const filterType = e.currentTarget.dataset.type
    this.setData({ filterType })
    this.applyFilter()
  },

  /**
   * 搜索参与者
   */
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    this.applyFilter()
  },

  /**
   * 应用筛选
   */
  applyFilter() {
    const { stats, filterType, searchKeyword } = this.data
    let participants = stats.participants

    // 按签到状态筛选
    if (filterType === 'checked') {
      participants = participants.filter(p => p.checkedIn)
    } else if (filterType === 'unchecked') {
      participants = participants.filter(p => !p.checkedIn)
    }

    // 按关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      participants = participants.filter(p => 
        p.nickname.toLowerCase().includes(keyword) ||
        p.email.toLowerCase().includes(keyword)
      )
    }

    this.setData({ filteredParticipants: participants })
  },

  /**
   * 导出数据（模拟）
   */
  exportData() {
    wx.showModal({
      title: '导出数据',
      content: '此功能需要在网页版中使用',
      showCancel: false
    })
  },

  /**
   * 格式化时间
   */
  formatTime(dateString) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
  },

  /**
   * 分享统计
   */
  onShareAppMessage() {
    const { stats } = this.data
    return {
      title: `${stats.activityTitle} - 签到统计`,
      path: `/pages/checkin-stats/checkin-stats?data=${encodeURIComponent(JSON.stringify(stats))}`
    }
  }
})

