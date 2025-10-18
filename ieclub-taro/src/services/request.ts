// ieclub-taro/src/services/request.ts
import Taro from '@tarojs/taro'

const BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3001'
  : process.env.TARO_APP_API_URL || 'https://api.ieclub.online'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  needAuth?: boolean
}

interface ApiResponse<T = any> {
  success: boolean
  code: number
  message: string
  data: T
}

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

export async function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header = {}, needAuth = true } = options

  // 获取token
  const token = Taro.getStorageSync('token')

  // 构建请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...header
  }

  // 如果需要认证，添加token
  if (needAuth && token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  header['X-Platform'] = process.env.TARO_ENV || 'h5'

  try {
    // 发起请求 - 注意这里不要重复添加 /api
    const response = await Taro.request({
      url: `${BASE_URL}${url}`, // url 参数应该已经包含 /api
      method,
      data: cleanParams(data),
      header: headers,
      timeout: 10000
    })

    // 处理响应
    if (response.statusCode === 200) {
      const result = response.data as any

      if (result.success) {
        return result.data
      } else {
        throw new Error(result.message || '请求失败')
      }
    } else if (response.statusCode === 401) {
      // 未授权，清除token并跳转登录
      Taro.removeStorageSync('token')
      Taro.removeStorageSync('userInfo')
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/login/index' })
      }, 1500)
      throw new Error('未授权')
    } else {
      throw new Error(`请求失败: ${response.statusCode}`)
    }
  } catch (error: any) {
    console.error('请求错误:', error)
    Taro.showToast({
      title: error.message || '网络请求失败',
      icon: 'none'
    })
    throw error
  }
}