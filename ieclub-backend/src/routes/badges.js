// ===== routes/badges.js - 徽章路由 =====
const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');
const { authenticate } = require('../middleware/auth');

// 获取所有徽章类型
router.get('/', badgeController.getAllBadges);

// 获取积分规则
router.get('/points-rules', badgeController.getPointsRules);

// 获取用户徽章
router.get('/user/:userId', badgeController.getUserBadges);

// 检查用户徽章（管理员功能）
router.post('/check/:userId', authenticate, badgeController.checkUserBadges);

module.exports = router;

