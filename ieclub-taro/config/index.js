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
      { from: 'src/assets/favicon.svg', to: 'dist/favicon.ico' },
      { from: 'index.html', to: 'dist/index.html' }
    ],
    options: {
    }
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    output: {
      filename: 'js/[name].js'
    },
    router: {
      mode: 'hash'  // 使用 hash 模式，适合静态部署
    },
    esnextModules: ['taro-ui'],
    postcss: {
      autoprefixer: {
        enable: true
      }
    },
    // 指定 HTML 模板文件
    htmlPluginOption: {
      template: path.resolve(__dirname, '../index.html')
    },
    // 确保生成 index.html
    index: {
      entry: 'src/app.js',
      template: path.resolve(__dirname, '../index.html')
    }
  },
  weapp: {
    module: {
      postcss: {
        autoprefixer: {
          enable: true
        }
      }
    }
  }
}

module.exports = config