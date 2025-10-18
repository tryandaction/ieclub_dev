// config/index.js - 修复版本
const path = require('path')

const config = {
  projectName: 'ieclub-taro',
  date: '2025-1-1',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',  // 根输出目录

  plugins: [],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {}
  },

  framework: 'react',
  compiler: 'webpack5',

  cache: {
    enable: true  // 建议开启缓存提升构建速度
  },

  // ============ H5 配置 ============
  h5: {
    publicPath: '/',
    staticDirectory: 'static',

    // 🔥 关键修复：明确指定 H5 输出到 dist/h5
    output: {
      path: path.join(__dirname, '../dist/h5'),  // 强制输出到 h5 子目录
      filename: 'js/[name].[hash:8].js',
      chunkFilename: 'js/[name].[chunkhash:8].js'
    },

    // HTML 配置
    htmlPluginOption: {
      template: path.join(__dirname, '../src/index.html'),
      filename: 'index.html',
      inject: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      }
    },

    router: {
      mode: 'browser'  // 使用 browser 模式，需要 Nginx 配置 try_files
    },

    esnextModules: ['taro-ui'],

    postcss: {
      autoprefixer: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    },

    // Webpack 自定义配置
    webpackChain(chain) {
      // 优化分包策略
      chain.merge({
        optimization: {
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: Infinity,
            minSize: 0,
            cacheGroups: {
              // Taro 核心
              taro: {
                name: 'taro',
                test: /[\\/]node_modules[\\/]@tarojs[\\/]/,
                priority: 100
              },
              // React 相关
              react: {
                name: 'react',
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                priority: 90
              },
              // 第三方库
              vendors: {
                name: 'vendors',
                test: /[\\/]node_modules[\\/]/,
                priority: 80
              },
              // 公共模块
              commons: {
                name: 'commons',
                minChunks: 2,
                priority: 70,
                reuseExistingChunk: true
              }
            }
          }
        }
      })
    },

    devServer: {
      port: 10086,
      host: '0.0.0.0',
      hot: true
    }
  },

  // ============ 小程序配置 ============
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
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  }
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}