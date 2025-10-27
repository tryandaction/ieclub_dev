const path = require('path')
const { UnifiedWebpackPluginV5 } = require('weapp-tailwindcss/webpack')

const config = {
  projectName: 'ieclub-taro',
  date: '2023-10-26',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [
    '@tarojs/plugin-platform-h5',
    '@tarojs/plugin-html'  // 启用 Sass/Less/PostCSS 支持
  ],
  sass: {
    // 全局 Sass 配置（可选）
  },
  defineConstants: {
  },
  copy: {
    patterns: [
      { from: 'src/assets/favicon.svg', to: 'dist/favicon.ico' }
      // 注意：不要复制 index.html，让 Taro 通过 htmlPluginOption 自动处理
    ],
    options: {
    }
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: true  // 开启缓存提升编译速度
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    output: {
      filename: 'js/[name].js'
    },
    router: {
      mode: 'browser'  // 使用 browser 模式，去除URL中的#号
    },
    esnextModules: ['taro-ui'],
    postcss: {
      autoprefixer: {
        enable: true
      }
    },
    // 指定 HTML 模板文件
    htmlPluginOption: {
      template: path.resolve(__dirname, '../src/index.html')
    }
  },
  weapp: {
    module: {
      postcss: {
        autoprefixer: {
          enable: true
        }
      }
    },
    // Webpack 配置
    webpackChain(chain) {
      // 集成 weapp-tailwindcss 插件
      chain.plugin('weapp-tailwindcss')
        .use(UnifiedWebpackPluginV5, [{
          appType: 'taro',
          rem2rpx: true
        }]);

      // 代码分割优化 - 更激进的策略
      chain.optimization.splitChunks({
        chunks: 'all',
        maxInitialRequests: 10,
        minSize: 10000,
        cacheGroups: {
          // React 核心库
          react: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            priority: 40,
            enforce: true
          },
          // Taro 框架
          taro: {
            name: 'taro',
            test: /[\\/]node_modules[\\/]@tarojs[\\/]/,
            priority: 35,
            enforce: true
          },
          // React Router
          router: {
            name: 'router',
            test: /[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/,
            priority: 30,
            enforce: true
          },
          // 图标库单独打包（最大的依赖）
          iconify: {
            name: 'iconify',
            test: /[\\/]node_modules[\\/]@iconify[\\/]/,
            priority: 25,
            enforce: true
          },
          lucide: {
            name: 'lucide',
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            priority: 24,
            enforce: true
          },
          // 工具库
          utils: {
            name: 'utils',
            test: /[\\/]node_modules[\\/](dayjs|zustand|lodash)[\\/]/,
            priority: 20
          },
          // 组件库
          components: {
            name: 'components',
            test: /[\\/]src[\\/]components[\\/]/,
            minChunks: 2,
            priority: 15,
            reuseExistingChunk: true
          },
          // 公共代码
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      });

      // 排除小程序不支持的库
      chain.externals([
        // tesseract.js 在小程序中通过环境判断不加载
        function ({ request }, callback) {
          if (/^tesseract\.js/.test(request)) {
            return callback(null, 'commonjs ' + request);
          }
          callback();
        }
      ]);

      // 生产环境优化
      if (process.env.NODE_ENV === 'production') {
        // 禁用压缩，避免卡死
        // WXSS文件由 fix-wxss.js 脚本后处理
        chain.optimization.minimize(false);
        chain.optimization.usedExports(true);
        // Tree Shaking
        chain.optimization.sideEffects(true);
        
        // 限制并行构建数量，避免内存溢出
        chain.performance.hints(false);
        chain.stats('minimal');
      }
    }
  }
}

module.exports = config