// API工具函数
// API配置统一使用 @/utils/api-config
import { getApiBaseUrlWithoutPath } from '@/utils/api-config'

// 获取API基础URL（不带/api后缀）
export function getApiBaseUrl(): string {
  return getApiBaseUrlWithoutPath()
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
