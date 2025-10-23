// ==================== 开发环境配置 ====================

module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    TARO_APP_API: JSON.stringify('http://localhost:3000/api'),
    TARO_APP_SERVER_URL: JSON.stringify('http://localhost:3000'),
    ENABLE_INNER_HTML: '"false"',
    ENABLE_ADJACENT_HTML: '"false"',
    ENABLE_CLONE_NODE: '"false"'
  },
  mini: {
    // 小程序配置
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      }
    }
  },
  h5: {
    // H5配置 - 修复网页端显示问题
    devServer: {
      port: 10086,
      host: '0.0.0.0',
      https: false,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          pathRewrite: {
            '^/api': '/api'
          }
        }
      }
    },
    publicPath: '/',
    router: {
      mode: 'hash',
      basename: '/'
    }
  }
}