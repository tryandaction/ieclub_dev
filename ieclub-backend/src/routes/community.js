// ieclub-backend/src/routes/community.js
// 社区模块路由 - 基于开发代码优化版本

const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * 获取用户列表
 * GET /api/community/users
 * Query: page, pageSize, sortBy, keyword
 * Note: 改为可选认证，未登录也可访问但功能受限
 */
router.get('/users', optionalAuth, communityController.getUserList);

/**
 * 搜索用户
 * GET /api/community/users/search
 * Query: keyword, page, pageSize
 */
router.get('/users/search', authenticate, communityController.searchUsers);

/**
 * 获取用户详细信息
 * GET /api/community/users/:userId
 */
router.get('/users/:userId', authenticate, communityController.getUserProfile);

/**
 * 关注用户
 * POST /api/community/users/:userId/follow
 */
router.post('/users/:userId/follow', authenticate, communityController.followUser);

/**
 * 取消关注
 * DELETE /api/community/users/:userId/follow
 */
router.delete('/users/:userId/follow', authenticate, communityController.unfollowUser);

module.exports = router;