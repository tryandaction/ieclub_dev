// 小组详情页面
const { request } = require('../../utils/request')

const categoryConfig = {
  study: { label: '学习交流', icon: '📚' },
  tech: { label: '技术开发', icon: '💻' },
  career: { label: '职业发展', icon: '💼' },
  interest: { label: '兴趣爱好', icon: '🎨' },
  life: { label: '校园生活', icon: '🏠' },
  sport: { label: '运动健身', icon: '⚽' },
  game: { label: '游戏娱乐', icon: '🎮' },
  general: { label: '综合讨论', icon: '💬' }
}

Page({
  data: {
    id: '',
    group: null,
    topics: [],
    members: [],
    loading: true,
    activeTab: 'topics', // topics, members
    categoryConfig
  },

  onLoad(options) {
    this.setData({ id: options.id })
    this.fetchGroupDetail()
    this.fetchTopics()
  },

  onPullDownRefresh() {
    Promise.all([
      this.fetchGroupDetail(),
      this.data.activeTab === 'topics' ? this.fetchTopics() : this.fetchMembers()
    ]).then(() => wx.stopPullDownRefresh())
  },

  async fetchGroupDetail() {
    try {
      this.setData({ loading: true })
      const res = await request(`/groups/${this.data.id}`)
      const group = res.data || res
      
      this.setData({ 
        group,
        loading: false
      })
    } catch (err) {
      console.error('获取小组详情失败:', err)
      wx.showToast({ title: '小组不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  async fetchTopics() {
    try {
      const res = await request(`/groups/${this.data.id}/topics`)
      const data = res.data || res
      this.setData({ topics: data.list || [] })
    } catch (err) {
      console.error('获取话题失败:', err)
    }
  },

  async fetchMembers() {
    try {
      const res = await request(`/groups/${this.data.id}/members?pageSize=50`)
      const data = res.data || res
      this.setData({ members: data.list || [] })
    } catch (err) {
      console.error('获取成员失败:', err)
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    
    if (tab === 'members' && this.data.members.length === 0) {
      this.fetchMembers()
    }
  },

  async handleJoin() {
    const { group } = this.data
    try {
      await request(`/groups/${this.data.id}/join`, { method: 'POST' })
      wx.showToast({
        title: group.needApproval ? '申请已提交' : '加入成功',
        icon: 'success'
      })
      this.fetchGroupDetail()
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
  },

  async handleLeave() {
    wx.showModal({
      title: '提示',
      content: '确定要退出该小组吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request(`/groups/${this.data.id}/leave`, { method: 'POST' })
            wx.showToast({ title: '已退出', icon: 'success' })
            this.fetchGroupDetail()
          } catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' })
          }
        }
      }
    })
  },

  goToPost() {
    wx.navigateTo({ url: `/pages/group-post/index?groupId=${this.data.id}` })
  },

  goToMember(e) {
    const userId = e.currentTarget.dataset.userId
    wx.navigateTo({ url: `/pages/user-profile/index?id=${userId}` })
  },

  formatTime(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
    return date.toLocaleDateString('zh-CN')
  },

  getAvatarUrl(avatar) {
    if (!avatar || avatar.length < 3) return '/images/default-avatar.png'
    return avatar.indexOf('http') === 0 ? avatar : 'https://ieclub.online' + avatar
  },

  getCategoryLabel(category) {
    return categoryConfig[category]?.label || '综合讨论'
  },

  getCategoryIcon(category) {
    return categoryConfig[category]?.icon || '💬'
  }
})
