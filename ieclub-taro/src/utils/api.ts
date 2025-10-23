// API工具函数
import Taro from '@tarojs/taro'

// 获取API基础URL
export function getApiBaseUrl(): string {
  const env = Taro.getEnv()
  
  // 检查是否为生产环境
  const isProduction = process.env.NODE_ENV === 'production'
  
  switch (env) {
    case 'WEAPP':
      return 'https://api.ieclub.online'
    case 'H5':
      // 生产环境使用完整API地址，开发环境使用代理
      if (isProduction) {
        return 'https://api.ieclub.online'
      }
      // 安全地访问window对象
      if (typeof window !== 'undefined' && window.location) {
        return window.location.origin
      }
      return 'http://localhost:3000'
    case 'RN':
      return 'https://api.ieclub.online'
    default:
      // 生产环境使用完整API地址，开发环境使用本地地址
      return isProduction ? 'https://api.ieclub.online' : 'http://localhost:3000'
  }
}

// 获取请求头
export function getRequestHeaders(token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

// 处理API响应
export function handleApiResponse(response: any) {
  if (response.statusCode === 200) {
    return response.data
  } else {
    throw new Error(`HTTP ${response.statusCode}: ${response.data?.message || '请求失败'}`)
  }
}
