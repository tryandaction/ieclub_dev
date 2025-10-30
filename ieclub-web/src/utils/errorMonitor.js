/**
 * 错误监控服务
 * 用于收集和上报前端错误
 */

class ErrorMonitor {
  constructor() {
    this.errors = []
    this.maxErrors = 50 // 最多保存50条错误
    this.apiEndpoint = '/api/errors/report' // 错误上报接口
    this.enableConsole = import.meta.env.DEV // 开发环境打印到控制台
  }

  /**
   * 初始化错误监控
   */
  init() {
    // 监听全局错误
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    })

    // 监听Promise未捕获的错误
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'promise',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack
      })
    })

    // 监听资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.captureError({
          type: 'resource',
          message: `资源加载失败: ${event.target.src || event.target.href}`,
          element: event.target.tagName
        })
      }
    }, true)

    if (this.enableConsole) {
      console.log('✅ 错误监控已启动')
    }
  }

  /**
   * 捕获错误
   */
  captureError(error) {
    const errorInfo = {
      ...error,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getUserId()
    }

    // 添加到本地错误列表
    this.errors.unshift(errorInfo)
    if (this.errors.length > this.maxErrors) {
      this.errors.pop()
    }

    // 保存到localStorage
    this.saveToLocalStorage()

    // 控制台输出
    if (this.enableConsole) {
      console.error('🔴 错误捕获:', errorInfo)
    }

    // 上报到服务器（非阻塞）
    this.reportToServer(errorInfo)
  }

  /**
   * 手动记录错误
   */
  logError(error, context = {}) {
    this.captureError({
      type: 'manual',
      message: error.message || String(error),
      stack: error.stack,
      context,
      severity: context.severity || 'error'
    })
  }

  /**
   * 记录React错误
   */
  logReactError(error, errorInfo) {
    this.captureError({
      type: 'react',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
  }

  /**
   * 上报到服务器
   */
  async reportToServer(errorInfo) {
    // 生产环境才上报
    if (import.meta.env.DEV) {
      return
    }

    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorInfo),
        // 不阻塞主流程
        keepalive: true
      })
    } catch (err) {
      // 上报失败不影响主流程
      console.warn('错误上报失败:', err)
    }
  }

  /**
   * 保存到localStorage
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem('error_logs', JSON.stringify(this.errors.slice(0, 10)))
    } catch (err) {
      // 忽略存储错误
    }
  }

  /**
   * 从localStorage加载
   */
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('error_logs')
      if (saved) {
        this.errors = JSON.parse(saved)
      }
    } catch (err) {
      // 忽略加载错误
    }
  }

  /**
   * 获取用户ID
   */
  getUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user.id || 'anonymous'
    } catch {
      return 'anonymous'
    }
  }

  /**
   * 获取所有错误
   */
  getErrors() {
    return this.errors
  }

  /**
   * 清空错误
   */
  clearErrors() {
    this.errors = []
    localStorage.removeItem('error_logs')
  }

  /**
   * 获取错误统计
   */
  getStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      recent: this.errors.slice(0, 5)
    }

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
    })

    return stats
  }
}

// 创建单例
const errorMonitor = new ErrorMonitor()

// 开发环境下，将错误监控暴露到全局，方便调试
if (import.meta.env.DEV) {
  window.__errorMonitor = errorMonitor
}

export default errorMonitor

