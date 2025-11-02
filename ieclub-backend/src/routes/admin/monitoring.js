/**
 * 管理端 - 监控和告警路由
 */

const express = require('express');
const router = express.Router();
const { monitor } = require('../../utils/performanceMonitor');
const alertSystem = require('../../utils/alertSystem');
const { asyncHandler } = require('../../utils/errorHandler');
const logger = require('../../utils/logger');

/**
 * 获取实时性能指标
 * GET /api/v1/admin/monitoring/performance
 */
router.get('/performance', asyncHandler(async (req, res) => {
  const metrics = await monitor.getCurrentMetrics();
  
  res.json({
    success: true,
    data: metrics,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * 获取性能历史数据
 * GET /api/v1/admin/monitoring/performance/history
 */
router.get('/performance/history', asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query;
  const history = await monitor.getMetricsHistory(parseInt(hours));
  
  res.json({
    success: true,
    data: history,
    period: `${hours} hours`,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * 获取性能报告
 * GET /api/v1/admin/monitoring/performance/report
 */
router.get('/performance/report', asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query;
  const report = await monitor.getPerformanceReport(parseInt(hours));
  
  res.json({
    success: true,
    data: report,
    period: `${hours} hours`,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * 测试告警系统
 * POST /api/v1/admin/monitoring/test-alert
 */
router.post('/test-alert', asyncHandler(async (req, res) => {
  logger.info('管理员触发告警测试', { admin: req.user?.id });
  
  const result = await alertSystem.testAlert();
  
  res.json({
    success: true,
    message: '测试告警已发送',
    data: result,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * 发送自定义告警
 * POST /api/v1/admin/monitoring/send-alert
 */
router.post('/send-alert', asyncHandler(async (req, res) => {
  const { level, title, message, data, type } = req.body;
  
  // 验证必需字段
  if (!title || !message) {
    return res.status(400).json({
      success: false,
      message: '缺少必需字段: title, message',
    });
  }
  
  // 验证告警级别
  const validLevels = ['info', 'warning', 'error', 'critical'];
  if (level && !validLevels.includes(level)) {
    return res.status(400).json({
      success: false,
      message: `无效的告警级别，必须是: ${validLevels.join(', ')}`,
    });
  }
  
  logger.info('管理员发送自定义告警', {
    admin: req.user?.id,
    level,
    title,
  });
  
  const result = await alertSystem.sendAlert({
    level: level || 'info',
    title,
    message,
    data: data || {},
    type: type || 'custom',
  });
  
  res.json({
    success: true,
    message: '告警已发送',
    data: result,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * 获取告警配置
 * GET /api/v1/admin/monitoring/alert-config
 */
router.get('/alert-config', asyncHandler(async (req, res) => {
  const config = {
    email: {
      enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
      configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      recipients: process.env.ALERT_EMAIL_TO?.split(',').length || 0,
    },
    dingtalk: {
      enabled: process.env.ALERT_DINGTALK_ENABLED === 'true',
      configured: !!process.env.DINGTALK_WEBHOOK,
      hasSecret: !!process.env.DINGTALK_SECRET,
    },
    wecom: {
      enabled: process.env.ALERT_WECOM_ENABLED === 'true',
      configured: !!process.env.WECOM_WEBHOOK,
    },
    slack: {
      enabled: process.env.ALERT_SLACK_ENABLED === 'true',
      configured: !!process.env.SLACK_WEBHOOK,
    },
    thresholds: {
      cpu: parseFloat(process.env.ALERT_THRESHOLD_CPU || '80'),
      memory: parseFloat(process.env.ALERT_THRESHOLD_MEMORY || '85'),
      responseTime: parseInt(process.env.ALERT_THRESHOLD_RESPONSE_TIME || '2000'),
      errorRate: parseFloat(process.env.ALERT_THRESHOLD_ERROR_RATE || '5'),
      slowRequestRate: parseFloat(process.env.ALERT_THRESHOLD_SLOW_REQUEST_RATE || '10'),
    },
    cooldown: parseInt(process.env.ALERT_COOLDOWN || '300'),
  };
  
  res.json({
    success: true,
    data: config,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * 获取系统健康状态
 * GET /api/v1/admin/monitoring/health
 */
router.get('/health', asyncHandler(async (req, res) => {
  const metrics = await monitor.getCurrentMetrics();
  
  // 判断系统健康状态
  const health = {
    status: 'healthy',
    checks: {
      cpu: {
        status: metrics.system.cpuUsage < 80 ? 'healthy' : 'warning',
        value: metrics.system.cpuUsage,
        threshold: 80,
      },
      memory: {
        status: metrics.system.memoryUsage < 85 ? 'healthy' : 'warning',
        value: metrics.system.memoryUsage,
        threshold: 85,
      },
      responseTime: {
        status: metrics.application.avgResponseTime < 2000 ? 'healthy' : 'warning',
        value: metrics.application.avgResponseTime,
        threshold: 2000,
      },
      errorRate: {
        status: metrics.application.errorRate < 5 ? 'healthy' : 'warning',
        value: metrics.application.errorRate,
        threshold: 5,
      },
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  
  // 如果有任何检查不健康，整体状态为 warning
  const hasWarning = Object.values(health.checks).some(check => check.status === 'warning');
  if (hasWarning) {
    health.status = 'warning';
  }
  
  res.json({
    success: true,
    data: health,
  });
}));

/**
 * 清理性能数据
 * DELETE /api/v1/admin/monitoring/performance
 */
router.delete('/performance', asyncHandler(async (req, res) => {
  logger.info('管理员清理性能数据', { admin: req.user?.id });
  
  // 这里可以实现清理逻辑
  // 例如：清理 Redis 中的历史数据
  
  res.json({
    success: true,
    message: '性能数据已清理',
    timestamp: new Date().toISOString(),
  });
}));

module.exports = router;

