/**
 * API 响应处理工具
 * 统一处理各种响应格式，防止数据访问错误
 */

/**
 * 安全地获取嵌套属性
 * @param {Object} obj - 对象
 * @param {String} path - 属性路径，如 'data.user.name'
 * @param {*} defaultValue - 默认值
 * @returns {*}
 */
export function safeGet(obj, path, defaultValue = undefined) {
  if (!obj || typeof obj !== 'object') {
    return defaultValue
  }

  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue
    }
    result = result[key]
  }

  return result !== undefined ? result : defaultValue
}

/**
 * 检查响应是否成功
 * @param {Object} response - API 响应
 * @returns {Boolean}
 */
export function isSuccessResponse(response) {
  if (!response) return false

  // 格式 1: { success: true, data: ... }
  if (Object.prototype.hasOwnProperty.call(response, 'success')) {
    return response.success === true
  }

  // 格式 2: { code: 200, data: ... }
  if (Object.prototype.hasOwnProperty.call(response, 'code')) {
    return response.code === 200 || response.code === '200'
  }

  // 格式 3: 直接返回数据（axios 已处理）
  return true
}

/**
 * 提取响应数据
 * 支持多种响应格式
 * @param {Object} response - API 响应
 * @param {*} defaultValue - 默认值
 * @returns {*}
 */
export function extractData(response, defaultValue = null) {
  if (!response) {
    return defaultValue
  }

  // 格式 1: { success: true, data: {...} }
  if (Object.prototype.hasOwnProperty.call(response, 'success') && response.success) {
    return response.data !== undefined ? response.data : defaultValue
  }

  // 格式 2: { code: 200, data: {...} }
  if (Object.prototype.hasOwnProperty.call(response, 'code')) {
    if (response.code === 200 || response.code === '200') {
      return response.data !== undefined ? response.data : defaultValue
    }
    return defaultValue
  }

  // 格式 3: 直接返回数据
  return response
}

/**
 * 提取错误信息
 * @param {Error|Object} error - 错误对象
 * @returns {String}
 */
export function extractErrorMessage(error) {
  if (!error) {
    return '未知错误'
  }

  // 标准 Error 对象
  if (error instanceof Error) {
    return error.message || '请求失败'
  }

  // API 错误响应
  if (typeof error === 'object') {
    // 格式 1: { message: '...' }
    if (error.message) {
      return error.message
    }

    // 格式 2: { msg: '...' }
    if (error.msg) {
      return error.msg
    }

    // 格式 3: { error: '...' }
    if (error.error) {
      return typeof error.error === 'string' ? error.error : '请求失败'
    }

    // 格式 4: { data: { message: '...' } }
    if (error.data && error.data.message) {
      return error.data.message
    }
  }

  // 字符串错误
  if (typeof error === 'string') {
    return error
  }

  return '请求失败'
}

/**
 * 标准化响应格式
 * 将各种格式统一为 { success, data, message }
 * @param {Object} response - API 响应
 * @returns {Object}
 */
export function normalizeResponse(response) {
  if (!response) {
    return {
      success: false,
      data: null,
      message: '响应为空'
    }
  }

  // 已经是标准格式
  if (Object.prototype.hasOwnProperty.call(response, 'success')) {
    return {
      success: response.success,
      data: response.data || null,
      message: response.message || ''
    }
  }

  // { code: 200, data: ..., message: ... }
  if (Object.prototype.hasOwnProperty.call(response, 'code')) {
    return {
      success: response.code === 200 || response.code === '200',
      data: response.data || null,
      message: response.message || ''
    }
  }

  // 直接返回数据
  return {
    success: true,
    data: response,
    message: ''
  }
}

/**
 * 安全地访问数组
 * @param {*} value - 可能是数组的值
 * @param {Array} defaultValue - 默认值
 * @returns {Array}
 */
export function ensureArray(value, defaultValue = []) {
  if (Array.isArray(value)) {
    return value
  }
  return defaultValue
}

/**
 * 安全地访问对象
 * @param {*} value - 可能是对象的值
 * @param {Object} defaultValue - 默认值
 * @returns {Object}
 */
export function ensureObject(value, defaultValue = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value
  }
  return defaultValue
}

/**
 * 安全地访问数字
 * @param {*} value - 可能是数字的值
 * @param {Number} defaultValue - 默认值
 * @returns {Number}
 */
export function ensureNumber(value, defaultValue = 0) {
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

/**
 * 安全地访问字符串
 * @param {*} value - 可能是字符串的值
 * @param {String} defaultValue - 默认值
 * @returns {String}
 */
export function ensureString(value, defaultValue = '') {
  if (typeof value === 'string') {
    return value
  }
  if (value === null || value === undefined) {
    return defaultValue
  }
  return String(value)
}

/**
 * 处理分页数据
 * @param {Object} response - API 响应
 * @returns {Object}
 */
export function extractPaginationData(response) {
  const data = extractData(response, {})
  
  return {
    list: ensureArray(data.list || data.items || data.data || data),
    total: ensureNumber(data.total || data.count, 0),
    page: ensureNumber(data.page || data.current, 1),
    pageSize: ensureNumber(data.pageSize || data.size, 10),
    hasMore: data.hasMore !== undefined ? data.hasMore : false
  }
}

/**
 * 创建响应处理器
 * @param {Object} options - 选项
 * @returns {Function}
 */
export function createResponseHandler(options = {}) {
  const {
    onSuccess,
    onError,
    transform,
    defaultValue
  } = options

  return (response) => {
    try {
      if (isSuccessResponse(response)) {
        let data = extractData(response, defaultValue)
        
        // 数据转换
        if (transform && typeof transform === 'function') {
          data = transform(data)
        }
        
        // 成功回调
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(data)
        }
        
        return data
      } else {
        const message = extractErrorMessage(response)
        
        // 错误回调
        if (onError && typeof onError === 'function') {
          onError(message)
        }
        
        throw new Error(message)
      }
    } catch (error) {
      const message = extractErrorMessage(error)
      
      // 错误回调
      if (onError && typeof onError === 'function') {
        onError(message)
      }
      
      throw error
    }
  }
}

export default {
  safeGet,
  isSuccessResponse,
  extractData,
  extractErrorMessage,
  normalizeResponse,
  ensureArray,
  ensureObject,
  ensureNumber,
  ensureString,
  extractPaginationData,
  createResponseHandler
}

