// ===== routes/stats.js - 统计路由 =====
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// 获取平台统计
router.get('/platform', statsController.getPlatformStats);

// 获取热门标签
router.get('/tags/popular', statsController.getPopularTags);

// 获取用户统计
router.get('/user/:userId', statsController.getUserStats);

// 获取用户活跃度
router.get('/user/:userId/activity', statsController.getUserActivity);

// 获取用户影响力
router.get('/user/:userId/influence', statsController.getUserInfluence);

// 获取用户成长趋势
router.get('/user/:userId/growth', statsController.getUserGrowthTrend);

module.exports = router;

