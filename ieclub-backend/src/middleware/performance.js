// src/middleware/performance.js
// API性能监控中间件

const logger = require('../utils/logger');
const { monitor } = require('../utils/performanceMonitor');

/**
 * API性能监控中间件
 * 记录每个请求的响应时间和资源使用情况
 */
const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // 记录原始的 res.json 方法
  const originalJson = res.json.bind(res);

  // 重写 res.json 以在响应时记录性能指标
  res.json = function (data) {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    
    // 计算内存变化
    const memoryDelta = {
      heapUsed: Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024 * 100) / 100,
      external: Math.round((endMemory.external - startMemory.external) / 1024 / 1024 * 100) / 100
    };

    // 性能日志
    const perfLog = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      memoryDelta: memoryDelta.heapUsed > 0 ? `+${memoryDelta.heapUsed}MB` : `${memoryDelta.heapUsed}MB`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    // 慢查询警告 (>1000ms)
    if (duration > 1000) {
      logger.warn('慢API检测', perfLog);
    } else if (duration > 500) {
      logger.info('API性能', perfLog);
    }

    // 高内存使用警告 (>50MB)
    if (Math.abs(memoryDelta.heapUsed) > 50) {
      logger.warn('高内存使用', perfLog);
    }

    // 设置性能响应头
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    return originalJson(data);
  };

  next();
};

/**
 * 性能统计收集器
 */
class PerformanceCollector {
  constructor() {
    this.stats = {
      requests: 0,
      totalDuration: 0,
      slowRequests: 0,
      endpoints: new Map()
    };
  }

  /**
   * 记录请求
   */
  record(req, duration) {
    this.stats.requests++;
    this.stats.totalDuration += duration;
    
    if (duration > 1000) {
      this.stats.slowRequests++;
    }

    // 记录各端点统计
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    if (!this.stats.endpoints.has(endpoint)) {
      this.stats.endpoints.set(endpoint, {
        count: 0,
        totalDuration: 0,
        maxDuration: 0,
        minDuration: Infinity
      });
    }

    const endpointStats = this.stats.endpoints.get(endpoint);
    endpointStats.count++;
    endpointStats.totalDuration += duration;
    endpointStats.maxDuration = Math.max(endpointStats.maxDuration, duration);
    endpointStats.minDuration = Math.min(endpointStats.minDuration, duration);
  }

  /**
   * 获取统计报告
   */
  getReport() {
    const avgDuration = this.stats.requests > 0 
      ? Math.round(this.stats.totalDuration / this.stats.requests) 
      : 0;

    const endpoints = Array.from(this.stats.endpoints.entries()).map(([path, stats]) => ({
      path,
      count: stats.count,
      avgDuration: Math.round(stats.totalDuration / stats.count),
      maxDuration: stats.maxDuration,
      minDuration: stats.minDuration === Infinity ? 0 : stats.minDuration
    }));

    // 按请求次数排序
    endpoints.sort((a, b) => b.count - a.count);

    return {
      totalRequests: this.stats.requests,
      avgResponseTime: `${avgDuration}ms`,
      slowRequests: this.stats.slowRequests,
      slowRequestsPercentage: this.stats.requests > 0 
        ? `${(this.stats.slowRequests / this.stats.requests * 100).toFixed(2)}%`
        : '0%',
      topEndpoints: endpoints.slice(0, 10)
    };
  }

  /**
   * 重置统计
   */
  reset() {
    this.stats = {
      requests: 0,
      totalDuration: 0,
      slowRequests: 0,
      endpoints: new Map()
    };
  }
}

// 创建全局收集器实例
const collector = new PerformanceCollector();

/**
 * 增强的性能监控中间件（带统计）
 */
const performanceMonitorWithStats = (req, res, next) => {
  const startTime = Date.now();

  // 记录原始的 res.json 方法
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  const finishRequest = function(_data) {
    const duration = Date.now() - startTime;
    collector.record(req, duration);
    
    // 记录到监控服务
    try {
      monitor.recordRequest(req.method, req.path, duration, res.statusCode);
    } catch (error) {
      // 忽略监控服务错误
    }
    
    // 慢查询警告
    if (duration > 1000) {
      logger.warn(`慢API: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }

    res.setHeader('X-Response-Time', `${duration}ms`);
  };

  res.json = function(data) {
    finishRequest();
    return originalJson(data);
  };

  res.send = function(data) {
    finishRequest();
    return originalSend(data);
  };

  next();
};

/**
 * 获取性能报告的路由处理器
 */
const getPerformanceReport = (req, res) => {
  const report = collector.getReport();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    success: true,
    data: {
      ...report,
      memory: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
      },
      uptime: `${Math.round(process.uptime())}s`,
      nodeVersion: process.version
    }
  });
};

module.exports = {
  performanceMonitor,
  performanceMonitorWithStats,
  collector,
  getPerformanceReport
};

