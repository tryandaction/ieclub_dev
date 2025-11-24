import axios from 'axios'
import useLoadingStore from '../stores/loadingStore'

// 🔒 敏感数据过滤函数（防止密码泄露到控制台）
const sanitizeSensitiveData = (data) => {
  if (!data) return data
  
  // 如果是字符串，尝试解析为JSON
  let parsedData = data
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data)
    } catch {
      return data
    }
  }
  
  // 复制对象，避免修改原数据
  const sanitized = { ...parsedData }
  
  // 敏感字段列表
  const sensitiveFields = ['password', 'oldPassword', 'newPassword', 'token', 'accessToken', 'refreshToken']
  
  // 过滤敏感字段
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***hidden***'
    }
  })
  
  return sanitized
}

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
  
  // 测试环境：test.ieclub.online
  if (currentHost === 'test.ieclub.online') {
    const url = 'https://test.ieclub.online/api'
    console.log('📡 测试环境，使用测试 API:', url)
    return url
  }
  
  // 生产环境：ieclub.online（不包含子域名）
  if (currentHost === 'ieclub.online') {
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

// 🔐 无需认证的API白名单（不携带token）
// 注意：这些接口对应后端路由中不需要token的公开接口
const NO_AUTH_URLS = [
  // 登录相关
  '/auth/login',                // 密码登录
  '/auth/login-with-code',      // 验证码登录
  '/auth/login-with-phone',     // 手机号登录
  '/auth/wechat-login',         // 微信登录
  
  // 注册和密码重置
  '/auth/register',             // 注册
  '/auth/forgot-password',      // 忘记密码
  '/auth/reset-password',       // 重置密码
  
  // 验证码相关
  '/auth/send-verify-code',     // 发送邮箱验证码
  '/auth/send-code',            // 发送验证码（兼容旧版）
  '/auth/verify-code',          // 验证验证码
  '/auth/send-phone-code',      // 发送手机验证码
  
  // Token相关
  '/auth/refresh'               // 刷新token
]

// Loading超时定时器
let loadingTimeoutId = null

// 显示 Loading
const showLoading = () => {
  const store = useLoadingStore.getState()
  store.incrementRequest()
  
  // 清除旧的超时定时器
  if (loadingTimeoutId) {
    clearTimeout(loadingTimeoutId)
  }
  
  // 超时保护：15秒后强制关闭loading
  loadingTimeoutId = setTimeout(() => {
    if (store.requestCount > 0) {
      console.warn('⚠️ Loading超时，强制重置')
      store.reset()
    }
    loadingTimeoutId = null
  }, 15000)
}

// 隐藏 Loading
const hideLoading = () => {
  const store = useLoadingStore.getState()
  store.decrementRequest()
  
  // 如果所有请求都完成了，清除超时定时器
  if (store.requestCount === 0 && loadingTimeoutId) {
    clearTimeout(loadingTimeoutId)
    loadingTimeoutId = null
  }
}

// 🔐 请求拦截器（增强版）
request.interceptors.request.use(
  config => {
    // 统计请求数
    requestStats.total++
    
    // 检查是否需要认证
    const needsAuth = !NO_AUTH_URLS.some(url => config.url?.includes(url))
    
    // 仅对需要认证的接口注入 Token
    if (needsAuth) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } else {
      console.log('✅ [Request] 无需认证接口，不添加token:', config.url)
    }
    
    // 显示 Loading（除非明确设置 loading: false）
    if (config.loading !== false) {
      showLoading()
    }
    
    // 添加请求时间戳（用于性能监控）
    config.metadata = { startTime: Date.now() }
    
    // 打印请求信息（隐藏敏感字段）
    const fullURL = config.baseURL + config.url
    const sanitizedData = config.data ? sanitizeSensitiveData(config.data) : undefined
    console.log(`🚀 [${config.method?.toUpperCase()}] ${fullURL}`, {
      params: config.params,
      data: sanitizedData,
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

// 刷新 token 的锁（防止并发刷新）
let isRefreshing = false
let refreshSubscribers = []

// 添加刷新队列订阅
function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb)
}

// 刷新成功后通知所有订阅者
function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

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
    const status = error.response?.status
    const data = error.response?.data // 提前获取响应数据
    
    // 明确排除不应该重试的状态码
    // 503 错误不应该重试（服务不可用通常是配置问题，重试无意义且会导致限流）
    const noRetryStatuses = [400, 401, 403, 404, 429, 503]; // 这些状态码不应该重试
    
    // 429错误绝对不应该重试，应该直接返回错误（避免连续触发限流）
    if (status === 429) {
      // 429错误直接返回，不重试
      const errorMessage = data?.message || '请求过于频繁，请稍后重试'
      console.warn(`⚠️ [429] ${config?.url || 'unknown'}: 请求限流 - 不重试`)
      const err = new Error(errorMessage)
      err.code = 429
      err.response = error.response
      err.originalError = error
      throw err
    }
    
    // 503错误不应该重试（服务不可用，通常是配置问题）
    if (status === 503) {
      const errorMessage = data?.message || '服务暂时不可用，请稍后重试'
      console.warn(`⚠️ [503] ${config?.url || 'unknown'}: 服务不可用 - 不重试`)
      const err = new Error(errorMessage)
      err.code = 503
      err.response = error.response
      err.originalError = error
      throw err
    }
    
    // 只有网络错误和部分服务器错误才重试（排除 503）
    const shouldRetry = config && config.retry && 
                       (!error.response || // 网络错误
                       (status >= 500 && status < 600 && status !== 503) || // 服务器错误（5xx，但排除503）
                       error.code === 'ECONNABORTED' || // 超时
                       error.code === 'ETIMEDOUT') // 超时
    
    // 确保不应该重试的状态码不会重试
    if (shouldRetry && status && noRetryStatuses.includes(status)) {
      // 不应该重试的状态码，直接返回错误
      const err = new Error(data?.message || `请求失败 (${status})`)
      err.code = status
      err.response = error.response
      err.originalError = error
      throw err
    }
    
    if (shouldRetry) {
      config.__retryCount = config.__retryCount || 0
      
      if (config.__retryCount < config.retry) {
        config.__retryCount++
        requestStats.retried++
        
        // 指数退避重试策略
        const delay = config.retryDelay * Math.pow(2, config.__retryCount - 1)
        const statusText = status || '网络错误'
        console.warn(`🔄 [重试 ${config.__retryCount}/${config.retry}] ${config.url} (${statusText}) - ${delay}ms 后重试`)
        
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
    // status 和 data 已在第208-209行声明，无需重复声明
    const requestUrl = error.config?.url || ''
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
    
    // 判断是否为认证相关接口（登录、注册、发送验证码等）
    const isAuthEndpoint = /\/auth\/(login|register|send-verify-code|verify-code|login-with-code|login-with-phone|forgot-password|reset-password)/.test(requestUrl)
    
    // 特殊状态码处理
    switch (status) {
      case 400:
        errorMessage = data?.message || '请求参数错误'
        console.error(`❌ [400] ${error.config.url}:`, errorMessage)
        break
      case 401:
        // 如果是认证接口（登录/注册），使用后端返回的错误消息，不跳转
        if (isAuthEndpoint) {
          errorMessage = data?.message || '邮箱或密码错误'
          console.warn(`🔒 [401] ${error.config.url}:`, errorMessage)
        } else {
          // 其他接口的 401 错误，尝试刷新 token
          const refreshToken = localStorage.getItem('refreshToken')
          
          if (refreshToken && !isRefreshing) {
            isRefreshing = true
            console.log('🔄 Token 已过期，尝试自动刷新...')
            
            try {
              // 调用刷新接口
              const { data: refreshData } = await axios.post(
                `${getApiBaseUrl()}/auth/refresh`,
                { refreshToken },
                { headers: { 'Content-Type': 'application/json' } }
              )
              
              const { accessToken, refreshToken: newRefreshToken } = refreshData.data || refreshData
              
              // 更新 token
              localStorage.setItem('token', accessToken)
              localStorage.setItem('refreshToken', newRefreshToken)
              
              // 通知所有等待的请求
              onRefreshed(accessToken)
              isRefreshing = false
              
              // 重试原请求
              error.config.headers.Authorization = `Bearer ${accessToken}`
              return request(error.config)
              
            } catch (refreshError) {
              // 刷新失败，清除 token 并跳转登录
              isRefreshing = false
              refreshSubscribers = []
              console.error('❌ Token 刷新失败:', refreshError)
              
              errorMessage = '登录已过期，请重新登录'
              localStorage.removeItem('token')
              localStorage.removeItem('refreshToken')
              localStorage.removeItem('user')
              setTimeout(() => {
                if (window.location.pathname !== '/login') {
                  window.location.href = '/login'
                }
              }, 1000)
            }
          } else if (refreshToken && isRefreshing) {
            // 正在刷新中，将请求加入队列
            return new Promise((resolve) => {
              subscribeTokenRefresh((token) => {
                error.config.headers.Authorization = `Bearer ${token}`
                resolve(request(error.config))
              })
            })
          } else {
            // 没有 refresh token，直接跳转登录
            errorMessage = '登录已过期，请重新登录'
            console.warn(`🔒 [401] ${error.config.url}: Token 已过期`)
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            setTimeout(() => {
              if (window.location.pathname !== '/login') {
                window.location.href = '/login'
              }
            }, 1000)
          }
        }
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

