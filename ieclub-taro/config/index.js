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
      filename: 'js/[name].[contenthash:8].js',
      chunkFilename: 'js/[name].[contenthash:8].chunk.js'
    },

    // 路由模式
    router: {
      mode: 'browser', // 使用 browser 模式（更优雅的 URL）
      basename: '/',
      customRoutes: {
        // 自定义路由映射
        '/': '/pages/square/index',
        '/square': '/pages/square/index',
        '/community': '/pages/community/index',
        '/ranking': '/pages/community/ranking/index',
        '/matching': '/pages/community/matching/index',
        '/notifications': '/pages/notifications/index',
        '/profile': '/pages/profile/index',
      }
    },

    // Webpack 配置
    webpackChain(chain) {
      // 生产环境优化
      if (process.env.NODE_ENV === 'production') {
        // 代码分割优化
        chain.optimization.splitChunks({
          chunks: 'all',
          cacheGroups: {
            vendors: {
              name: 'vendors',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
            styles: {
              name: 'styles',
              test: /\.(css|scss)$/,
              priority: 20,
              reuseExistingChunk: true,
            }
          }
        });

        // 压缩优化
        chain.optimization.minimize(true);

        // 图片压缩
        chain.module
          .rule('images')
          .test(/\.(png|jpe?g|gif|svg)$/i)
          .use('image-webpack-loader')
          .loader('image-webpack-loader')
          .options({
            mozjpeg: {
              progressive: true,
              quality: 80
            },
            optipng: {
              enabled: true,
            },
            pngquant: {
              quality: [0.65, 0.90],
              speed: 4
            },
            gifsicle: {
              interlaced: false,
            },
            webp: {
              quality: 80
            }
          });
      }

      // 性能预算
      chain.performance
        .maxEntrypointSize(500000) // 500KB
        .maxAssetSize(300000); // 300KB
    },

    // PostCSS 配置
    postcss: {
      autoprefixer: {
        enable: true,
        config: {
          overrideBrowserslist: [
            'last 3 versions',
            'Android >= 4.1',
            'iOS >= 8'
          ]
        }
      },
      pxtransform: {
        enable: true,
        config: {
          // 桌面端适配
          designWidth: 750,
          deviceRatio: {
            640: 2.34 / 2,
            750: 1,
            828: 1.81 / 2,
            1080: 0.5,
            1280: 0.5, // 桌面端
            1920: 0.33  // 大屏
          }
        }
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    },

    // 开发服务器配置
    devServer: {
      host: 'localhost',
      port: 10086,
      hot: true,
      open: true,
      historyApiFallback: true, // SPA 路由支持
      proxy: {
        '/api': {
          target: 'http://39.108.160.112:3000',
          changeOrigin: true,
          secure: false
        }
      },
      // 移动端调试
      overlay: {
        warnings: false,
        errors: true
      }
    },

    // 图片资源配置
    imageUrlLoaderOption: {
      limit: 8192, // 小于 8KB 的图片转 base64
      name: 'static/images/[name].[hash:8].[ext]'
    },

    // 字体资源配置
    fontUrlLoaderOption: {
      limit: 8192,
      name: 'static/fonts/[name].[hash:8].[ext]'
    },

    // 媒体资源配置
    mediaUrlLoaderOption: {
      limit: 8192,
      name: 'static/media/[name].[hash:8].[ext]'
    },

    // SEO 优化
    htmlPluginOption: {
      title: 'IEClub - 创新创业社区',
      meta: {
        description: 'IEClub是一个专注于创新创业的智能匹配社区平台',
        keywords: '创新创业,供需匹配,智能推荐,社区交流',
        viewport: 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover'
      },
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      }
    },

    // PWA 配置（可选）
    pwa: {
      enable: false, // 如需 PWA 功能可启用
      manifestOptions: {
        name: 'IEClub',
        short_name: 'IEClub',
        description: '创新创业智能匹配社区',
        start_url: '/',
        background_color: '#ffffff',
        theme_color: '#667eea',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    },

    // 环境变量
    env: {
      API_URL: process.env.NODE_ENV === 'production'
        ? 'https://api.ieclub.com'
        : 'http://localhost:3000'
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