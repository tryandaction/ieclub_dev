/**
 * 前端统一日志工具
 * 提供一致的日志格式和级别控制
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
}

class Logger {
  constructor() {
    // 根据环境设置日志级别
    this.level = import.meta.env.MODE === 'production' 
      ? LOG_LEVELS.WARN 
      : LOG_LEVELS.DEBUG
    
    // 是否启用时间戳
    this.enableTimestamp = true
    
    // 是否启用堆栈追踪
    this.enableStackTrace = import.meta.env.MODE === 'development'
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, message, data) {
    const parts = []
    
    // 添加时间戳
    if (this.enableTimestamp) {
      const timestamp = new Date().toISOString()
      parts.push(`[${timestamp}]`)
    }
    
    // 添加级别
    parts.push(`[${level}]`)
    
    // 添加消息
    parts.push(message)
    
    return parts.join(' ')
  }

  /**
   * 获取调用栈信息
   */
  getStackTrace() {
    if (!this.enableStackTrace) return null
    
    const stack = new Error().stack
    if (!stack) return null
    
    // 跳过前3行（Error, getStackTrace, 调用的日志方法）
    const lines = stack.split('\n').slice(3)
    return lines.join('\n')
  }

  /**
   * 调试日志
   */
  debug(message, ...args) {
    if (this.level > LOG_LEVELS.DEBUG) return
    
    const formattedMsg = this.formatMessage('DEBUG', message)
    console.log(`🔍 ${formattedMsg}`, ...args)
  }

  /**
   * 信息日志
   */
  info(message, ...args) {
    if (this.level > LOG_LEVELS.INFO) return
    
    const formattedMsg = this.formatMessage('INFO', message)
    console.log(`ℹ️ ${formattedMsg}`, ...args)
  }

  /**
   * 警告日志
   */
  warn(message, ...args) {
    if (this.level > LOG_LEVELS.WARN) return
    
    const formattedMsg = this.formatMessage('WARN', message)
    console.warn(`⚠️ ${formattedMsg}`, ...args)
  }

  /**
   * 错误日志
   */
  error(message, error, ...args) {
    if (this.level > LOG_LEVELS.ERROR) return
    
    const formattedMsg = this.formatMessage('ERROR', message)
    console.error(`❌ ${formattedMsg}`, ...args)
    
    if (error) {
      console.error('Error details:', error)
      
      if (this.enableStackTrace && error.stack) {
        console.error('Stack trace:', error.stack)
      }
    }
  }

  /**
   * API 请求日志
   */
  api(method, url, data) {
    if (this.level > LOG_LEVELS.DEBUG) return
    
    const formattedMsg = this.formatMessage('API', `${method} ${url}`)
    console.log(`📡 ${formattedMsg}`, data || '')
  }

  /**
   * API 响应日志
   */
  apiResponse(method, url, status, data) {
    if (this.level > LOG_LEVELS.DEBUG) return
    
    const emoji = status >= 200 && status < 300 ? '✅' : '❌'
    const formattedMsg = this.formatMessage('API', `${method} ${url} [${status}]`)
    console.log(`${emoji} ${formattedMsg}`, data || '')
  }

  /**
   * 性能日志
   */
  performance(label, duration) {
    if (this.level > LOG_LEVELS.DEBUG) return
    
    const formattedMsg = this.formatMessage('PERF', `${label}: ${duration}ms`)
    console.log(`⚡ ${formattedMsg}`)
  }

  /**
   * 用户操作日志
   */
  userAction(action, details) {
    if (this.level > LOG_LEVELS.INFO) return
    
    const formattedMsg = this.formatMessage('USER', action)
    console.log(`👤 ${formattedMsg}`, details || '')
  }

  /**
   * 设置日志级别
   */
  setLevel(level) {
    if (typeof level === 'string') {
      this.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO
    } else {
      this.level = level
    }
  }

  /**
   * 分组日志开始
   */
  group(label) {
    console.group(label)
  }

  /**
   * 分组日志结束
   */
  groupEnd() {
    console.groupEnd()
  }

  /**
   * 表格日志
   */
  table(data) {
    if (this.level > LOG_LEVELS.DEBUG) return
    console.table(data)
  }
}

// 导出单例
const logger = new Logger()

export default logger

// 导出便捷方法
export const {
  debug,
  info,
  warn,
  error,
  api,
  apiResponse,
  performance,
  userAction,
  group,
  groupEnd,
  table
} = logger

