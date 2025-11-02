import axios from 'axios'
import useLoadingStore from '../stores/loadingStore'

// 🔧 获取 API 基础地址（智能推断 + 降级方案）
const getApiBaseUrl = () => {
  // 1. 优先使用环境变量配置
  if (import.meta.env.VITE_API_BASE_URL) {
    const url = import.meta.env.VITE_API_BASE_URL
    console.log('📡 使用配置的 API 地址:', url)
    return url
  }
  
  // 2. 开发环境使用代理
  if (import.meta.env.MODE === 'development') {
    console.log('📡 开发模式，使用代理: /api')
    return '/api'
  }
  
  // 3. 生产环境根据当前域名自动推断
  const currentHost = window.location.hostname
  const protocol = window.location.protocol
  
  if (currentHost === 'ieclub.online' || currentHost.endsWith('.ieclub.online')) {
    const url = 'https://ieclub.online/api'
    console.log('📡 生产环境，自动配置 API 地址:', url)
    return url
  }
  
  // 4. 本地测试环境
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    const url = 'http://localhost:3000/api'
    console.log('📡 本地测试，使用:', url)
    return url
  }
  
  // 5. 其他域名使用相同域名（降级方案）
  const url = `${protocol}//${currentHost}/api`
  console.log('📡 未知域名，尝试使用:', url)
  return url
}

// 🚀 创建 axios 实例（全面优化版）
const request = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 增加超时时间到30秒
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json'
  },
  // 请求重试配置
  retry: 3,
  retryDelay: 1000,
  // 允许跨域携带凭证
  withCredentials: false,
  // 最大内容长度
  maxContentLength: 50 * 1024 * 1024, // 50MB
  maxBodyLength: 50 * 1024 * 1024,
  // 验证状态码
  validateStatus: (status) => status >= 200 && status < 300
})

// 📊 请求统计
let requestStats = {
  total: 0,
  success: 0,
  failed: 0,
  retried: 0
}

// 获取统计信息
export const getRequestStats = () => ({ ...requestStats })

// 显示 Loading
const showLoading = () => {
  useLoadingStore.getState().incrementRequest()
}

// 隐藏 Loading
const hideLoading = () => {
  useLoadingStore.getState().decrementRequest()
}

// 🔐 请求拦截器（增强版）
request.interceptors.request.use(
  config => {
    // 统计请求数
    requestStats.total++
    
    // 注入 Token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 显示 Loading（除非明确设置 loading: false）
    if (config.loading !== false) {
      showLoading()
    }
    
    // 添加请求时间戳（用于性能监控）
    config.metadata = { startTime: Date.now() }
    
    // 打印请求信息
    const fullURL = config.baseURL + config.url
    console.log(`🚀 [${config.method?.toUpperCase()}] ${fullURL}`, {
      params: config.params,
      data: config.data,
      headers: config.headers
    })
    
    return config
  },
  error => {
    hideLoading()
    requestStats.failed++
    console.error('❌ 请求配置错误:', error)
    return Promise.reject(error)
  }
)

