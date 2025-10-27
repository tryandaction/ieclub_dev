const path = require('path')

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
    '@tarojs/plugin-platform-h5'
  ],
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
      // 代码分割优化
      chain.optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          // React 核心库
          react: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            priority: 30
          },
          // Taro 框架
          taro: {
            name: 'taro',
            test: /[\\/]node_modules[\\/]@tarojs[\\/]/,
            priority: 25
          },
          // 图标库单独打包
          icons: {
            name: 'icons',
            test: /[\\/]node_modules[\\/](lucide-react|@iconify)[\\/]/,
            priority: 20
          },
          // 工具库
          utils: {
            name: 'utils',
            test: /[\\/]node_modules[\\/](dayjs|zustand)[\\/]/,
            priority: 15
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
        chain.optimization.minimize(true);
        chain.optimization.usedExports(true);
      }
    }
  }
}

module.exports = config