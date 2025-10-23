// ==================== 生产环境配置 ====================

module.exports = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
    TARO_APP_API: '"https://ieclub.online/api"',
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
     * 如果需要在 h5 环境中开启 React Devtools
     * 取消以下注释：
     */
    // devServer: {
    //   https: false
    // }
  }
}