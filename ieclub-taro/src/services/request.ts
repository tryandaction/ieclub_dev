// ==================== 完善错误处理系统 ====================

import Taro from '@tarojs/taro'

export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONTENT_VIOLATION = 'CONTENT_VIOLATION',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class APIError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// 重试配置
interface RetryConfig {
  maxRetries: number
  retryDelay: number
  retryableErrors: ErrorCode[]
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableErrors: [ErrorCode.NETWORK_ERROR, ErrorCode.TIMEOUT]
}

// 增强的请求函数
export async function request<T = any>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  timeout?: number
  showLoading?: boolean
  showError?: boolean
  needAuth?: boolean
  retryConfig?: Partial<RetryConfig>
}): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    timeout = 10000,
    needAuth = true,
    retryConfig = {}
  } = options

  const finalRetryConfig = { ...defaultRetryConfig, ...retryConfig }
  let lastError: APIError | null = null

  // 重试循环
  for (let attempt = 0; attempt <= finalRetryConfig.maxRetries; attempt++) {
    try {
      // 检查网络状态
      const networkType = await Taro.getNetworkType()
      if (networkType.networkType === 'none') {
        throw new APIError(
          ErrorCode.NETWORK_ERROR,
          '网络未连接，请检查网络设置',
          0
        )
      }

      // 添加认证
      if (needAuth) {
        const token = Taro.getStorageSync('token')
        if (token) {
          header['Authorization'] = `Bearer ${token}`
        }
      }

      // 添加通用头部
      header['Content-Type'] = header['Content-Type'] || 'application/json'
      header['X-Platform'] = Taro.getEnv() || 'unknown'
      header['X-Version'] = '1.0.0'

      // 获取API基础URL
      const apiBaseUrl = getApiBaseUrl()

      // 发送请求
      const response = await Taro.request({
        url: `${apiBaseUrl}${url}`,
        method,
        data,
        header,
        timeout
      })

      // 处理响应
      const result = response.data as any

      if (response.statusCode === 200 && result.code === 200) {
        return result.data as T
      } else {
        throw parseAPIError(response.statusCode, result)
      }

    } catch (error: any) {
      lastError = error instanceof APIError ? error : new APIError(
        ErrorCode.UNKNOWN_ERROR,
        error.message || '未知错误'
      )

      // 判断是否需要重试
      const shouldRetry =
        attempt < finalRetryConfig.maxRetries &&
        finalRetryConfig.retryableErrors.includes(lastError.code)

      if (shouldRetry) {
        // 等待后重试
        await sleep(finalRetryConfig.retryDelay * (attempt + 1))
        continue
      } else {
        break
      }
    }
  }

  // 所有重试都失败，处理错误
  if (lastError) {
    await handleAPIError(lastError)
    throw lastError
  }

  throw new APIError(ErrorCode.UNKNOWN_ERROR, '请求失败')
}

// 解析API错误
function parseAPIError(statusCode: number, result: any): APIError {
  switch (statusCode) {
    case 400:
      return new APIError(
        ErrorCode.VALIDATION_ERROR,
        result.message || '请求参数错误',
        400,
        result.errors
      )
    case 401:
      return new APIError(
        ErrorCode.UNAUTHORIZED,
        '未登录或登录已过期',
        401
      )
    case 403:
      return new APIError(
        ErrorCode.FORBIDDEN,
        result.message || '无权限访问',
        403
      )
    case 404:
      return new APIError(
        ErrorCode.NOT_FOUND,
        '请求的资源不存在',
        404
      )
    case 429:
      return new APIError(
        ErrorCode.RATE_LIMIT,
        '操作太频繁，请稍后再试',
        429
      )
    case 451:
      return new APIError(
        ErrorCode.CONTENT_VIOLATION,
        result.message || '内容违规',
        451,
        result.violations
      )
    case 500:
    case 502:
    case 503:
      return new APIError(
        ErrorCode.SERVER_ERROR,
        '服务器错误，请稍后重试',
        statusCode
      )
    default:
      return new APIError(
        ErrorCode.UNKNOWN_ERROR,
        result.message || '未知错误',
        statusCode
      )
  }
}

// 统一错误处理
async function handleAPIError(error: APIError) {
  switch (error.code) {
    case ErrorCode.NETWORK_ERROR:
      await Taro.showModal({
        title: '网络错误',
        content: error.message,
        showCancel: false,
        confirmText: '知道了'
      })
      break

    case ErrorCode.UNAUTHORIZED:
      // 清除登录信息
      Taro.removeStorageSync('token')
      Taro.removeStorageSync('userInfo')

      await Taro.showModal({
        title: '登录过期',
        content: '请重新登录',
        showCancel: false,
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            Taro.reLaunch({ url: '/pages/login/index' })
          }
        }
      })
      break

    case ErrorCode.RATE_LIMIT:
      Taro.showToast({
        title: error.message,
        icon: 'none',
        duration: 2000
      })
      break

    case ErrorCode.CONTENT_VIOLATION:
      await Taro.showModal({
        title: '内容违规',
        content: error.message + '\n\n' + (error.details?.violations || []).join('\n'),
        showCancel: false
      })
      break

    case ErrorCode.VALIDATION_ERROR:
      Taro.showToast({
        title: error.message,
        icon: 'none'
      })
      break

    default:
      Taro.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      })
  }
}

// 获取API基础URL
function getApiBaseUrl(): string {
  const env = Taro.getEnv()
  
  // 检查是否为生产环境
  const isProduction = process.env.NODE_ENV === 'production'
  
  // 根据环境返回不同的API地址
  switch (env as string) {
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

// 辅助函数
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 便捷方法
export const http = {
  get: <T = any>(url: string, params?: any, options?: any) =>
    request<T>({ url, method: 'GET', data: params, ...options }),

  post: <T = any>(url: string, data?: any, options?: any) =>
    request<T>({ url, method: 'POST', data, ...options }),

  put: <T = any>(url: string, data?: any, options?: any) =>
    request<T>({ url, method: 'PUT', data, ...options }),

  delete: <T = any>(url: string, data?: any, options?: any) =>
    request<T>({ url, method: 'DELETE', data, ...options })
}