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
 * 获取活动详情
 * GET /api/activities/:id
 */
router.get('/:id', optionalAuth, activityController.getActivityDetail);

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
 */
router.post('/:id/like', authenticate, activityController.toggleLike);

/**
 * 参与/取消参与活动
 * POST /api/activities/:id/participate
 */
router.post('/:id/participate', authenticate, activityController.toggleParticipation);

/**
 * V2 路由 - 新增功能
 */
// 报名参加活动
router.post('/:activityId/join', authenticate, activityControllerV2.joinActivity);

// 取消报名
router.post('/:activityId/leave', authenticate, activityControllerV2.leaveActivity);

// 获取参与者列表
router.get('/:activityId/participants', activityControllerV2.getParticipants);

// 活动签到
router.post('/:activityId/checkin', authenticate, activityControllerV2.checkIn);

// 获取我的活动
router.get('/me/activities', authenticate, activityControllerV2.getMyActivities);

/**
 * 获取活动分类列表
 * GET /api/activities/categories
 */
router.get('/categories', activityController.getCategories);

module.exports = router;
