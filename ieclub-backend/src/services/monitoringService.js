// ieclub-backend/src/services/monitoringService.js
// 性能监控服务

const os = require('os');
const { PrismaClient } = require('@prisma/client');
const redis = require('../utils/redis');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: new Map(), // 请求统计
      errors: new Map(), // 错误统计
      performance: [] // 性能数据
    };
    
    // 定期清理旧数据
    setInterval(() => this.cleanupOldMetrics(), 60 * 60 * 1000); // 每小时清理一次
  }

  /**
   * 记录请求
   */
  recordRequest(method, path, duration, statusCode) {
    const key = `${method}:${path}`;
    const now = Date.now();

    if (!this.metrics.requests.has(key)) {
      this.metrics.requests.set(key, {
        count: 0,
        totalDuration: 0,
        minDuration: duration,
        maxDuration: duration,
        errors: 0,
        lastAccess: now
      });
    }

    const metric = this.metrics.requests.get(key);
    metric.count++;
    metric.totalDuration += duration;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.lastAccess = now;

    if (statusCode >= 400) {
      metric.errors++;
    }

    // 慢请求告警（超过1秒）
    if (duration > 1000) {
      logger.warn(`慢请求检测: ${method} ${path}`, {
        duration: `${duration}ms`,
        statusCode
      });
    }
  }

  /**
   * 记录错误
   */
  recordError(error, context = {}) {
    const key = error.message || 'Unknown Error';
    const now = Date.now();

    if (!this.metrics.errors.has(key)) {
      this.metrics.errors.set(key, {
        count: 0,
        lastOccurred: now,
        contexts: []
      });
    }

    const metric = this.metrics.errors.get(key);
    metric.count++;
    metric.lastOccurred = now;
    metric.contexts.push({
      ...context,
      timestamp: now
    });

    // 只保留最近10次上下文
    if (metric.contexts.length > 10) {
      metric.contexts.shift();
    }

    // 高频错误告警（1分钟内超过10次）
    const recentErrors = metric.contexts.filter(c => now - c.timestamp < 60000);
    if (recentErrors.length > 10) {
      logger.error(`高频错误告警: ${key}`, {
        count: recentErrors.length,
        lastMinute: true
      });
    }
  }

  /**
   * 获取系统指标
   */
  async getSystemMetrics() {
    try {
      // 系统信息
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      // CPU使用率（简单估算）
      const cpuUsage = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total);
      }, 0) / cpus.length;

      // 内存使用率
      const memUsage = (usedMem / totalMem) * 100;

      // Node.js进程信息
      const processMemUsage = process.memoryUsage();
      const uptime = process.uptime();

      // 数据库连接状态
      let dbConnections = null;
      try {
        const result = await prisma.$queryRaw`SHOW STATUS LIKE 'Threads_connected'`;
        dbConnections = result[0] ? parseInt(result[0].Value) : null;
      } catch (error) {
        logger.error('获取数据库连接数失败:', error);
      }

      // Redis状态
      let redisInfo = null;
      try {
        const info = await redis.info('stats');
        redisInfo = {
          connected: true,
          totalCommands: this.parseRedisInfo(info, 'total_commands_processed'),
          connectedClients: this.parseRedisInfo(info, 'connected_clients')
        };
      } catch (error) {
        redisInfo = { connected: false };
      }

      return {
        system: {
          cpuCount: cpus.length,
          cpuUsage: (cpuUsage * 100).toFixed(2),
          totalMemory: totalMem,
          freeMemory: freeMem,
          usedMemory: usedMem,
          memoryUsage: memUsage.toFixed(2),
          platform: os.platform(),
          arch: os.arch(),
          uptime: os.uptime()
        },
        process: {
          pid: process.pid,
          uptime: uptime.toFixed(0),
          memory: {
            rss: processMemUsage.rss,
            heapTotal: processMemUsage.heapTotal,
            heapUsed: processMemUsage.heapUsed,
            external: processMemUsage.external
          },
          cpu: process.cpuUsage()
        },
        database: {
          connections: dbConnections,
          type: 'MySQL'
        },
        redis: redisInfo,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('获取系统指标失败:', error);
      throw error;
    }
  }

  /**
   * 解析Redis INFO输出
   */
  parseRedisInfo(info, key) {
    const match = info.match(new RegExp(`${key}:(.+)`));
    return match ? match[1].trim() : null;
  }

  /**
   * 获取API指标
   */
  getApiMetrics() {
    const endpoints = [];
    
    for (const [key, metric] of this.metrics.requests) {
      const [method, path] = key.split(':');
      const avgDuration = metric.totalDuration / metric.count;
      const errorRate = (metric.errors / metric.count) * 100;

      endpoints.push({
        method,
        path,
        count: metric.count,
        avgDuration: avgDuration.toFixed(2),
        minDuration: metric.minDuration,
        maxDuration: metric.maxDuration,
        errors: metric.errors,
        errorRate: errorRate.toFixed(2),
        lastAccess: new Date(metric.lastAccess)
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
    const errors = [];

    for (const [message, metric] of this.metrics.errors) {
      errors.push({
        message,
        count: metric.count,
        lastOccurred: new Date(metric.lastOccurred),
        recentContexts: metric.contexts.slice(-5) // 最近5次上下文
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
   * 获取慢查询列表
   */
  async getSlowQueries() {
    try {
      // 从MySQL慢查询日志获取（需要配置）
      const slowQueries = await prisma.$queryRaw`
        SELECT 
          sql_text,
          start_time,
          query_time,
          lock_time,
          rows_sent,
          rows_examined
        FROM mysql.slow_log
        ORDER BY start_time DESC
        LIMIT 20
      `.catch(() => []);

      return slowQueries;
    } catch (error) {
      logger.warn('获取慢查询失败（可能未启用慢查询日志）:', error.message);
      return [];
    }
  }

  /**
   * 获取数据库性能指标
   */
  async getDatabaseMetrics() {
    try {
      // 表大小统计
      const tableSizes = await prisma.$queryRaw`
        SELECT 
          table_name,
          ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
          table_rows
        FROM information_schema.TABLES
        WHERE table_schema = DATABASE()
        ORDER BY (data_length + index_length) DESC
        LIMIT 20
      `;

      // 索引使用情况
      const indexUsage = await prisma.$queryRaw`
        SELECT 
          table_name,
          index_name,
          cardinality,
          seq_in_index
        FROM information_schema.STATISTICS
        WHERE table_schema = DATABASE()
        ORDER BY cardinality DESC
        LIMIT 20
      `;

      return {
        tableSizes,
        indexUsage
      };
    } catch (error) {
      logger.error('获取数据库指标失败:', error);
      return {
        tableSizes: [],
        indexUsage: []
      };
    }
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
      const start = Date.now();
      await redis.ping();
      checks.redis.status = 'healthy';
      checks.redis.latency = Date.now() - start;
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
   * 清理旧指标
   */
  cleanupOldMetrics() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // 清理1小时前的请求统计
    for (const [key, metric] of this.metrics.requests) {
      if (now - metric.lastAccess > oneHour) {
        this.metrics.requests.delete(key);
      }
    }

    // 清理1小时前的错误统计
    for (const [key, metric] of this.metrics.errors) {
      if (now - metric.lastOccurred > oneHour) {
        this.metrics.errors.delete(key);
      }
    }

    logger.info('清理旧监控指标完成', {
      remainingRequests: this.metrics.requests.size,
      remainingErrors: this.metrics.errors.size
    });
  }

  /**
   * 导出所有指标
   */
  async exportMetrics() {
    try {
      const [system, api, errors, slowQueries, dbMetrics, health] = await Promise.all([
        this.getSystemMetrics(),
        Promise.resolve(this.getApiMetrics()),
        Promise.resolve(this.getErrorMetrics()),
        this.getSlowQueries(),
        this.getDatabaseMetrics(),
        this.healthCheck()
      ]);

      return {
        system,
        api,
        errors,
        slowQueries,
        database: dbMetrics,
        health,
        exportedAt: new Date()
      };
    } catch (error) {
      logger.error('导出指标失败:', error);
      throw error;
    }
  }
}

// 导出单例
module.exports = new MonitoringService();

