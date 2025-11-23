// src/routes/index.js - 精简但完整的路由配置
const express = require('express');
const router = express.Router();

// 控制器
const AuthController = require('../controllers/authController');
const CaptchaController = require('../controllers/captchaController');
const topicController = require('../controllers/topicController');
const commentController = require('../controllers/commentController');
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
router.post('/auth/refresh', rateLimiters.auth, AuthController.refreshToken);

// ==================== Topics Routes ====================
// 使用community子路由处理topics

// ==================== Comments Routes ====================
// 使用community子路由处理comments

// ==================== Users/Profile Routes ====================
const userController = require('../controllers/userController');
router.get('/users/:id', userController.getUser);
router.get('/profile/:userId', optionalAuth, userController.getUserProfile);
router.get('/profile/:userId/posts', userController.getUserPosts);
router.get('/profile/:userId/stats', userController.getUserStats);

// ==================== Upload Routes ====================
router.post('/upload/image', authenticate, rateLimiters.upload, uploadController.uploadImage);
router.delete('/upload/file', authenticate, rateLimiters.api, uploadController.deleteFile);

// ==================== Error Report Routes ====================
router.post('/errors/report', rateLimiters.api, errorReportController.reportError);

// ==================== Sub-Routes ====================
router.use('/community', require('./community'));
router.use('/activities', require('./activities'));
router.use('/notifications', require('./notificationRoutes'));

module.exports = router;
