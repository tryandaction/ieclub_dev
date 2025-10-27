/**
 * 性能监控工具
 * 监控页面加载、资源加载、用户操作等性能指标
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.enabled = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') || false;
  }

  /**
   * 初始化性能监控
   */
  init() {
    if (!this.enabled) return;

    // 监听页面加载完成
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        this.recordPageLoad();
      });

      // 监听 First Contentful Paint (FCP)
      this.observePaint();

      // 监听 Largest Contentful Paint (LCP)
      this.observeLCP();

      // 监听 First Input Delay (FID)
      this.observeFID();

      // 监听 Cumulative Layout Shift (CLS)
      this.observeCLS();
    }
  }

  /**
   * 记录页面加载性能
   */
  recordPageLoad() {
    if (!window.performance || !window.performance.timing) return;

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    this.metrics.pageLoad = {
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
      // 页面类型（0=点击链接，1=刷新，2=前进后退）
      navigationType: navigation.type
    };

    this.report('pageLoad', this.metrics.pageLoad);
  }

  /**
   * 监听 First Paint & First Contentful Paint
   */
  observePaint() {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = Math.round(entry.startTime);
            this.report('FCP', this.metrics.fcp);
          }
        }
      });

      observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('Paint observer error:', e);
    }
  }

  /**
   * 监听 Largest Contentful Paint
   */
  observeLCP() {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.metrics.lcp = Math.round(lastEntry.startTime);
        this.report('LCP', this.metrics.lcp);
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observer error:', e);
    }
  }

  /**
   * 监听 First Input Delay
   */
  observeFID() {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.fid = Math.round(entry.processingStart - entry.startTime);
          this.report('FID', this.metrics.fid);
        }
      });

      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID observer error:', e);
    }
  }

  /**
   * 监听 Cumulative Layout Shift
   */
  observeCLS() {
    if (!window.PerformanceObserver) return;

    try {
      let clsScore = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }
        
        this.metrics.cls = Math.round(clsScore * 1000) / 1000;
        this.report('CLS', this.metrics.cls);
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observer error:', e);
    }
  }

  /**
   * 记录自定义性能指标
   */
  mark(name) {
    if (!this.enabled || !window.performance) return;
    window.performance.mark(name);
  }

  /**
   * 测量两个标记之间的时间
   */
  measure(name, startMark, endMark) {
    if (!this.enabled || !window.performance) return;
    
    try {
      window.performance.measure(name, startMark, endMark);
      const measure = window.performance.getEntriesByName(name)[0];
      this.report('custom', { name, duration: Math.round(measure.duration) });
    } catch (e) {
      console.warn('Measure error:', e);
    }
  }

  /**
   * 上报性能数据
   */
  report(type, data) {
    // 这里可以对接实际的监控平台（如百度统计、Google Analytics 等）
    console.log(`[Performance] ${type}:`, data);

    // 示例：发送到后端
    if (this.enabled && typeof window !== 'undefined') {
      // 使用 sendBeacon 确保数据在页面卸载时也能发送
      const payload = JSON.stringify({
        type,
        data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });

      // 暂时注释掉，避免影响当前开发
      // navigator.sendBeacon?.('/api/metrics', payload);
    }
  }

  /**
   * 获取所有指标
   */
  getMetrics() {
    return this.metrics;
  }
}

// 导出单例
export const performanceMonitor = new PerformanceMonitor();

// 自动初始化
if (typeof window !== 'undefined') {
  performanceMonitor.init();
}

export default performanceMonitor;


