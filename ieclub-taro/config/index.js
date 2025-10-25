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
  defineConstants: {
    ENABLE_INNER_HTML: '"false"',
    ENABLE_ADJACENT_HTML: '"false"',
    ENABLE_CLONE_NODE: '"false"',
    ENABLE_CONTAINS: '"false"',
    ENABLE_SIZE_APIS: '"false"',
    ENABLE_TEMPLATE_CONTENT: '"false"',
    ENABLE_MUTATION_OBSERVER: '"false"',
    ENABLE_RESIZE_OBSERVER: '"false"',
    ENABLE_INTERSECTION_OBSERVER: '"false"'
  },
  copy: {
    patterns: [
      {
        from: 'public/favicon.ico',
        to: 'favicon.ico'
      }
    ],
    options: {}
  },

  framework: 'react',
  compiler: 'webpack5',

  cache: {
    enable: false,  // 暂时禁用缓存避免序列化警告
    buildDependencies: {
      config: [__filename]
    }
  },

  // ============ H5 配置 ============
  h5: {
    publicPath: '/',
    staticDirectory: 'static',

    // 🔥 关键修复：直接输出到 dist 根目录
    output: {
      filename: 'js/[name].[contenthash:8].js',
      chunkFilename: 'js/[name].[contenthash:8].chunk.js'
    },

    // 路由模式
    router: {
      mode: 'browser', // 🔥 使用 History 模式（Browser 模式）
      basename: '/',
      customRoutes: {
        // 自定义路由映射
        '/': '/pages/square/index',
        '/square': '/pages/square/index',
        '/pages/square/index': '/pages/square/index', // 🔥 添加完整路径映射
        '/community': '/pages/community/index',
        '/pages/community/index': '/pages/community/index',
        '/ranking': '/pages/community/ranking/index',
        '/matching': '/pages/community/matching/index',
        '/notifications': '/pages/notifications/index',
        '/pages/notifications/index': '/pages/notifications/index',
        '/profile': '/pages/profile/index',
        '/pages/profile/index': '/pages/profile/index',
        '/activities': '/pages/activities/index',
        '/pages/activities/index': '/pages/activities/index',
        '/topics': '/pages/topics/index',
        '/pages/topics/index': '/pages/topics/index',
        '/search': '/pages/search/index',
        '/pages/search/index': '/pages/search/index',
        '/login': '/pages/login/index',
        '/pages/login/index': '/pages/login/index',
        '/forgot-password': '/pages/forgot-password/index',
        '/pages/forgot-password/index': '/pages/forgot-password/index',
      }
    },

    // Webpack 配置
    webpackChain(chain) {
      // 添加路径别名
      chain.resolve.alias
        .set('@', path.resolve(__dirname, '../src'))
        .set('@/services', path.resolve(__dirname, '../src/services'))
        .set('@/components', path.resolve(__dirname, '../src/components'))
        .set('@/pages', path.resolve(__dirname, '../src/pages'))
        .set('@/utils', path.resolve(__dirname, '../src/utils'))

      // 修复 window is not defined 错误
      chain.plugin('define').use(require('webpack').DefinePlugin, [{
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'typeof window': JSON.stringify('object'),
        'global': 'globalThis'
      }])

      // 🔥 关键修复：添加History API fallback处理
      if (chain.plugins.has('html')) {
        chain.plugin('html').tap(args => {
        args[0].templateParameters = {
          ...args[0].templateParameters,
          // 添加路由fallback脚本
          routerFallback: `
            <script>
              // 修复H5路由问题
              if (typeof window !== 'undefined') {
                // 确保History API可用
                if (!window.history || !window.history.pushState) {
                  console.warn('History API not supported, falling back to hash mode');
                }
                
                // 监听路由变化，防止hash路由问题
                window.addEventListener('popstate', function(event) {
                  console.log('Route changed:', window.location.pathname);
                });
                
                // 确保初始路由正确
                if (window.location.pathname === '/' || window.location.pathname === '') {
                  window.history.replaceState(null, '', '/pages/square/index');
                }
              }
            </script>
          `
        };
        return args;
        });
      }

      // 优化模块解析
      chain.resolve
        .set('fallback', {
          'fs': false,
          'path': false,
          'crypto': false
        })

      // 减少警告
      chain.stats({
        warnings: false,
        errors: true
      })

      // 生产环境优化
      if (process.env.NODE_ENV === 'production') {
        // 🔥 优化代码分割 - 解决vendors.js过大问题
        chain.optimization.splitChunks({
          chunks: 'all',
          maxInitialRequests: 30,
          maxAsyncRequests: 30,
          minSize: 20000,
          maxSize: 250000, // 限制单个chunk最大250KB
          cacheGroups: {
            // 将大型库单独分离 - 基于实际依赖优化
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 40,
              reuseExistingChunk: true,
              maxSize: 200000,
            },
            // Taro核心库分离
            taroCore: {
              name: 'taro-core',
              test: /[\\/]node_modules[\\/]@tarojs[\\/](components|runtime|taro)[\\/]/,
              priority: 38,
              reuseExistingChunk: true,
              maxSize: 200000,
            },
            // Taro插件分离
            taroPlugins: {
              name: 'taro-plugins',
              test: /[\\/]node_modules[\\/]@tarojs[\\/]plugin-[\\/]/,
              priority: 35,
              reuseExistingChunk: true,
              maxSize: 150000,
            },
            // 工具库分离
            utils: {
              name: 'utils',
              test: /[\\/]node_modules[\\/](dayjs|zustand|ws)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
              maxSize: 100000,
            },
            vendors: {
              name: 'vendors',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
              maxSize: 100000, // 更严格限制vendors chunk大小
              enforce: true, // 强制执行大小限制
              minChunks: 1,
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
        
        // Tree Shaking 优化
        chain.optimization.usedExports(true);
        chain.optimization.sideEffects(false);
        
        // 模块连接优化
        chain.optimization.concatenateModules(true);
        
        // 运行时优化
        chain.optimization.runtimeChunk({
          name: 'runtime'
        });

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

      // 🔥 优化性能预算 - 基于实际情况调整
      chain.performance
        .maxEntrypointSize(1600000) // 1.6MB (基于实际1.48MB调整)
        .maxAssetSize(600000) // 600KB (基于实际537KB调整)
        .hints('warning'); // 只显示警告，不阻止构建
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
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          logLevel: 'debug'
        }
      },
      // 客户端配置（修复overlay问题）
      client: {
        overlay: {
          warnings: false,
          errors: true
        }
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
      favicon: path.resolve(__dirname, '../public/favicon.ico'), // 🔥 修复：使用绝对路径
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
        ? '"https://api.ieclub.online"'
        : '"http://localhost:3000"'
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
    },
    // 添加路径别名配置
    webpackChain(chain) {
      chain.resolve.alias
        .set('@', path.resolve(__dirname, '../src'))
        .set('@/services', path.resolve(__dirname, '../src/services'))
        .set('@/components', path.resolve(__dirname, '../src/components'))
        .set('@/pages', path.resolve(__dirname, '../src/pages'))
        .set('@/utils', path.resolve(__dirname, '../src/utils'))
    }
  }
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}