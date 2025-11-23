// ieclub-backend/src/controllers/monitoringController.js
// 性能监控控制器

const { monitor } = require('../utils/performanceMonitor');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');

/**
 * 获取系统指标
 */
exports.getSystemMetrics = asyncHandler(async (req, res) => {
  const metrics = await monitor.getCurrentMetrics();
  res.json(successResponse(metrics));
});

/**
 * 获取API指标
 */
exports.getApiMetrics = asyncHandler(async (req, res) => {
  const metrics = monitor.getApiMetrics();
  res.json(successResponse(metrics));
});

/**
 * 获取错误统计
 */
exports.getErrorMetrics = asyncHandler(async (req, res) => {
  const metrics = monitor.getErrorMetrics();
  res.json(successResponse(metrics));
});

/**
 * 获取慢查询
 */
exports.getSlowQueries = asyncHandler(async (req, res) => {
  // 慢查询功能已集成到性能监控中
  const apiMetrics = monitor.getApiMetrics();
  const slowEndpoints = apiMetrics.endpoints.filter(e => parseFloat(e.avgDuration) > 1000);
  res.json(successResponse({ slowQueries: slowEndpoints }));
});

/**
 * 获取数据库指标
 */
exports.getDatabaseMetrics = asyncHandler(async (req, res) => {
  const health = await monitor.healthCheck();
  res.json(successResponse({ database: health.database }));
});

/**
 * 健康检查
 */
exports.healthCheck = asyncHandler(async (req, res) => {
  const health = await monitor.healthCheck();
  
  // 根据健康状态设置HTTP状态码
  const statusCode = health.overall === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(successResponse(health));
});

/**
 * 导出所有指标
 */
exports.exportMetrics = asyncHandler(async (req, res) => {
  const currentMetrics = await monitor.getCurrentMetrics();
  const apiMetrics = monitor.getApiMetrics();
  const errorMetrics = monitor.getErrorMetrics();
  const health = await monitor.healthCheck();
  
  const metrics = {
    system: currentMetrics.system,
    process: currentMetrics.process,
    application: currentMetrics.application,
    api: apiMetrics,
    errors: errorMetrics,
    health,
    exportedAt: new Date()
  };
  
  res.json(successResponse(metrics));
});

