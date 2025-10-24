// 统一的API配置
import Taro from '@tarojs/taro'

/**
 * 获取API基础URL
 * 根据环境和构建模式返回正确的API地址
 */
export function getApiBaseUrl(): string {
  const env = Taro.getEnv()
  
  switch (env) {
    case 'WEAPP':
      // 小程序环境
      return 'https://api.ieclub.online/api'
    case 'H5':
      // 🔥 H5环境统一使用相对路径，通过Nginx代理避免跨域
      return '/api'
    case 'RN':
      // React Native环境
      return 'https://api.ieclub.online/api'
    default:
      // 默认使用相对路径
      return '/api'
  }
}

/**
 * 获取API基础URL（不带/api后缀）
 */
export function getApiBaseUrlWithoutPath(): string {
  const env = Taro.getEnv()
  
  switch (env) {
    case 'WEAPP':
      // 小程序环境
      return 'https://api.ieclub.online'
    case 'H5':
      // 🔥 H5环境使用当前访问的域名
      if (typeof window !== 'undefined' && window.location) {
        return window.location.origin
      }
      return ''
    case 'RN':
      // React Native环境
      return 'https://api.ieclub.online'
    default:
      // 默认使用当前域名
      if (typeof window !== 'undefined' && window.location) {
        return window.location.origin
      }
      return 'http://localhost:3000'
  }
}
