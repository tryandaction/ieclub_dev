// ieclub-backend/src/controllers/monitoringController.js
// 性能监控控制器

const monitoringService = require('../services/monitoringService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

/**
 * 获取系统指标
 */
exports.getSystemMetrics = asyncHandler(async (req, res) => {
  const metrics = await monitoringService.getSystemMetrics();
  res.json(success(metrics));
});

/**
 * 获取API指标
 */
exports.getApiMetrics = asyncHandler(async (req, res) => {
  const metrics = monitoringService.getApiMetrics();
  res.json(success(metrics));
});

/**
 * 获取错误统计
 */
exports.getErrorMetrics = asyncHandler(async (req, res) => {
  const metrics = monitoringService.getErrorMetrics();
  res.json(success(metrics));
});

/**
 * 获取慢查询
 */
exports.getSlowQueries = asyncHandler(async (req, res) => {
  const slowQueries = await monitoringService.getSlowQueries();
  res.json(success({ slowQueries }));
});

/**
 * 获取数据库指标
 */
exports.getDatabaseMetrics = asyncHandler(async (req, res) => {
  const metrics = await monitoringService.getDatabaseMetrics();
  res.json(success(metrics));
});

/**
 * 健康检查
 */
exports.healthCheck = asyncHandler(async (req, res) => {
  const health = await monitoringService.healthCheck();
  
  // 根据健康状态设置HTTP状态码
  const statusCode = health.overall === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(success(health));
});

/**
 * 导出所有指标
 */
exports.exportMetrics = asyncHandler(async (req, res) => {
  const metrics = await monitoringService.exportMetrics();
  res.json(success(metrics));
});

