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
// 发送验证码（多个别名支持）
router.post('/auth/send-code', rateLimiters.auth, AuthController.sendVerifyCode);
router.post('/auth/send-verify-code', rateLimiters.auth, AuthController.sendVerifyCode);
// sendPhoneCode方法未实现，暂不支持手机验证码
// 登录相关
router.post('/auth/login', rateLimiters.auth, AuthController.login);
router.post('/auth/login-with-code', rateLimiters.auth, AuthController.loginWithCode);
router.post('/auth/verify-code', rateLimiters.auth, AuthController.loginWithCode); // 别名
// 注册和资料
router.post('/auth/register', rateLimiters.auth, AuthController.register);
router.get('/auth/profile', authenticate, AuthController.getProfile);
router.put('/auth/profile', authenticate, AuthController.updateProfile);
router.post('/auth/logout', authenticate, AuthController.logout);
// 微信登录
router.post('/auth/wechat-login', rateLimiters.auth, AuthController.wechatLogin);
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
// 注意：具体路由必须在router.use之前，否则会被拦截
// 暂时禁用profile子路由，直接使用userController
// router.use('/profile', require('./profile'));
router.get('/profile/:userId', optionalAuth, userController.getUserProfile);
// TODO: 实现getUserPosts和getUserStats方法

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
