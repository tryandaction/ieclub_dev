// ==================== 生产环境配置 ====================

module.exports = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
    // 🔥 关键修复：使用完整的绝对路径
    TARO_APP_API: '"https://ieclub.online/api"',
    TARO_APP_SERVER_URL: '"https://ieclub.online"',
    ENABLE_INNER_HTML: '"true"',
    ENABLE_ADJACENT_HTML: '"true"',
    ENABLE_CLONE_NODE: '"true"'
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      url: {
        enable: true,
        config: {
          limit: 1024
        }
      }
    }
  },
  h5: {
    /**
     * 🔥 生产环境H5配置 - 关键修复
     */
    publicPath: '/',
    staticDirectory: 'static',
    router: {
      mode: 'browser', // 🔥 必须使用 browser 模式（不是 hash）
      basename: '/'
    },
    // 生产环境不需要devServer配置
    devServer: {
      https: false
    }
  }
}