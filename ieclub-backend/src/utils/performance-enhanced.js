// ieclub-backend/src/utils/performance-enhanced.js
// 增强的性能监控工具

const os = require('os');
const { getRedis } = require('./redis-enhanced');
const logger = require('./logger');

/**
 * 性能指标收集器
 */
class PerformanceCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        byStatus: {}
      },
      responseTime: {
        min: Infinity,
        max: 0,
        sum: 0,
        count: 0,
        p50: [],
        p95: [],
        p99: []
      },
      system: {
        cpu: 0,
        memory: 0,
        load: []
      }
    };
    this.startTime = Date.now();
  }

  /**
   * 记录请求
   * @param {Object} data - 请求数据
   */
  recordRequest(data) {
    const { statusCode, duration } = data;

    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.error++;
    }

    // 按状态码统计
    if (!this.metrics.requests.byStatus[statusCode]) {
      this.metrics.requests.byStatus[statusCode] = 0;
    }
    this.metrics.requests.byStatus[statusCode]++;

    // 记录响应时间
    if (duration !== undefined) {
      this.recordResponseTime(duration);
    }
  }

  /**
   * 记录响应时间
   * @param {number} duration - 响应时间（毫秒）
   */
  recordResponseTime(duration) {
    const metrics = this.metrics.responseTime;

    metrics.min = Math.min(metrics.min, duration);
    metrics.max = Math.max(metrics.max, duration);
    metrics.sum += duration;
    metrics.count++;

    // 计算百分位数
    metrics.p50.push(duration);
    metrics.p95.push(duration);
    metrics.p99.push(duration);

    // 保持最近1000个样本
    if (metrics.p50.length > 1000) {
      metrics.p50.shift();
      metrics.p95.shift();
      metrics.p99.shift();
    }
  }

  /**
   * 更新系统指标
   */
  updateSystemMetrics() {
    const cpus = os.cpus();
    const totalIdle = cpus.reduce((acc, cpu) => {
      const cpuTimes = Object.values(cpu.times);
      return acc + cpuTimes[cpuTimes.length - 1];
    }, 0);
    const totalTick = cpus.reduce((acc, cpu) => {
      const cpuTimes = Object.values(cpu.times);
      return acc + cpuTimes.reduce((sum, time) => sum + time, 0);
    }, 0);
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    this.metrics.system.cpu = usage;
    this.metrics.system.memory = (1 - os.freemem() / os.totalmem()) * 100;
    this.metrics.system.load = os.loadavg();
  }

  /**
   * 获取性能报告
   * @returns {Object} 性能报告
   */
  getReport() {
    const metrics = this.metrics.responseTime;
    const uptime = Date.now() - this.startTime;

    // 计算平均响应时间
    const avgResponseTime = metrics.count > 0
      ? metrics.sum / metrics.count
      : 0;

    // 计算百分位数
    const sorted = [...metrics.p50].sort((a, b) => a - b);
    const p50 = sorted.length > 0
      ? sorted[Math.floor(sorted.length * 0.5)]
      : 0;
    const p95 = sorted.length > 0
      ? sorted[Math.floor(sorted.length * 0.95)]
      : 0;
    const p99 = sorted.length > 0
      ? sorted[Math.floor(sorted.length * 0.99)]
      : 0;

    // 计算成功率
    const successRate = this.metrics.requests.total > 0
      ? (this.metrics.requests.success / this.metrics.requests.total) * 100
      : 0;

    // 计算QPS
    const qps = uptime > 0
      ? (this.metrics.requests.total / uptime) * 1000
      : 0;

    this.updateSystemMetrics();

    return {
      uptime: Math.floor(uptime / 1000), // 秒
      requests: {
        total: this.metrics.requests.total,
        success: this.metrics.requests.success,
        error: this.metrics.requests.error,
        successRate: successRate.toFixed(2) + '%',
        qps: qps.toFixed(2),
        byStatus: this.metrics.requests.byStatus
      },
      responseTime: {
        min: metrics.min === Infinity ? 0 : metrics.min,
        max: metrics.max,
        avg: avgResponseTime.toFixed(2),
        p50,
        p95,
        p99
      },
      system: {
        cpu: this.metrics.system.cpu.toFixed(2) + '%',
        memory: this.metrics.system.memory.toFixed(2) + '%',
        load: this.metrics.system.load.map(l => l.toFixed(2))
      }
    };
  }

  /**
   * 保存指标到Redis
   */
  async saveToRedis() {
    try {
      const redis = getRedis();
      if (!redis) return;

      const report = this.getReport();
      const key = `performance:metrics:${Date.now()}`;
      
      await redis.setex(key, 3600, JSON.stringify(report)); // 保存1小时
      
      logger.debug('性能指标已保存到Redis', { key });
    } catch (error) {
      logger.error('保存性能指标失败', { error: error.message });
    }
  }

  /**
   * 重置指标
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        byStatus: {}
      },
      responseTime: {
        min: Infinity,
        max: 0,
        sum: 0,
        count: 0,
        p50: [],
        p95: [],
        p99: []
      },
      system: {
        cpu: 0,
        memory: 0,
        load: []
      }
    };
    this.startTime = Date.now();
  }
}

// 创建全局实例
const performanceCollector = new PerformanceCollector();

// 定期保存指标
setInterval(() => {
  performanceCollector.saveToRedis();
}, 60000); // 每分钟保存一次

module.exports = performanceCollector;

