/**
 * IEClub API Service
 * 统一的API请求服务
 */
import { API_CONFIG } from '../constants'

class ApiService {
  constructor(baseURL = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL
    this.timeout = API_CONFIG.TIMEOUT
  }

  /**
   * 通用请求方法
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      ...restOptions
    } = options

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        ...restOptions
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error('请求超时')
      }
      
      throw error
    }
  }

  /**
   * GET请求
   */
  get(endpoint, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url, { method: 'GET', ...options })
  }

  /**
   * POST请求
   */
  post(endpoint, data, options = {}) {
    return this.request(endpoint, { method: 'POST', body: data, ...options })
  }

  /**
   * PUT请求
   */
  put(endpoint, data, options = {}) {
    return this.request(endpoint, { method: 'PUT', body: data, ...options })
  }

  /**
   * DELETE请求
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options })
  }

  /**
   * 设置认证token
   */
  setAuthToken(token) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      'Authorization': `Bearer ${token}`
    }
  }

  /**
   * 清除认证token
   */
  clearAuthToken() {
    delete this.defaultHeaders?.Authorization
  }
}

export const apiService = new ApiService()
export default apiService

