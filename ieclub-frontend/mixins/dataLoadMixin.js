/**
 * 数据加载混入
 * 用于页面单个数据加载，提供统一的加载状态管理和错误处理
 */

export default {
  data: {
    loading: false,
    error: null
  },

  methods: {
    /**
     * 初始化数据加载
     * @param {Object} options 配置选项
     * @param {string} options.dataKey - 数据存储的key，默认为'data'
     * @param {boolean} options.autoLoad - 是否自动加载，默认为false
     */
    initDataLoad(options = {}) {
      const {
        dataKey = 'data',
        autoLoad = false
      } = options

      this._dataLoadConfig = {
        dataKey
      }

      // 初始化数据
      this.setData({
        [dataKey]: null,
        loading: false,
        error: null
      })

      console.log('✅ 数据加载混入已初始化:', {
        dataKey,
        autoLoad
      })

      // 自动加载
      if (autoLoad) {
        this.loadData()
      }
    },

    /**
     * 加载数据
     */
    async loadData() {
      if (!this._dataLoadConfig) {
        console.error('❌ 数据加载混入未初始化，请先调用 initDataLoad()')
        return
      }

      const { dataKey } = this._dataLoadConfig

      try {
        this.setData({ 
          loading: true,
          error: null 
        })

        console.log('📥 开始加载数据...')

        // 调用页面定义的 fetchData 方法
        if (typeof this.fetchData !== 'function') {
          throw new Error('页面需要实现 fetchData 方法')
        }

        let data = await this.fetchData()

        // 如果页面定义了 formatData 方法，则格式化数据
        if (typeof this.formatData === 'function') {
          data = this.formatData(data)
        }

        this.setData({
          [dataKey]: data,
          loading: false
        })

        console.log('✅ 数据加载成功')

        // 调用成功回调
        if (typeof this.onDataLoaded === 'function') {
          this.onDataLoaded(data)
        }

      } catch (error) {
        console.error('❌ 数据加载失败:', error)

        this.setData({
          loading: false,
          error: error.message || '加载失败'
        })

        // 调用错误回调
        if (typeof this.onDataLoadError === 'function') {
          this.onDataLoadError(error)
        } else {
          // 默认错误处理
          wx.showToast({
            title: error.message || '加载失败',
            icon: 'none',
            duration: 2000
          })
        }
      }
    },

    /**
     * 重新加载数据
     */
    async reloadData() {
      console.log('🔄 重新加载数据')
      await this.loadData()
    }
  }
}

