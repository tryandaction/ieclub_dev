// ieclub-backend/src/routes/metrics.js
// Prometheus 指标导出端点

const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
    const systemMetrics = await monitoringService.getSystemMetrics();
    
    // CPU 使用率
    metrics.push(`# HELP process_cpu_usage CPU usage percentage`);
    metrics.push(`# TYPE process_cpu_usage gauge`);
    metrics.push(`process_cpu_usage ${systemMetrics.system.cpuUsage.toFixed(2)}`);
    
    // 内存使用率
    metrics.push(`# HELP process_memory_usage Memory usage percentage`);
    metrics.push(`# TYPE process_memory_usage gauge`);
    metrics.push(`process_memory_usage ${systemMetrics.system.memUsage.toFixed(2)}`);
    
    // 进程内存
    metrics.push(`# HELP process_resident_memory_bytes Process resident memory in bytes`);
    metrics.push(`# TYPE process_resident_memory_bytes gauge`);
    metrics.push(`process_resident_memory_bytes ${systemMetrics.process.heapUsed}`);
    
    // 进程运行时间
    metrics.push(`# HELP process_uptime_seconds Process uptime in seconds`);
    metrics.push(`# TYPE process_uptime_seconds counter`);
    metrics.push(`process_uptime_seconds ${systemMetrics.process.uptime}`);
    
    // ========================================
    // API 指标
    // ========================================
    const apiMetrics = monitoringService.getApiMetrics();
    
    // 总请求数
    metrics.push(`# HELP http_requests_total Total HTTP requests`);
    metrics.push(`# TYPE http_requests_total counter`);
    for (const [endpoint, data] of apiMetrics.endpoints.entries()) {
      metrics.push(`http_requests_total{endpoint="${endpoint}"} ${data.count}`);
    }
    
    // 平均响应时间
    metrics.push(`# HELP http_request_duration_seconds HTTP request duration in seconds`);
    metrics.push(`# TYPE http_request_duration_seconds histogram`);
    for (const [endpoint, data] of apiMetrics.endpoints.entries()) {
      const avgDuration = data.avgDuration / 1000; // 转换为秒
      metrics.push(`http_request_duration_seconds{endpoint="${endpoint}"} ${avgDuration.toFixed(3)}`);
    }
    
    // ========================================
    // 错误指标
    // ========================================
    const errorMetrics = monitoringService.getErrorMetrics();
    
    metrics.push(`# HELP http_errors_total Total HTTP errors`);
    metrics.push(`# TYPE http_errors_total counter`);
    metrics.push(`http_errors_total ${errorMetrics.total}`);
    
    metrics.push(`# HELP http_errors_last_hour HTTP errors in the last hour`);
    metrics.push(`# TYPE http_errors_last_hour gauge`);
    metrics.push(`http_errors_last_hour ${errorMetrics.lastHour}`);
    
    // ========================================
    // 数据库指标
    // ========================================
    if (systemMetrics.database) {
      metrics.push(`# HELP mysql_connections Active MySQL connections`);
      metrics.push(`# TYPE mysql_connections gauge`);
      metrics.push(`mysql_connections ${systemMetrics.database.connections || 0}`);
    }
    
    // ========================================
    // Redis 指标
    // ========================================
    if (systemMetrics.redis && systemMetrics.redis.connected) {
      metrics.push(`# HELP redis_connected Redis connection status`);
      metrics.push(`# TYPE redis_connected gauge`);
      metrics.push(`redis_connected 1`);
      
      if (systemMetrics.redis.totalCommands) {
        metrics.push(`# HELP redis_commands_processed_total Total Redis commands processed`);
        metrics.push(`# TYPE redis_commands_processed_total counter`);
        metrics.push(`redis_commands_processed_total ${systemMetrics.redis.totalCommands}`);
      }
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

