// ieclub-backend/src/utils/performanceMonitor.js
// 性能监控工具

const os = require('os');
const logger = require('./logger');
const { getRedis } = require('./redis-enhanced');
const alertSystem = require('./alertSystem');

/**
 * 性能监控配置
 */
const MONITOR_CONFIG = {
  // 采集间隔（毫秒）
  collectInterval: 60000, // 1分钟
  
  // 保留时长（秒）
  retentionPeriod: 86400, // 24小时
  
  // Redis 键前缀
  keyPrefix: 'perf_monitor',
  
  // 告警阈值
  thresholds: {
    cpu: 80,           // CPU 使用率 > 80%
    memory: 85,        // 内存使用率 > 85%
    responseTime: 2000, // 响应时间 > 2秒
    errorRate: 5       // 错误率 > 5%
  }
};

/**
 * 性能监控器类
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      slowRequests: 0
    };
    
    this.isCollecting = false;
    this.collectTimer = null;
  }
  
  /**
   * 启动监控
   */
  start() {
    if (this.isCollecting) {
      logger.warn('性能监控已在运行');
      return;
    }
    
    this.isCollecting = true;
    logger.info('性能监控已启动', {
      interval: `${MONITOR_CONFIG.collectInterval}ms`,
      retention: `${MONITOR_CONFIG.retentionPeriod}s`
    });
    
    // 定期采集指标
    this.collectTimer = setInterval(() => {
      this.collectMetrics();
    }, MONITOR_CONFIG.collectInterval);
    
    // 立即采集一次
    this.collectMetrics();
  }
  
  /**
   * 停止监控
   */
  stop() {
    if (!this.isCollecting) {
      return;
    }
    
    this.isCollecting = false;
    
    if (this.collectTimer) {
      clearInterval(this.collectTimer);
      this.collectTimer = null;
    }
    
    logger.info('性能监控已停止');
  }
  
  /**
   * 采集系统指标
   */
  async collectMetrics() {
    try {
      const metrics = {
        timestamp: Date.now(),
        system: this.getSystemMetrics(),
        process: this.getProcessMetrics(),
        application: this.getApplicationMetrics()
      };
      
      // 保存到 Redis
      await this.saveMetrics(metrics);
      
      // 检查告警
      this.checkAlerts(metrics);
      
      // 重置应用指标
      this.resetApplicationMetrics();
      
      logger.debug('性能指标已采集', metrics);
    } catch (error) {
      logger.error('采集性能指标失败', error);
    }
  }
  
  /**
   * 获取系统指标
   */
  getSystemMetrics() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // 计算 CPU 使用率
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const cpuUsage = 100 - Math.round(100 * totalIdle / totalTick);
    
    return {
      cpuUsage,
      cpuCount: cpus.length,
      memoryUsage: Math.round((usedMem / totalMem) * 100),
      memoryUsedMB: Math.round(usedMem / 1024 / 1024),
      memoryTotalMB: Math.round(totalMem / 1024 / 1024),
      loadAverage: os.loadavg(),
      uptime: os.uptime()
    };
  }
  
  /**
   * 获取进程指标
   */
  getProcessMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
      externalMB: Math.round(memUsage.external / 1024 / 1024),
      cpuUser: cpuUsage.user,
      cpuSystem: cpuUsage.system,
      uptime: Math.round(process.uptime())
    };
  }
  
  /**
   * 获取应用指标
   */
  getApplicationMetrics() {
    const { requests, errors, responseTimes, slowRequests } = this.metrics;
    
    // 计算平均响应时间
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    
    // 计算错误率
    const errorRate = requests > 0
      ? Math.round((errors / requests) * 100 * 100) / 100
      : 0;
    
    // 计算 P95 响应时间
    const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
    
    // 计算 P99 响应时间
    const p99ResponseTime = this.calculatePercentile(responseTimes, 99);
    
    return {
      requests,
      errors,
      errorRate,
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      slowRequests,
      slowRequestRate: requests > 0
        ? Math.round((slowRequests / requests) * 100 * 100) / 100
        : 0
    };
  }
  
  /**
   * 计算百分位数
   */
  calculatePercentile(arr, percentile) {
    if (arr.length === 0) return 0;
    
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
  
  /**
   * 获取当前指标（不保存到 Redis）
   */
  async getCurrentMetrics() {
    return {
      timestamp: Date.now(),
      system: this.getSystemMetrics(),
      process: this.getProcessMetrics(),
      application: this.getApplicationMetrics()
    };
  }
  
  /**
   * 保存指标到 Redis
   */
  async saveMetrics(metrics) {
    try {
      const redis = getRedis();
      if (!redis) return;
      
      const key = `${MONITOR_CONFIG.keyPrefix}:${Date.now()}`;
      
      // 保存指标
      await redis.setex(
        key,
        MONITOR_CONFIG.retentionPeriod,
        JSON.stringify(metrics)
      );
      
      // 添加到时间序列
      await redis.zadd(
        `${MONITOR_CONFIG.keyPrefix}:timeline`,
        metrics.timestamp,
        key
      );
      
      // 清理过期数据
      const expireTime = Date.now() - (MONITOR_CONFIG.retentionPeriod * 1000);
      await redis.zremrangebyscore(
        `${MONITOR_CONFIG.keyPrefix}:timeline`,
        '-inf',
        expireTime
      );
    } catch (error) {
      logger.error('保存性能指标失败', error);
    }
  }
  
  /**
   * 检查告警
   */
  checkAlerts(metrics) {
    const { thresholds } = MONITOR_CONFIG;
    const alerts = [];
    
    // CPU 告警
    if (metrics.system.cpuUsage > thresholds.cpu) {
      alerts.push({
        type: 'cpu',
        message: `CPU 使用率过高: ${metrics.system.cpuUsage}%`,
        value: metrics.system.cpuUsage,
        threshold: thresholds.cpu
      });
    }
    
    // 内存告警
    if (metrics.system.memoryUsage > thresholds.memory) {
      alerts.push({
        type: 'memory',
        message: `内存使用率过高: ${metrics.system.memoryUsage}%`,
        value: metrics.system.memoryUsage,
        threshold: thresholds.memory
      });
    }
    
    // 响应时间告警
    if (metrics.application.avgResponseTime > thresholds.responseTime) {
      alerts.push({
        type: 'responseTime',
        message: `平均响应时间过长: ${metrics.application.avgResponseTime}ms`,
        value: metrics.application.avgResponseTime,
        threshold: thresholds.responseTime
      });
    }
    
    // 错误率告警
    if (metrics.application.errorRate > thresholds.errorRate) {
      alerts.push({
        type: 'errorRate',
        message: `错误率过高: ${metrics.application.errorRate}%`,
        value: metrics.application.errorRate,
        threshold: thresholds.errorRate
      });
    }
    
    // 记录告警并发送通知
    if (alerts.length > 0) {
      logger.warn('性能告警', { alerts, metrics });
      
      // 使用告警系统发送通知
      this.sendAlerts(alerts, metrics);
    }
  }
  
  /**
   * 发送告警通知
   */
  async sendAlerts(alerts, metrics) {
    try {
      // 使用告警系统检查性能指标并发送通知
      await alertSystem.checkPerformanceMetrics(metrics);
      logger.info('发送性能告警通知', { count: alerts.length });
    } catch (error) {
      logger.error('发送告警失败', error);
    }
  }
  
  /**
   * 重置应用指标
   */
  resetApplicationMetrics() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      slowRequests: 0
    };
  }
  
  /**
   * 记录请求（增强版）
   */
  recordRequest(method, path, duration, statusCode) {
    // 基础计数
    this.metrics.requests++;
    
    const isError = statusCode >= 400;
    if (isError) {
      this.metrics.errors++;
    }
    
    if (duration) {
      this.metrics.responseTimes.push(duration);
      
      if (duration > MONITOR_CONFIG.thresholds.responseTime) {
        this.metrics.slowRequests++;
      }
    }
    
    // 详细端点统计
    if (method && path) {
      const key = `${method}:${path}`;
      if (!this.endpointStats) {
        this.endpointStats = new Map();
      }
      
      if (!this.endpointStats.has(key)) {
        this.endpointStats.set(key, {
          count: 0,
          totalDuration: 0,
          minDuration: duration,
          maxDuration: duration,
          errors: 0,
          lastAccess: Date.now()
        });
      }
      
      const stat = this.endpointStats.get(key);
      stat.count++;
      stat.totalDuration += duration;
      stat.minDuration = Math.min(stat.minDuration, duration);
      stat.maxDuration = Math.max(stat.maxDuration, duration);
      stat.lastAccess = Date.now();
      
      if (isError) {
        stat.errors++;
      }
    }
  }
  
  /**
   * 记录错误
   */
  recordError(error, context = {}) {
    if (!this.errorStats) {
      this.errorStats = new Map();
    }
    
    const key = error.message || 'Unknown Error';
    const now = Date.now();
    
    if (!this.errorStats.has(key)) {
      this.errorStats.set(key, {
        count: 0,
        lastOccurred: now,
        contexts: []
      });
    }
    
    const stat = this.errorStats.get(key);
    stat.count++;
    stat.lastOccurred = now;
    stat.contexts.push({
      ...context,
      timestamp: now
    });
    
    // 只保留最近10次上下文
    if (stat.contexts.length > 10) {
      stat.contexts.shift();
    }
    
    // 高频错误告警（1分钟内超过10次）
    const recentErrors = stat.contexts.filter(c => now - c.timestamp < 60000);
    if (recentErrors.length > 10) {
      logger.error(`高频错误告警: ${key}`, {
        count: recentErrors.length,
        lastMinute: true
      });
    }
  }
  
  /**
   * 获取API指标
   */
  getApiMetrics() {
    if (!this.endpointStats || this.endpointStats.size === 0) {
      return {
        totalEndpoints: 0,
        totalRequests: 0,
        totalErrors: 0,
        endpoints: []
      };
    }
    
    const endpoints = [];
    for (const [key, stat] of this.endpointStats) {
      const [method, path] = key.split(':');
      const avgDuration = stat.totalDuration / stat.count;
      const errorRate = (stat.errors / stat.count) * 100;
      
      endpoints.push({
        method,
        path,
        count: stat.count,
        avgDuration: avgDuration.toFixed(2),
        minDuration: stat.minDuration,
        maxDuration: stat.maxDuration,
        errors: stat.errors,
        errorRate: errorRate.toFixed(2),
        lastAccess: new Date(stat.lastAccess)
      });
    }
    
    // 按请求数排序
    endpoints.sort((a, b) => b.count - a.count);
    
    return {
      totalEndpoints: endpoints.length,
      totalRequests: endpoints.reduce((sum, e) => sum + e.count, 0),
      totalErrors: endpoints.reduce((sum, e) => sum + e.errors, 0),
      endpoints: endpoints.slice(0, 50) // 只返回前50个
    };
  }
  
  /**
   * 获取错误统计
   */
  getErrorMetrics() {
    if (!this.errorStats || this.errorStats.size === 0) {
      return {
        totalErrors: 0,
        totalOccurrences: 0,
        errors: []
      };
    }
    
    const errors = [];
    for (const [message, stat] of this.errorStats) {
      errors.push({
        message,
        count: stat.count,
        lastOccurred: new Date(stat.lastOccurred),
        recentContexts: stat.contexts.slice(-5) // 最近5次上下文
      });
    }
    
    // 按错误次数排序
    errors.sort((a, b) => b.count - a.count);
    
    return {
      totalErrors: errors.length,
      totalOccurrences: errors.reduce((sum, e) => sum + e.count, 0),
      errors: errors.slice(0, 20) // 只返回前20个
    };
  }
  
  /**
   * 健康检查
   */
  async healthCheck() {
    const checks = {
      server: { status: 'healthy', latency: 0 },
      database: { status: 'unknown', latency: 0 },
      redis: { status: 'unknown', latency: 0 }
    };
    
    // 数据库检查
    try {
      const prisma = require('../config/database');
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      checks.database.status = 'healthy';
      checks.database.latency = Date.now() - start;
    } catch (error) {
      checks.database.status = 'unhealthy';
      checks.database.error = error.message;
    }
    
    // Redis检查
    try {
      const redis = getRedis();
      if (redis) {
        const start = Date.now();
        await redis.ping();
        checks.redis.status = 'healthy';
        checks.redis.latency = Date.now() - start;
      }
    } catch (error) {
      checks.redis.status = 'unhealthy';
      checks.redis.error = error.message;
    }
    
    // 整体健康状态
    const allHealthy = Object.values(checks).every(c => c.status === 'healthy');
    checks.overall = allHealthy ? 'healthy' : 'degraded';
    
    return checks;
  }
  
  /**
   * 获取历史指标
   */
  async getHistoricalMetrics(startTime, endTime) {
    try {
      const redis = getRedis();
      if (!redis) return [];
      
      // 获取时间范围内的键
      const keys = await redis.zrangebyscore(
        `${MONITOR_CONFIG.keyPrefix}:timeline`,
        startTime || '-inf',
        endTime || '+inf'
      );
      
      // 获取指标数据
      const metrics = [];
      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          metrics.push(JSON.parse(data));
        }
      }
      
      return metrics;
    } catch (error) {
      logger.error('获取历史指标失败', error);
      return [];
    }
  }
  
  /**
   * 获取实时指标
   */
  getRealTimeMetrics() {
    return {
      system: this.getSystemMetrics(),
      process: this.getProcessMetrics(),
      application: this.getApplicationMetrics()
    };
  }
  
  /**
   * 获取性能报告
   */
  async getPerformanceReport(hours = 24) {
    const endTime = Date.now();
    const startTime = endTime - (hours * 60 * 60 * 1000);
    
    const metrics = await this.getHistoricalMetrics(startTime, endTime);
    
    if (metrics.length === 0) {
      return {
        period: `${hours}小时`,
        message: '暂无数据'
      };
    }
    
    // 计算统计数据
    const cpuUsages = metrics.map(m => m.system.cpuUsage);
    const memoryUsages = metrics.map(m => m.system.memoryUsage);
    const responseTimes = metrics.map(m => m.application.avgResponseTime);
    const errorRates = metrics.map(m => m.application.errorRate);
    
    return {
      period: `${hours}小时`,
      dataPoints: metrics.length,
      cpu: {
        avg: this.average(cpuUsages),
        max: Math.max(...cpuUsages),
        min: Math.min(...cpuUsages)
      },
      memory: {
        avg: this.average(memoryUsages),
        max: Math.max(...memoryUsages),
        min: Math.min(...memoryUsages)
      },
      responseTime: {
        avg: this.average(responseTimes),
        max: Math.max(...responseTimes),
        min: Math.min(...responseTimes)
      },
      errorRate: {
        avg: this.average(errorRates),
        max: Math.max(...errorRates),
        min: Math.min(...errorRates)
      }
    };
  }
  
  /**
   * 计算平均值
   */
  average(arr) {
    if (arr.length === 0) return 0;
    return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
  }
}

// 创建单例
const monitor = new PerformanceMonitor();

/**
 * 性能监控中间件
 */
function performanceMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // 监听响应结束
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const isError = res.statusCode >= 400;
      
      monitor.recordRequest(duration, isError);
    });
    
    next();
  };
}

module.exports = {
  monitor,
  performanceMiddleware,
  PerformanceMonitor,
  MONITOR_CONFIG
};