// ✅ 响应拦截器（增强版）
request.interceptors.response.use(
  response => {
    // 隐藏 Loading
    if (response.config.loading !== false) {
      hideLoading()
    }
    
    // 统计成功请求
    requestStats.success++
    
    // 计算请求耗时
    const duration = Date.now() - (response.config.metadata?.startTime || 0)
    console.log(`✅ [${response.config.method?.toUpperCase()}] ${response.config.url} (${duration}ms)`)
    
    const responseData = response.data
    
    // 如果后端返回的是标准格式 {success, message, data}
    if (Object.prototype.hasOwnProperty.call(responseData, 'success')) {
      if (responseData.success) {
        return responseData.data || responseData
      } else {
        const error = new Error(responseData.message || '请求失败')
        error.code = responseData.code || 'BUSINESS_ERROR'
        error.response = response
        throw error
      }
    }
    
    // 如果后端返回的是 {code, data, message} 格式
    if (Object.prototype.hasOwnProperty.call(responseData, 'code')) {
      const { code, data, message } = responseData
      
      // 业务成功
      if (code === 200 || code === 0) {
        return data !== undefined ? data : responseData
      }
      
      // Token 过期
      if (code === 401) {
        console.warn('🔒 Token 已过期，跳转登录页')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setTimeout(() => {
          window.location.href = '/login'
        }, 500)
        const error = new Error('登录已过期，请重新登录')
        error.code = 401
        error.response = response
        throw error
      }
      
      // 业务失败
      const error = new Error(message || '请求失败')
      error.code = code
      error.response = response
      throw error
    }
    
    // 直接返回数据
    return responseData
  },
  async error => {
    // 隐藏 Loading
    if (error.config && error.config.loading !== false) {
      hideLoading()
    }

    // 统计失败请求
    requestStats.failed++
    
    // 计算请求耗时
    const duration = error.config?.metadata?.startTime 
      ? Date.now() - error.config.metadata.startTime 
      : 0

    // 🔄 请求重试逻辑（智能重试）
    const config = error.config
    const shouldRetry = !error.response || // 网络错误
                       error.response?.status >= 500 || // 服务器错误
                       error.response?.status === 429 || // 请求过多
                       error.code === 'ECONNABORTED' || // 超时
                       error.code === 'ETIMEDOUT' // 超时
    
    if (config && config.retry && shouldRetry) {
      config.__retryCount = config.__retryCount || 0
      
      if (config.__retryCount < config.retry) {
        config.__retryCount++
        requestStats.retried++
        
        // 指数退避重试策略
        const delay = config.retryDelay * Math.pow(2, config.__retryCount - 1)
        const status = error.response?.status || '网络错误'
        console.warn(`🔄 [重试 ${config.__retryCount}/${config.retry}] ${config.url} (${status}) - ${delay}ms 后重试`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return request(config)
      } else {
        console.error(`❌ [重试失败] ${config.url} - 已达最大重试次数`)
      }
    }
    
    // 🌐 网络错误
    if (!error.response) {
      console.error(`❌ [网络错误] ${error.config?.url || 'unknown'} (${duration}ms)`, {
        code: error.code,
        message: error.message
      })
      
      const err = new Error('网络连接失败，请检查网络设置')
      err.code = 'NETWORK_ERROR'
      err.originalError = error
      throw err
    }
    
    // 📛 HTTP 错误
    const { status, data } = error.response
    let errorMessage = '请求失败'
    
    // 尝试从响应数据中获取错误信息
    if (data) {
      if (data.message) {
        errorMessage = data.message
      } else if (data.error) {
        errorMessage = data.error
      } else if (typeof data === 'string') {
        errorMessage = data
      }
    }
    
    // 特殊状态码处理
    switch (status) {
      case 400:
        errorMessage = data?.message || '请求参数错误'
        console.error(`❌ [400] ${error.config.url}:`, errorMessage)
        break
      case 401:
        errorMessage = '登录已过期，请重新登录'
        console.warn(`🔒 [401] ${error.config.url}: Token 已过期`)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }, 1000)
        break
      case 403:
        errorMessage = data?.message || '没有权限访问该资源'
        console.error(`🚫 [403] ${error.config.url}:`, errorMessage)
        break
      case 404:
        errorMessage = data?.message || `接口不存在: ${error.config?.method?.toUpperCase()} ${error.config?.url}`
        console.error(`❌ [404] ${error.config?.baseURL}${error.config?.url}`)
        break
      case 429:
        errorMessage = data?.message || '请求过于频繁，请稍后重试'
        console.warn(`⚠️ [429] ${error.config.url}: 请求限流`)
        break
      case 500:
        errorMessage = data?.message || '服务器内部错误，请稍后重试'
        console.error(`💥 [500] ${error.config.url}:`, {
          duration: `${duration}ms`,
          data: data
        })
        break
      case 502:
        errorMessage = '网关错误，服务暂时不可用'
        console.error(`💥 [502] ${error.config.url}: 网关错误`)
        break
      case 503:
        errorMessage = '服务暂时不可用，请稍后重试'
        console.error(`💥 [503] ${error.config.url}: 服务不可用`)
        break
      default:
        console.error(`❌ [${status}] ${error.config.url} (${duration}ms)`, data)
    }
    
    const err = new Error(errorMessage)
    err.code = status
    err.response = error.response
    err.originalError = error
    throw err
  }
)

export default request

