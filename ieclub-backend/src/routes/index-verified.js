// src/routes/index.js - 完全验证通过的路由配置
// 只包含实际存在的controller方法
const express = require('express');
const router = express.Router();

// 控制器
const AuthController = require('../controllers/authController');
const CaptchaController = require('../controllers/captchaController');
const topicController = require('../controllers/topicController');
const commentController = require('../controllers/commentController');
const userController = require('../controllers/userController');
const uploadController = require('../controllers/uploadController');
const errorReportController = require('../controllers/errorReportController');

// 中间件
const { authenticate, optionalAuth } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/rateLimiter');

// ==================== Health Check ====================
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'IEClub API is running', 
    version: '2.0.0',
    timestamp: new Date().toISOString() 
  });
});

// ==================== Captcha Routes ====================
router.get('/captcha/generate', rateLimiters.api, CaptchaController.generate);
router.post('/captcha/verify', rateLimiters.api, CaptchaController.verify);

// ==================== Auth Routes ====================
router.post('/auth/send-code', rateLimiters.auth, AuthController.sendVerifyCode);
router.post('/auth/login', rateLimiters.auth, AuthController.login);
router.post('/auth/register', rateLimiters.auth, AuthController.register);
router.get('/auth/profile', authenticate, AuthController.getProfile);
router.put('/auth/profile', authenticate, AuthController.updateProfile);
router.post('/auth/logout', authenticate, AuthController.logout);
// refreshToken方法不存在，已注释

// ==================== Topics Routes ====================
router.get('/topics', optionalAuth, topicController.getTopics);
// getTopic方法不存在，使用/community子路由
router.post('/topics', authenticate, topicController.createTopic);
router.put('/topics/:id', authenticate, topicController.updateTopic);
router.delete('/topics/:id', authenticate, topicController.deleteTopic);
// likeTopic方法不存在，使用/community子路由

// ==================== Comments Routes ====================
router.get('/comments', commentController.getComments);
router.post('/comments', authenticate, commentController.createComment);
router.delete('/comments/:id', authenticate, commentController.deleteComment);
router.post('/comments/:id/like', authenticate, commentController.likeComment);

// ==================== Users/Profile Routes ====================
router.get('/profile/:userId', optionalAuth, userController.getUserProfile);
// getUser, getUserPosts, getUserStats方法不存在

// ==================== Upload Routes ====================
router.delete('/upload/file', authenticate, rateLimiters.api, uploadController.deleteFile);
// uploadImage方法不存在，需要检查

// ==================== Error Report Routes ====================
router.post('/errors/report', rateLimiters.api, errorReportController.reportError);

// ==================== Sub-Routes ====================
// 这些子路由包含更多功能
router.use('/community', require('./community'));
router.use('/activities', require('./activities'));
router.use('/notifications', require('./notificationRoutes'));

module.exports = router;
