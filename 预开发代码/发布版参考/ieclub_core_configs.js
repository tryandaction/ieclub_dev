// ==================== config/index.js - Taro 主配置 ====================

const path = require('path')

const config = {
  projectName: 'ieclub',
  date: '2025-10-13',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
    375: 2 / 1
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [
    '@tarojs/plugin-html'
  ],
  defineConstants: {
  },
  copy: {
    patterns: [
    ],
    options: {
    }
  },
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: { enable: false }
  },
  cache: {
    enable: false
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
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    },
    miniCssExtractPluginOption: {
      ignoreOrder: true
    },
    optimizeMainPackage: {
      enable: true
    },
    webpackChain(chain) {
      chain.merge({
        optimization: {
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              common: {
                name: 'common',
                minChunks: 2,
                priority: 1
              },
              vendors: {
                name: 'vendors',
                test: /[\\/]node_modules[\\/]/,
                priority: 10
              },
              taro: {
                name: 'taro',
                test: /[\\/]node_modules[\\/]@tarojs[\\/]/,
                priority: 100
              }
            }
          }
        }
      })
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
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
    devServer: {
      port: 10086
    }
  },
  rn: {
    appName: 'ieclub',
    postcss: {
      cssModules: {
        enable: false
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


// ==================== config/dev.js - 开发环境配置 ====================

module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
  },
  mini: {},
  h5: {}
}


// ==================== config/prod.js - 生产环境配置 ====================

module.exports = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
  },
  mini: {
    miniCssExtractPluginOption: {
      ignoreOrder: true
    }
  },
  h5: {
    publicPath: 'https://cdn.ieclub.com/',
    miniCssExtractPluginOption: {
      ignoreOrder: true
    }
  }
}


// ==================== tsconfig.json ====================
/*
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/services/*": ["src/services/*"],
      "@/store/*": ["src/store/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
*/


// ==================== package.json ====================
/*
{
  "name": "ieclub",
  "version": "1.0.0",
  "private": true,
  "description": "IEClub - 学生跨学科交流平台",
  "templateInfo": {
    "name": "react",
    "typescript": true,
    "css": "Sass"
  },
  "scripts": {
    "dev:weapp": "npm run build:weapp -- --watch",
    "dev:h5": "npm run build:h5 -- --watch",
    "dev:rn": "npm run build:rn -- --watch",
    "build:weapp": "taro build --type weapp",
    "build:h5": "taro build --type h5",
    "build:rn": "taro build --type rn",
    "lint": "eslint --ext .js,.jsx,.ts,.tsx src",
    "lint:fix": "eslint --ext .js,.jsx,.ts,.tsx src --fix",
    "type-check": "tsc --noEmit"
  },
  "browserslist": [
    "last 3 versions",
    "Android >= 4.1",
    "ios >= 8"
  ],
  "dependencies": {
    "@babel/runtime": "^7.23.0",
    "@tarojs/components": "3.6.23",
    "@tarojs/helper": "3.6.23",
    "@tarojs/plugin-framework-react": "3.6.23",
    "@tarojs/plugin-html": "3.6.23",
    "@tarojs/plugin-platform-weapp": "3.6.23",
    "@tarojs/plugin-platform-h5": "3.6.23",
    "@tarojs/react": "3.6.23",
    "@tarojs/runtime": "3.6.23",
    "@tarojs/taro": "3.6.23",
    "@tarojs/router": "3.6.23",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.7",
    "dayjs": "^1.11.10",
    "isomorphic-dompurify": "^2.9.0",
    "markdown-it": "^14.0.0",
    "highlight.js": "^11.9.0"
  },
  "devDependencies": {
    "@babel/core": "^7.23.0",
    "@babel/preset-react": "^7.23.0",
    "@tarojs/cli": "3.6.23",
    "@tarojs/webpack5-runner": "3.6.23",
    "@types/react": "^18.2.0",
    "@types/markdown-it": "^13.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "babel-preset-taro": "3.6.23",
    "eslint": "^8.55.0",
    "eslint-config-taro": "3.6.23",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "typescript": "^5.3.0",
    "sass": "^1.69.0",
    "webpack": "^5.89.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
*/


// ==================== .env.development ====================
/*
# 开发环境配置
TARO_APP_API_URL=http://localhost:3000
TARO_APP_ENV=development
TARO_APP_OSS_URL=https://dev-oss.ieclub.com
TARO_APP_CDN_URL=https://dev-cdn.ieclub.com
*/


// ==================== .env.production ====================
/*
# 生产环境配置
TARO_APP_API_URL=https://api.ieclub.com
TARO_APP_ENV=production
TARO_APP_OSS_URL=https://oss.ieclub.com
TARO_APP_CDN_URL=https://cdn.ieclub.com
*/


// ==================== project.config.json - 微信小程序配置 ====================
/*
{
  "miniprogramRoot": "dist/",
  "projectname": "ieclub",
  "description": "IEClub - 学生跨学科交流平台",
  "appid": "wxYOUR_APPID",
  "setting": {
    "urlCheck": true,
    "es6": false,
    "enhance": true,
    "postcss": false,
    "minified": false,
    "compileHotReLoad": false,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    }
  },
  "compileType": "miniprogram",
  "condition": {}
}
*/


// ==================== .gitignore ====================
/*
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build
dist/
.temp/
.rn_temp/

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Env
.env.local
.env.*.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Taro
.taro-cache/
*/
