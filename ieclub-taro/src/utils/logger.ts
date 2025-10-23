// ==================== 安全日志系统 ====================

import Taro from '@tarojs/taro'

// 使用统一的API配置
import { getApiBaseUrl } from '@/utils/api-config'

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: number
  userId?: string
  page?: string
}

class Logger {
  private readonly SENSITIVE_FIELDS = [
    'password', 'token', 'accessToken', 'refreshToken',
    'phone', 'email', 'idCard', 'bankCard',
    'secret', 'apiKey', 'privateKey'
  ]

  private readonly MAX_LOG_SIZE = 100
  private logs: LogEntry[] = []

  /**
   * Debug日志
   */
  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data)
  }

  /**
   * Info日志
   */
  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data)
  }

  /**
   * Warning日志
   */
  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data)
  }

  /**
   * Error日志
   */
  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data)
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      data: this.sanitize(data),
      timestamp: Date.now(),
      userId: Taro.getStorageSync('userInfo')?.id,
      page: getCurrentPage()
    }

    // 开发环境输出到控制台
    if (Taro.getEnv() === 'unknown') { // 开发环境
      const method = level === LogLevel.ERROR ? 'error' :
                     level === LogLevel.WARN ? 'warn' : 'log'
      console[method](`[${LogLevel[level]}] ${message}`, entry.data)
    }

    // 生产环境存储到内存
    if (Taro.getEnv() !== 'unknown') { // 生产环境
      this.logs.push(entry)

      // 限制日志数量
      if (this.logs.length > this.MAX_LOG_SIZE) {
        this.logs.shift()
      }

      // 错误日志立即上报
      if (level === LogLevel.ERROR) {
        this.reportToServer(entry)
      }
    }
  }

  /**
   * 净化敏感信息
   */
  private sanitize(data: any): any {
    if (!data) return data

    if (typeof data !== 'object') return data

    try {
      const sanitized = JSON.parse(JSON.stringify(data))

      const sanitizeObject = (obj: any) => {
        for (const key in obj) {
          if (this.SENSITIVE_FIELDS.some(field =>
            key.toLowerCase().includes(field.toLowerCase())
          )) {
            obj[key] = '***REDACTED***'
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key])
          }
        }
      }

      sanitizeObject(sanitized)
      return sanitized

    } catch (error) {
      return '[Sanitize Error]'
    }
  }

  /**
   * 上报到服务器
   */
  private async reportToServer(entry: LogEntry) {
    try {
      await Taro.request({
        url: `${getApiBaseUrl()}/api/logs`,
        method: 'POST',
        data: entry,
        header: {
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      // 上报失败，静默处理
      console.error('日志上报失败:', error)
    }
  }

  /**
   * 获取最近的日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * 清空日志
   */
  clear() {
    this.logs = []
  }
}

// 全局实例
export const logger = new Logger()

// 辅助函数
function getCurrentPage(): string {
  const pages = Taro.getCurrentPages()
  const currentPage = pages[pages.length - 1]
  return currentPage?.route || 'unknown'
}