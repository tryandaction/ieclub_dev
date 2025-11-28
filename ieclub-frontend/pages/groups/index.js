// 小组列表页面
const { request } = require('../../utils/request')

const categories = [
  { value: 'all', label: '全部', icon: '🌐' },
  { value: 'study', label: '学习', icon: '📚' },
  { value: 'tech', label: '技术', icon: '💻' },
  { value: 'career', label: '职业', icon: '💼' },
  { value: 'interest', label: '兴趣', icon: '🎨' },
  { value: 'life', label: '生活', icon: '🏠' },
  { value: 'sport', label: '运动', icon: '⚽' },
  { value: 'game', label: '游戏', icon: '🎮' },
  { value: 'general', label: '综合', icon: '💬' }
]

Page({
  data: {
    categories,
    activeTab: 'discover', // discover, my
    category: 'all',
    keyword: '',
    groups: [],
    myGroups: [],
    hotGroups: [],
    loading: true,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.fetchGroups(true)
    this.fetchHotGroups()
  },

  onShow() {
    if (this.data.activeTab === 'my') {
      this.fetchMyGroups()
    }
  },

  onPullDownRefresh() {
    if (this.data.activeTab === 'discover') {
      this.fetchGroups(true).then(() => wx.stopPullDownRefresh())
    } else {
      this.fetchMyGroups().then(() => wx.stopPullDownRefresh())
    }
  },

  onReachBottom() {
    if (this.data.activeTab === 'discover' && this.data.hasMore && !this.data.loading) {
      this.fetchGroups()
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    
    if (tab === 'my') {
      this.fetchMyGroups()
    }
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ category })
    this.fetchGroups(true)
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.fetchGroups(true)
  },

  async fetchGroups(reset = false) {
    try {
      if (reset) {
        this.setData({ loading: true, page: 1 })
      }

      const { category, keyword, page } = this.data
      const currentPage = reset ? 1 : page

      let url = `/groups?page=${currentPage}&pageSize=12&sortBy=membersCount`
      if (category !== 'all') url += `&category=${category}`
      if (keyword) url += `&keyword=${keyword}`

      const res = await request(url)
      const data = res.data || res

      if (reset) {
        this.setData({ groups: data.list || [] })
      } else {
        this.setData({ 
          groups: [...this.data.groups, ...(data.list || [])]
        })
      }

      this.setData({
        hasMore: data.pagination?.page < data.pagination?.totalPages,
        page: currentPage + 1,
        loading: false
      })
    } catch (err) {
      console.error('获取小组列表失败:', err)
      this.setData({ loading: false })
    }
  },

  async fetchMyGroups() {
    try {
      this.setData({ loading: true })
      const res = await request('/groups/me/list')
      this.setData({
        myGroups: res.data || res || [],
        loading: false
      })
    } catch (err) {
      console.error('获取我的小组失败:', err)
      this.setData({ loading: false })
    }
  },

  async fetchHotGroups() {
    try {
      const res = await request('/groups/hot?limit=5')
      this.setData({ hotGroups: res.data || res || [] })
    } catch (err) {
      console.error('获取热门小组失败:', err)
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/group-detail/index?id=${id}` })
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/group-create/index' })
  },

  async joinGroup(e) {
    const { id, needApproval } = e.currentTarget.dataset
    
    try {
      await request(`/groups/${id}/join`, { method: 'POST' })
      wx.showToast({
        title: needApproval ? '申请已提交' : '加入成功',
        icon: 'success'
      })
      this.fetchGroups(true)
    } catch (err) {
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'none'
      })
    }
  },

  getCategoryIcon(category) {
    const cat = categories.find(c => c.value === category)
    return cat ? cat.icon : '💬'
  }
})
