import axios from 'axios'
import useLoadingStore from '../stores/loadingStore'

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
    if (responseData.hasOwnProperty('success')) {
      if (responseData.success) {
        return responseData.data || responseData
      } else {
        const error = new Error(responseData.message || '请求失败')
        error.code = responseData.code || 'BUSINESS_ERROR'
        throw error
      }
    }
    
    // 如果后端返回的是 {code, data, message} 格式
    if (responseData.hasOwnProperty('code')) {
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
      case 404:
        if (!data || !data.message) {
          errorMessage = '请求的资源不存在'
        }
        break
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

