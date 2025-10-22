// ieclub-backend/src/routes/community.js
// 社区模块路由 - 第一版本

const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { authenticateToken } = require('../middleware/auth');

/**
 * 获取用户列表
 * GET /api/community/users
 * Query: page, pageSize, sortBy, keyword
 */
router.get('/users', authenticateToken, communityController.getUserList);

/**
 * 搜索用户
 * GET /api/community/users/search
 * Query: keyword, page, pageSize
 */
router.get('/users/search', authenticateToken, communityController.searchUsers);

/**
 * 获取用户详细信息
 * GET /api/community/users/:userId
 */
router.get('/users/:userId', authenticateToken, communityController.getUserProfile);

/**
 * 关注用户
 * POST /api/community/users/:userId/follow
 */
router.post('/users/:userId/follow', authenticateToken, communityController.followUser);

/**
 * 取消关注
 * DELETE /api/community/users/:userId/follow
 */
router.delete('/users/:userId/follow', authenticateToken, communityController.unfollowUser);

/**
 * 获取排行榜列表（第二版本新增）
 * GET /api/community/rankings
 * Query: type, period, page, pageSize
 */
router.get('/rankings', authenticateToken, communityController.getRankingList);

/**
 * 获取用户排名详情（第二版本新增）
 * GET /api/community/rankings/users/:userId
 * Query: type, period
 */
router.get('/rankings/users/:userId', authenticateToken, communityController.getUserRanking);

/**
 * 获取我的排名（第二版本新增）
 * GET /api/community/rankings/mine
 * Query: type, period
 */
router.get('/rankings/mine', authenticateToken, communityController.getMyRanking);

/**
 * 获取排行榜奖励配置（第二版本新增）
 * GET /api/community/rankings/rewards
 */
router.get('/rankings/rewards', authenticateToken, communityController.getRewardConfig);

module.exports = router;
