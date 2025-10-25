// 统一的API配置
import Taro from '@tarojs/taro'

/**
 * 🔥 获取API基础URL（用于request.ts中拼接完整路径）
 * 注意：这个函数返回的URL会和相对路径（如 '/api/xxx'）拼接
 * 所以生产环境必须返回完整域名：https://ieclub.online
 */
export function getApiBaseUrl(): string {
  const env = Taro.getEnv()
  
  // 安全检测环境变量
  const isProduction = typeof window !== 'undefined' && 
                      window.location.protocol === 'https:' &&
                      window.location.hostname !== 'localhost'
  const isLocalhost = typeof window !== 'undefined' && 
                     (window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1')
  
  // 🔥 H5/WEB环境的关键判断
  if (env === Taro.ENV_TYPE.WEB) {
    if (isProduction) {
      // 🔥 生产环境：返回完整域名（不带/api，因为services里已经有了）
      console.log('🔧 H5生产环境，使用绝对域名: https://ieclub.online');
      return 'https://ieclub.online';
    } else {
      // 开发环境：返回空字符串，让相对路径通过devServer代理
      console.log('🔧 H5开发环境，使用空字符串（相对路径）');
      return '';
    }
  }
  
  // 小程序和其他环境
  switch (env) {
    case Taro.ENV_TYPE.WEAPP:
      return 'https://ieclub.online'
    case Taro.ENV_TYPE.RN:
      return 'https://ieclub.online'
    default:
      // 兜底逻辑
      if (isLocalhost) {
        return ''; // 本地开发用相对路径
      }
      return 'https://ieclub.online'; // 生产环境用绝对路径
  }
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
