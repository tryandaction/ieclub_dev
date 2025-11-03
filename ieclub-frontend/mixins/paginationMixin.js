/**
 * 分页混入（Mixin）- 统一处理列表分页逻辑
 * 
 * 使用方式：
 * 1. 在页面 data 中设置 paginationConfig
 * 2. 实现 fetchData 方法
 * 3. 调用 this.initPagination()
 * 
 * @example
 * import paginationMixin from '../../mixins/paginationMixin'
 * 
 * Page({
 *   mixins: [paginationMixin],
 *   data: {
 *     paginationConfig: {
 *       dataKey: 'topics',    // 数据存储的键名
 *       pageSize: 10,         // 每页数量
 *       autoLoad: true        // 是否自动加载
 *     }
 *   },
 *   async fetchData(params) {
 *     return await api.getList(params)
 *   }
 * })
 */

const paginationMixin = {
  data: {
    // 分页状态
    _pagination: {
      page: 1,
      pageSize: 10,
      hasMore: true,
      loading: false,
      refreshing: false,
      total: 0
    }
  },

  /**
   * 初始化分页
   */
  initPagination(config = {}) {
    const defaultConfig = {
      dataKey: 'list',       // 数据存储的键名
      pageSize: 10,          // 每页数量
      autoLoad: true,        // 是否自动加载
      enableRefresh: true,   // 是否启用下拉刷新
      enableLoadMore: true   // 是否启用上拉加载
    }

    this._paginationConfig = { ...defaultConfig, ...config }

    // 初始化数据
    this.setData({
      [`${this._paginationConfig.dataKey}`]: [],
      '_pagination.pageSize': this._paginationConfig.pageSize
    })

    // 自动加载首屏数据
    if (this._paginationConfig.autoLoad) {
      this.loadPage()
    }
  },

  /**
   * 加载分页数据
   */
  async loadPage() {
    const { page, loading, hasMore } = this.data._pagination

    // 防止重复加载
    if (loading) {
      console.log('⏳ 正在加载中...')
      return
    }

    // 没有更多数据
    if (!hasMore && page > 1) {
      console.log('📭 没有更多数据')
      return
    }

    try {
      this.setData({ '_pagination.loading': true })

      const params = {
        page: page,
        limit: this.data._pagination.pageSize
      }

      // 调用页面提供的 fetchData 方法
      if (typeof this.fetchData !== 'function') {
        throw new Error('页面必须实现 fetchData 方法')
      }

      const result = await this.fetchData(params)

      // 处理不同的返回格式
      let items = []
      let total = 0

      if (result.list) {
        items = result.list
        total = result.total || 0
      } else if (Array.isArray(result)) {
        items = result
        total = result.length
      } else if (result.data) {
        items = result.data.list || result.data
        total = result.data.total || 0
      }

      // 格式化数据（如果页面提供了 formatItem 方法）
      if (typeof this.formatItem === 'function') {
        items = items.map(item => this.formatItem(item))
      }

      const dataKey = this._paginationConfig.dataKey
      const currentData = this.data[dataKey] || []
      const newData = page === 1 ? items : [...currentData, ...items]

      this.setData({
        [`${dataKey}`]: newData,
        '_pagination.total': total,
        '_pagination.hasMore': newData.length < total,
        '_pagination.loading': false
      })

      console.log(`✅ 加载第 ${page} 页成功:`, {
        count: items.length,
        total: newData.length,
        hasMore: newData.length < total
      })

      return items
    } catch (error) {
      console.error('❌ 加载数据失败:', error)
      this.setData({ '_pagination.loading': false })

      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
        duration: 2000
      })

      throw error
    }
  },

  /**
   * 下拉刷新
   */
  async onPullDownRefresh() {
    if (!this._paginationConfig.enableRefresh) {
      return
    }

    console.log('🔄 下拉刷新')
    this.setData({ '_pagination.refreshing': true })
    await this.refresh()
    this.setData({ '_pagination.refreshing': false })
    wx.stopPullDownRefresh()
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    if (!this._paginationConfig.enableLoadMore) {
      return
    }

    console.log('📥 加载更多')
    this.loadMore()
  },

  /**
   * 刷新列表（重置到第一页）
   */
  async refresh() {
    this.setData({
      '_pagination.page': 1,
      '_pagination.hasMore': true,
      [`${this._paginationConfig.dataKey}`]: []
    })
    return await this.loadPage()
  },

  /**
   * 加载下一页
   */
  async loadMore() {
    const { hasMore, loading } = this.data._pagination

    if (!hasMore || loading) {
      return
    }

    this.setData({
      '_pagination.page': this.data._pagination.page + 1
    })

    return await this.loadPage()
  },

  /**
   * 重置分页状态
   */
  resetPagination() {
    this.setData({
      '_pagination.page': 1,
      '_pagination.hasMore': true,
      '_pagination.loading': false,
      '_pagination.refreshing': false,
      '_pagination.total': 0,
      [`${this._paginationConfig.dataKey}`]: []
    })
  },

  /**
   * 获取当前分页状态
   */
  getPaginationState() {
    return this.data._pagination
  }
}

// 导出混入
module.exports = paginationMixin

