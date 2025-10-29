import axios from 'axios'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  // 请求重试配置
  retry: 3,
  retryDelay: 1000
})

// Loading 计数器（支持并发请求）
let loadingCount = 0

// 显示 Loading
const showLoading = () => {
  if (loadingCount === 0) {
    // TODO: 接入全局 Loading 组件
    console.log('🔄 Loading start...')
  }
  loadingCount++
}

// 隐藏 Loading
const hideLoading = () => {
  loadingCount--
  if (loadingCount === 0) {
    console.log('✅ Loading end')
  }
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
    
    const { code, data, message } = response.data
    
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
  },
  async error => {
    // 隐藏 Loading
    if (error.config && error.config.loading !== false) {
      hideLoading()
    }

    // 请求重试逻辑
    const config = error.config
    if (config && config.retry && config.__retryCount < config.retry) {
      config.__retryCount = config.__retryCount || 0
      config.__retryCount++

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, config.retryDelay * config.__retryCount))
      
      return request(config)
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
    
    switch (status) {
      case 400:
        errorMessage = data.message || '请求参数错误'
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
        errorMessage = '没有权限访问'
        break
      case 404:
        errorMessage = '请求的资源不存在'
        break
      case 500:
        errorMessage = '服务器错误，请稍后重试'
        break
      default:
        errorMessage = data.message || '请求失败'
    }
    
    const err = new Error(errorMessage)
    err.code = status
    throw err
  }
)

export default request

