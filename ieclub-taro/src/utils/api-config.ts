// 统一的API配置
import Taro from '@tarojs/taro'

/**
 * 🔥 获取API基础URL（用于request.ts中拼接完整路径）
 * 
 * 最佳实践：
 * - H5开发环境：返回空字符串 '' - 让webpack devServer的proxy处理
 * - H5生产环境：返回完整域名 'https://ieclub.online'
 * - 小程序环境：返回完整域名 'https://ieclub.online'
 */
export function getApiBaseUrl(): string {
  const env = Taro.getEnv()
  
  // 环境检测
  const isDev = process.env.NODE_ENV === 'development'
  const isH5 = env === Taro.ENV_TYPE.WEB
  const isProduction = typeof window !== 'undefined' && 
                      window.location.protocol === 'https:' &&
                      window.location.hostname !== 'localhost'
  
  console.log('🔧 [API Config] 环境检测:', {
    NODE_ENV: process.env.NODE_ENV,
    TARO_ENV: process.env.TARO_ENV,
    env,
    isDev,
    isH5,
    isProduction
  })
  
  // 🔥 H5/WEB环境的关键判断
  if (isH5) {
    if (isDev) {
      // 🔥 H5开发环境：返回空字符串，让代理处理
      // 在 config/index.js 中配置了 proxy: { '/api': 'http://localhost:3000' }
      console.log('✅ H5开发环境，使用空字符串（webpack代理）')
      return ''
    } else {
      // 🔥 H5生产环境：返回完整域名
      console.log('✅ H5生产环境，使用完整域名: https://ieclub.online')
      return 'https://ieclub.online'
    }
  }
  
  // 小程序环境
  if (env === Taro.ENV_TYPE.WEAPP) {
    console.log('✅ 小程序环境，使用完整域名: https://ieclub.online')
    return 'https://ieclub.online'
  }
  
  // 其他环境（RN等）
  console.log('✅ 其他环境，使用完整域名: https://ieclub.online')
  return 'https://ieclub.online'
}

/**
 * 获取API基础URL（不带/api后缀）
 */
export function getApiBaseUrlWithoutPath(): string {
  const env = Taro.getEnv()
  
  switch (env) {
    case Taro.ENV_TYPE.WEAPP:
      // 小程序环境
      return 'https://ieclub.online'
    case Taro.ENV_TYPE.WEB:
      // 🔥 H5环境使用当前访问的域名
      if (typeof window !== 'undefined' && window.location) {
        // 生产环境强制使用 ieclub.online
        if (window.location.hostname !== 'localhost') {
          return 'https://ieclub.online';
        }
        return window.location.origin;
      }
      return 'https://ieclub.online'
    case Taro.ENV_TYPE.RN:
      // React Native环境
      return 'https://ieclub.online'
    default:
      // 默认使用当前域名
      if (typeof window !== 'undefined' && window.location) {
        if (window.location.hostname !== 'localhost') {
          return 'https://ieclub.online';
        }
        return window.location.origin;
      }
      return 'http://localhost:3000'
  }
}
