import axios from 'axios'
import useLoadingStore from '../stores/loadingStore'

// 获取 API 基础地址（智能推断）
const getApiBaseUrl = () => {
  // 1. 优先使用环境变量配置
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // 2. 开发环境使用代理
  if (import.meta.env.MODE === 'development') {
    return '/api'
  }
  
  // 3. 生产环境根据当前域名自动推断
  const currentHost = window.location.hostname
  if (currentHost === 'ieclub.online' || currentHost.endsWith('.ieclub.online')) {
    return 'https://ieclub.online/api'
  }
  
  // 4. 其他域名使用相同域名
  const protocol = window.location.protocol
  return `${protocol}//${currentHost}/api`
}

// 创建 axios 实例（优化版）
const request = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000, // 增加超时时间到15秒
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  // 请求重试配置
  retry: 3,
  retryDelay: 1000,
  // 允许跨域携带凭证
  withCredentials: false,
  // 最大内容长度
  maxContentLength: 50 * 1024 * 1024, // 50MB
  maxBodyLength: 50 * 1024 * 1024
})

// 显示 Loading
const showLoading = () => {
  useLoadingStore.getState().incrementRequest()
}

// 隐藏 Loading
const hideLoading = () => {
  useLoadingStore.getState().decrementRequest()
}

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 注入 Token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 显示 Loading（除非明确设置 loading: false）
    if (config.loading !== false) {
      showLoading()
    }
    
    // 开发环境下打印请求信息
    if (import.meta.env.DEV) {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        data: config.data,
        params: config.params
      })
    }
    
    return config
  },
  error => {
    hideLoading()
    console.error('❌ Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 隐藏 Loading
    if (response.config.loading !== false) {
      hideLoading()
    }
    
    const responseData = response.data
    
    // 如果后端返回的是标准格式 {success, message, data}
    if (Object.prototype.hasOwnProperty.call(responseData, 'success')) {
      if (responseData.success) {
        return responseData.data || responseData
      } else {
        const error = new Error(responseData.message || '请求失败')
        error.code = responseData.code || 'BUSINESS_ERROR'
        throw error
      }
    }
    
    // 如果后端返回的是 {code, data, message} 格式
    if (Object.prototype.hasOwnProperty.call(responseData, 'code')) {
      const { code, data, message } = responseData
      
      // 业务成功
      if (code === 200) {
        return data
      }
      
      // Token 过期
      if (code === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        const error = new Error('登录已过期，请重新登录')
        error.code = 401
        throw error
      }
      
      // 业务失败
      const error = new Error(message || '请求失败')
      error.code = code
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

    // 请求重试逻辑（优化：只对特定错误重试）
    const config = error.config
    const shouldRetry = !error.response || // 网络错误
                       error.response.status >= 500 || // 服务器错误
                       error.response.status === 429 || // 请求过多
                       error.code === 'ECONNABORTED' // 超时
    
    if (config && config.retry && shouldRetry) {
      config.__retryCount = config.__retryCount || 0
      
      if (config.__retryCount < config.retry) {
        config.__retryCount++
        
        // 指数退避重试策略
        const delay = config.retryDelay * Math.pow(2, config.__retryCount - 1)
        console.log(`🔄 请求失败，${delay}ms 后进行第 ${config.__retryCount} 次重试...`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return request(config)
      }
    }
    
    // 网络错误
    if (!error.response) {
      const err = new Error('网络连接失败，请检查网络')
      err.code = 'NETWORK_ERROR'
      throw err
    }
    
    // HTTP 错误
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
        if (!data || !data.message) {
          errorMessage = '请求参数错误'
        }
        break
      case 401:
        errorMessage = '登录已过期，请重新登录'
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
        break
      case 403:
        if (!data || !data.message) {
          errorMessage = '没有权限访问'
        }
        break
      case 404: {
        // 404错误提供更详细的信息
        const requestURL = error.config?.url || 'unknown'
        const fullURL = error.config?.baseURL ? `${error.config.baseURL}${requestURL}` : requestURL
        console.error('❌ 404 Error:', {
          url: requestURL,
          fullURL: fullURL,
          method: error.config?.method,
          response: data
        })
        if (!data || !data.message) {
          errorMessage = `路由不存在: ${error.config?.method?.toUpperCase()} ${requestURL}`
        }
        break
      }
      case 429:
        if (!data || !data.message) {
          errorMessage = '请求过于频繁，请稍后重试'
        }
        break
      case 500:
        if (!data || !data.message) {
          errorMessage = '服务器错误，请稍后重试'
        }
        break
    }
    
    const err = new Error(errorMessage)
    err.code = status
    throw err
  }
)

export default request

