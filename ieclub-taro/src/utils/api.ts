// API工具函数
import Taro from '@tarojs/taro'

// 获取API基础URL
export function getApiBaseUrl(): string {
  const env = Taro.getEnv()
  
  switch (env) {
    case 'WEAPP':
      return 'https://api.ieclub.online'
    case 'H5':
      return window.location.origin
    case 'RN':
      return 'https://api.ieclub.online'
    default:
      return 'http://localhost:3000'
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
