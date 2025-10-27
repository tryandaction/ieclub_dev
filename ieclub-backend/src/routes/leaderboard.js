// ===== routes/leaderboard.js - 排行榜路由 =====
const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { authenticate } = require('../middleware/auth');

// 获取综合排行榜
router.get('/overall', leaderboardController.getOverallLeaderboard);

// 获取知识分享排行榜
router.get('/sharing', leaderboardController.getSharingLeaderboard);

// 获取人气排行榜
router.get('/popularity', leaderboardController.getPopularityLeaderboard);

// 获取话题热度排行榜
router.get('/topics', leaderboardController.getTopicLeaderboard);

// 获取项目关注排行榜
router.get('/projects', leaderboardController.getProjectLeaderboard);

// 获取用户排名详情
router.get('/user/:userId', leaderboardController.getUserRanking);

// 获取当前用户排名（需要登录）
router.get('/my-ranking', authenticate, leaderboardController.getMyRanking);

module.exports = router;

