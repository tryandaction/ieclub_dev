// ieclub-backend/src/routes/metrics.js
// Prometheus 指标导出端点

const express = require('express');
const router = express.Router();
const { monitor } = require('../utils/performanceMonitor');
const prisma = require('../config/database');

/**
 * Prometheus 指标格式导出
 * GET /api/metrics
 */
router.get('/', async (req, res) => {
  try {
    const metrics = [];
    
    // ========================================
    // 系统指标
    // ========================================
    const currentMetrics = await monitor.getCurrentMetrics();
    
    // CPU 使用率
    metrics.push(`# HELP process_cpu_usage CPU usage percentage`);
    metrics.push(`# TYPE process_cpu_usage gauge`);
    metrics.push(`process_cpu_usage ${currentMetrics.system.cpuUsage}`);
    
    // 内存使用率
    metrics.push(`# HELP process_memory_usage Memory usage percentage`);
    metrics.push(`# TYPE process_memory_usage gauge`);
    metrics.push(`process_memory_usage ${currentMetrics.system.memoryUsage}`);
    
    // 进程内存
    metrics.push(`# HELP process_resident_memory_bytes Process resident memory in bytes`);
    metrics.push(`# TYPE process_resident_memory_bytes gauge`);
    metrics.push(`process_resident_memory_bytes ${currentMetrics.process.memory.heapUsed}`);
    
    // 进程运行时间
    metrics.push(`# HELP process_uptime_seconds Process uptime in seconds`);
    metrics.push(`# TYPE process_uptime_seconds counter`);
    metrics.push(`process_uptime_seconds ${Math.floor(process.uptime())}`);
    
    // ========================================
    // API 指标
    // ========================================
    const apiMetrics = monitor.getApiMetrics();
    
    // 总请求数
    metrics.push(`# HELP http_requests_total Total HTTP requests`);
    metrics.push(`# TYPE http_requests_total counter`);
    metrics.push(`http_requests_total ${apiMetrics.totalRequests}`);
    
    // 端点指标
    for (const endpoint of apiMetrics.endpoints) {
      const label = `method="${endpoint.method}",path="${endpoint.path}"`;
      metrics.push(`http_requests_total{${label}} ${endpoint.count}`);
      
      // 平均响应时间
      const avgDuration = parseFloat(endpoint.avgDuration) / 1000; // 转换为秒
      metrics.push(`http_request_duration_seconds{${label}} ${avgDuration.toFixed(3)}`);
    }
    
    // ========================================
    // 错误指标
    // ========================================
    const errorMetrics = monitor.getErrorMetrics();
    
    metrics.push(`# HELP http_errors_total Total HTTP errors`);
    metrics.push(`# TYPE http_errors_total counter`);
    metrics.push(`http_errors_total ${errorMetrics.totalOccurrences}`);
    
    // ========================================
    // 数据库和 Redis 指标
    // ========================================
    const healthCheck = await monitor.healthCheck();
    
    if (healthCheck.database.status === 'healthy') {
      metrics.push(`# HELP mysql_connected MySQL connection status`);
      metrics.push(`# TYPE mysql_connected gauge`);
      metrics.push(`mysql_connected 1`);
      metrics.push(`# HELP mysql_latency_ms MySQL query latency in milliseconds`);
      metrics.push(`# TYPE mysql_latency_ms gauge`);
      metrics.push(`mysql_latency_ms ${healthCheck.database.latency}`);
    } else {
      metrics.push(`# HELP mysql_connected MySQL connection status`);
      metrics.push(`# TYPE mysql_connected gauge`);
      metrics.push(`mysql_connected 0`);
    }
    
    if (healthCheck.redis.status === 'healthy') {
      metrics.push(`# HELP redis_connected Redis connection status`);
      metrics.push(`# TYPE redis_connected gauge`);
      metrics.push(`redis_connected 1`);
      metrics.push(`# HELP redis_latency_ms Redis ping latency in milliseconds`);
      metrics.push(`# TYPE redis_latency_ms gauge`);
      metrics.push(`redis_latency_ms ${healthCheck.redis.latency}`);
    } else {
      metrics.push(`# HELP redis_connected Redis connection status`);
      metrics.push(`# TYPE redis_connected gauge`);
      metrics.push(`redis_connected 0`);
    }
    
    // ========================================
    // 业务指标
    // ========================================
    
    // 活跃用户数 (最近24小时有活动的用户)
    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    metrics.push(`# HELP active_users Active users in last 24 hours`);
    metrics.push(`# TYPE active_users gauge`);
    metrics.push(`active_users ${activeUsers}`);
    
    // 今日新增用户
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    metrics.push(`# HELP new_users_today New users registered today`);
    metrics.push(`# TYPE new_users_today gauge`);
    metrics.push(`new_users_today ${newUsersToday}`);
    
    // 今日发布话题
    const postsToday = await prisma.post.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    metrics.push(`# HELP posts_created_today Posts created today`);
    metrics.push(`# TYPE posts_created_today gauge`);
    metrics.push(`posts_created_today ${postsToday}`);
    
    // 今日活动数
    const activitiesToday = await prisma.activity.count({
      where: {
        startTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    });
    metrics.push(`# HELP activities_today Activities scheduled today`);
    metrics.push(`# TYPE activities_today gauge`);
    metrics.push(`activities_today ${activitiesToday}`);
    
    // 系统健康状态
    metrics.push(`# HELP up System health status`);
    metrics.push(`# TYPE up gauge`);
    metrics.push(`up 1`);
    
    // 返回 Prometheus 格式
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics.join('\n') + '\n');
    
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).send('# Error generating metrics\n');
  }
});

module.exports = router;

