// 统一的API配置
import Taro from '@tarojs/taro'

/**
 * 获取API基础URL
 * 根据环境和构建模式返回正确的API地址
 */
export function getApiBaseUrl(): string {
  const env = Taro.getEnv()
  
  // 检查是否为生产环境
  const isProduction = process.env.NODE_ENV === 'production'
  
  switch (env) {
    case 'WEAPP':
      // 小程序环境
      return 'https://api.ieclub.online/api'
    case 'H5':
      // H5环境 - 生产环境使用完整地址，开发环境使用代理
      return isProduction ? 'https://api.ieclub.online/api' : '/api'
    case 'RN':
      // React Native环境
      return 'https://api.ieclub.online/api'
    default:
      // 生产环境使用完整地址，开发环境使用代理
      return isProduction ? 'https://api.ieclub.online/api' : '/api'
  }
}

/**
 * 获取API基础URL（不带/api后缀）
 */
export function getApiBaseUrlWithoutPath(): string {
  const env = Taro.getEnv()
  
  // 检查是否为生产环境
  const isProduction = process.env.NODE_ENV === 'production'
  
  switch (env) {
    case 'WEAPP':
      // 小程序环境
      return 'https://api.ieclub.online'
    case 'H5':
      // H5环境 - 生产环境使用完整地址，开发环境使用代理
      if (isProduction) {
        return 'https://api.ieclub.online'
      }
      // 安全地访问window对象
      if (typeof window !== 'undefined' && window.location) {
        return window.location.origin
      }
      return 'http://localhost:3000'
    case 'RN':
      // React Native环境
      return 'https://api.ieclub.online'
    default:
      // 生产环境使用完整地址，开发环境使用本地地址
      return isProduction ? 'https://api.ieclub.online' : 'http://localhost:3000'
  }
}
