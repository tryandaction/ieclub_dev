// ==================== ieclub-taro/src/services/request.ts：HTTP请求封装（增强版） ====================

import Taro from '@tarojs/taro'

const BASE_URL = process.env.TARO_APP_API_URL || 'https://api.ieclub.online'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  needAuth?: boolean
}

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 清理请求参数，过滤掉undefined值
 */
function cleanParams(params: any): any {
  if (!params || typeof params !== 'object') return params

  const cleaned: any = {}
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      cleaned[key] = params[key]
    }
  })
  return cleaned
}

/**
 * 统一请求封装
 */
export async function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header = {}, needAuth = true } = options

  // 添加认证头
  if (needAuth) {
    const token = Taro.getStorageSync('token')
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
  }

  // 添加平台标识
  header['X-Platform'] = process.env.TARO_ENV || 'unknown'

  try {
    const response = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data: cleanParams(data), // 清理请求参数
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      timeout: 10000
    })

    const result = response.data as ApiResponse<T>

    // 统一处理响应
    if (result.code === 200) {
      return result.data
    } else if (result.code === 401) {
      // Token 过期，清除登录状态
      Taro.removeStorageSync('token')
      Taro.removeStorageSync('userInfo')
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      Taro.navigateTo({ url: '/pages/login/index' })
      throw new Error('未授权')
    } else {
      throw new Error(result.message || '请求失败')
    }
  } catch (error: any) {
    console.error('请求错误:', error)

    // 网络错误处理
    if (error.errMsg?.includes('timeout')) {
      Taro.showToast({
        title: '请求超时，请检查网络',
        icon: 'none'
      })
    } else if (error.errMsg?.includes('fail')) {
      Taro.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      })
    }

    throw error
  }
}