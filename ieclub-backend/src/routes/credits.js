/**
 * 积分路由
 */

const express = require('express');
const router = express.Router();
const creditController = require('../controllers/creditController');
const { authenticate } = require('../middleware/auth');

// 公开路由（不需要认证）
// 获取所有勋章
router.get('/badges/all', creditController.getAllBadges);

// 排行榜
router.get('/leaderboard/level', creditController.getLevelLeaderboard);
router.get('/leaderboard/credits', creditController.getCreditLeaderboard);

// 需要认证的路由
router.use(authenticate);

// 获取用户积分信息
router.get('/info', creditController.getUserCredits);

// 获取积分历史
router.get('/history', creditController.getCreditHistory);

// 每日签到
router.post('/check-in', creditController.dailyCheckIn);

// 获取签到状态
router.get('/check-in/status', creditController.getCheckInStatus);

// 获取用户勋章
router.get('/badges', creditController.getUserBadges);
router.get('/badges/:userId', creditController.getUserBadges);

module.exports = router;

