// ieclub-backend/src/routes/activities.js
// 活动模块路由 - 使用重写的控制器

const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityControllerNew');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * 获取活动列表（瀑布流布局）
 * GET /api/activities
 * Query: page, limit, category, sortBy, search, status
 */
router.get('/', optionalAuth, activityController.getActivities);

/**
 * 获取我的活动（必须在/:id之前）
 * GET /api/activities/me/activities
 * Query: type (joined/organized), page, pageSize
 */
router.get('/me/activities', authenticate, activityController.getMyActivities);

/**
 * 获取活动详情
 * GET /api/activities/:id
 */
router.get('/:id', optionalAuth, activityController.getActivityById);

/**
 * 创建活动
 * POST /api/activities
 * Body: title, description, location, startTime, endTime, maxParticipants, category, tags, images
 */
router.post('/', authenticate, activityController.createActivity);

/**
 * 更新活动
 */
router.put('/:id', authenticate, activityController.updateActivity);

/**
 * 删除活动
 */
router.delete('/:id', authenticate, activityController.deleteActivity);

/**
 * 报名参加活动
 */
router.post('/:activityId/join', authenticate, activityController.joinActivity);

/**
 * 取消报名
 */
router.post('/:activityId/leave', authenticate, activityController.leaveActivity);

/**
 * 签到
 */
router.post('/:activityId/checkin', authenticate, activityController.checkIn);

/**
 * 生成签到二维码
 */
router.get('/:activityId/qrcode', authenticate, activityController.generateCheckInQRCode);

/**
 * 验证签到token
 */
router.post('/:activityId/verify-token', authenticate, activityController.verifyCheckInToken);

/**
 * 获取参与者列表
 */
router.get('/:activityId/participants', authenticate, activityController.getParticipants);

/**
 * 获取签到统计
 */
router.get('/:activityId/checkin-stats', authenticate, activityController.getCheckInStats);

module.exports = router;
