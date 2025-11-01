/**
 * 性能监控工具
 * 用于监控和优化页面性能
 */

class PerformanceMonitor {
  constructor() {
    this.marks = new Map()
    this.measures = []
    this.enableConsole = import.meta.env.DEV
  }

  /**
   * 初始化性能监控
   */
  init() {
    // 监听页面加载性能
    if (window.PerformanceObserver) {
      this.observeResourceTiming()
      this.observeLongTasks()
      this.observeLayoutShifts()
    }

    // 页面加载完成后记录核心指标
    if (document.readyState === 'complete') {
      this.recordLoadMetrics()
    } else {
      window.addEventListener('load', () => this.recordLoadMetrics())
    }

    if (this.enableConsole) {
      console.log('✅ 性能监控已启动')
    }
  }

  /**
   * 监控资源加载时间
   */
  observeResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) { // 超过1秒的资源
          this.logWarning('慢资源', {
            name: entry.name,
            duration: Math.round(entry.duration),
            type: entry.initiatorType
          })
        }
      }
    })
    observer.observe({ entryTypes: ['resource'] })
  }

  /**
   * 监控长任务
   */
  observeLongTasks() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.logWarning('长任务检测', {
            duration: Math.round(entry.duration),
            startTime: Math.round(entry.startTime)
          })
        }
      })
      observer.observe({ entryTypes: ['longtask'] })
    } catch (e) {
      // longtask API 可能不被支持
    }
  }

  /**
   * 监控布局偏移（CLS）
   */
  observeLayoutShifts() {
    try {
      let clsScore = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value
          }
        }
        
        if (clsScore > 0.1) { // CLS 大于 0.1 视为需要优化
          this.logWarning('布局偏移', { clsScore: clsScore.toFixed(4) })
        }
      })
      observer.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      // layout-shift API 可能不被支持
    }
  }

  /**
   * 记录页面加载核心指标
   */
  recordLoadMetrics() {
    if (!window.performance || !window.performance.timing) {
      return
    }

    const timing = performance.timing
    const metrics = {
      // DNS 查询时间
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      // TCP 连接时间
      tcp: timing.connectEnd - timing.connectStart,
      // 请求响应时间
      request: timing.responseEnd - timing.requestStart,
      // DOM 解析时间
      domParse: timing.domInteractive - timing.domLoading,
      // 资源加载时间
      resourceLoad: timing.loadEventStart - timing.domContentLoadedEventEnd,
      // 总加载时间
      total: timing.loadEventEnd - timing.navigationStart,
      // 首屏时间
      firstPaint: this.getFirstPaint(),
      // 可交互时间
      interactive: timing.domInteractive - timing.navigationStart
    }

    if (this.enableConsole) {
      console.table(metrics)
    }

    // Web Vitals
    this.recordWebVitals()

    return metrics
  }

  /**
   * 获取首屏渲染时间
   */
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return firstPaint ? Math.round(firstPaint.startTime) : 0
  }

  /**
   * 记录 Web Vitals 指标
   */
  recordWebVitals() {
    // LCP - Largest Contentful Paint
    this.observeLCP()
    // FID - First Input Delay
    this.observeFID()
    // FCP - First Contentful Paint
    this.observeFCP()
  }

  observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        const lcp = Math.round(lastEntry.renderTime || lastEntry.loadTime)
        
        this.logMetric('LCP', lcp, lcp > 2500 ? '需要优化' : '良好')
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      // LCP observation failed
    }
  }

  observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = Math.round(entry.processingStart - entry.startTime)
          this.logMetric('FID', fid, fid > 100 ? '需要优化' : '良好')
        }
      })
      observer.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      // FID observation failed
    }
  }

  observeFCP() {
    try {
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
      if (fcpEntry) {
        const fcp = Math.round(fcpEntry.startTime)
        this.logMetric('FCP', fcp, fcp > 1800 ? '需要优化' : '良好')
      }
    } catch (e) {
      // FCP observation failed
    }
  }

  /**
   * 标记时间点
   */
  mark(name) {
    performance.mark(name)
    this.marks.set(name, performance.now())
  }

  /**
   * 测量两个标记点之间的时间
   */
  measure(name, startMark, endMark) {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name)[0]
      const duration = Math.round(measure.duration)
      
      this.measures.push({ name, duration, timestamp: Date.now() })
      
      if (this.enableConsole) {
        console.log(`⏱️ ${name}: ${duration}ms`)
      }
      
      return duration
    } catch (e) {
      console.error('测量失败:', e)
      return 0
    }
  }

  /**
   * 测量函数执行时间
   */
  async measureFunction(name, fn) {
    const startMark = `${name}-start`
    const endMark = `${name}-end`
    
    this.mark(startMark)
    try {
      const result = await fn()
      this.mark(endMark)
      this.measure(name, startMark, endMark)
      return result
    } catch (error) {
      this.mark(endMark)
      this.measure(name, startMark, endMark)
      throw error
    }
  }

  /**
   * 记录指标
   */
  logMetric(name, value, status = 'info') {
    if (this.enableConsole) {
      const emoji = status === '良好' ? '✅' : '⚠️'
      console.log(`${emoji} ${name}: ${value}ms - ${status}`)
    }
  }

  /**
   * 记录警告
   */
  logWarning(type, data) {
    if (this.enableConsole) {
      console.warn(`⚠️ ${type}:`, data)
    }
  }

  /**
   * 获取性能报告
   */
  getReport() {
    return {
      marks: Array.from(this.marks.entries()),
      measures: this.measures,
      navigation: performance.getEntriesByType('navigation')[0],
      memory: performance.memory ? {
        usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
        totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
        jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
      } : null
    }
  }

  /**
   * 清除所有标记和测量
   */
  clear() {
    this.marks.clear()
    this.measures = []
    performance.clearMarks()
    performance.clearMeasures()
  }
}

// 创建单例
const performanceMonitor = new PerformanceMonitor()

// 开发环境下暴露到全局
if (import.meta.env.DEV) {
  window.__performance = performanceMonitor
}

export default performanceMonitor

