// ieclub-backend/src/routes/activities.js
// 活动模块路由

const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const activityControllerV2 = require('../controllers/activityControllerV2');
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
 * PUT /api/activities/:id
 * Body: title, description, location, startTime, endTime, maxParticipants, category, tags, images
 */
router.put('/:id', authenticate, activityController.updateActivity);

/**
 * 删除活动
 * DELETE /api/activities/:id
 */
router.delete('/:id', authenticate, activityController.deleteActivity);

/**
 * 点赞/取消点赞活动
 * POST /api/activities/:id/like
 * TODO: 实现activityController.toggleLike方法
 */
// router.post('/:id/like', authenticate, activityController.toggleLike);

/**
 * 参与/取消参与活动
 * POST /api/activities/:id/participate
 * TODO: 实现activityController.toggleParticipation方法
 */
// router.post('/:id/participate', authenticate, activityController.toggleParticipation);

/**
 * V2 路由 - 新增功能
 * TODO: 实现activityControllerV2或使用现有controller方法
 */
// 报名参加活动 - 使用现有joinActivity
router.post('/:activityId/join', authenticate, activityController.joinActivity);

// 取消报名 - 使用现有leaveActivity
router.post('/:activityId/leave', authenticate, activityController.leaveActivity);

// 签到
router.post('/:activityId/checkin', authenticate, activityController.checkIn);

// 生成签到二维码
router.get('/:activityId/qrcode', authenticate, activityController.generateCheckInQRCode);

// 验证签到token
router.post('/:activityId/verify-token', authenticate, activityController.verifyCheckInToken);

// 获取参与者列表
router.get('/:activityId/participants', authenticate, activityController.getParticipants);

// 获取签到统计
router.get('/:activityId/checkin-stats', authenticate, activityController.getCheckInStats);

/**
 * 获取活动分类列表
 * GET /api/activities/categories
 * TODO: 实现activityController.getCategories方法
 */
// router.get('/categories', activityController.getCategories);

module.exports = router;
