// ieclub-backend/src/routes/monitoring.js
// 性能监控路由

const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoringController');
const { authenticateAdmin } = require('../middleware/adminAuth');

// ==================== 公共接口 ====================
/**
 * @route   GET /api/monitoring/health
 * @desc    健康检查（公开接口，用于负载均衡器）
 * @access  Public
 */
router.get('/health', monitoringController.healthCheck);

// ==================== 管理员接口 ====================
// 需要管理员权限
router.use(authenticateAdmin);

/**
 * @route   GET /api/monitoring/system
 * @desc    获取系统指标
 * @access  Admin
 */
router.get('/system', monitoringController.getSystemMetrics);

/**
 * @route   GET /api/monitoring/api
 * @desc    获取API指标
 * @access  Admin
 */
router.get('/api', monitoringController.getApiMetrics);

/**
 * @route   GET /api/monitoring/errors
 * @desc    获取错误统计
 * @access  Admin
 */
router.get('/errors', monitoringController.getErrorMetrics);

/**
 * @route   GET /api/monitoring/slow-queries
 * @desc    获取慢查询
 * @access  Admin
 */
router.get('/slow-queries', monitoringController.getSlowQueries);

/**
 * @route   GET /api/monitoring/database
 * @desc    获取数据库指标
 * @access  Admin
 */
router.get('/database', monitoringController.getDatabaseMetrics);

/**
 * @route   GET /api/monitoring/export
 * @desc    导出所有监控指标
 * @access  Admin
 */
router.get('/export', monitoringController.exportMetrics);

module.exports = router;

