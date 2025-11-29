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
// 密码相关
router.post('/auth/forgot-password', rateLimiters.auth, AuthController.forgotPassword);
router.post('/auth/reset-password', rateLimiters.auth, AuthController.resetPassword);
router.post('/auth/set-password', authenticate, AuthController.setPassword);
router.put('/auth/change-password', authenticate, AuthController.changePassword);
// refreshToken方法不存在，已注释

// ==================== Topics Routes ====================
router.get('/topics', optionalAuth, topicController.getTopics);
router.get('/topics/:id', optionalAuth, topicController.getTopicDetail);
router.post('/topics', authenticate, topicController.createTopic);
router.put('/topics/:id', authenticate, topicController.updateTopic);
router.delete('/topics/:id', authenticate, topicController.deleteTopic);
router.post('/topics/:id/like', authenticate, topicController.toggleLike);
router.post('/topics/:id/bookmark', authenticate, topicController.toggleBookmark);
router.post('/topics/:id/quick-action', authenticate, topicController.quickAction);

// ==================== Comments Routes ====================
// 通用评论路由（支持query参数传topicId）
router.get('/comments', commentController.getComments);
router.post('/comments', authenticate, commentController.createComment);
router.delete('/comments/:id', authenticate, commentController.deleteComment);
router.post('/comments/:id/like', authenticate, commentController.likeComment);

// 话题评论路由（RESTful风格，topicId在path中）
router.get('/topics/:topicId/comments', commentController.getComments);
router.post('/topics/:topicId/comments', authenticate, commentController.createComment);
router.delete('/topics/:topicId/comments/:id', authenticate, commentController.deleteComment);
router.post('/topics/:topicId/comments/:id/like', authenticate, commentController.likeComment);

// ==================== Users/Profile Routes ====================
// ⚠️ 重要：直接注册profile路由，避免子路由匹配问题
const profileController = require('../controllers/profileController');

// 🧪 测试端点 - 验证PUT请求是否能工作
router.put('/test-simple-put', (req, res) => {
  try {
    console.log('✅ TEST: Simple PUT works!');
    console.log('Body:', req.body);
    
    // 立即返回成功，不做任何处理
    return res.status(200).json({ 
      success: true, 
      message: 'Simple PUT works!', 
      body: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ TEST ERROR:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.put('/test-auth-put', authenticate, (req, res) => {
  console.log('✅ TEST: Auth PUT works! User:', req.user?.id);
  res.json({ success: true, message: 'Auth PUT works!', user: req.user?.id, body: req.body });
});

// 编辑个人主页（PUT必须在GET之前，避免被/:userId匹配）
router.put('/profile', authenticate, async (req, res, next) => {
  const fs = require('fs');
  const logData = `\n[${new Date().toISOString()}] PUT /profile - User: ${req.user?.id} - Body: ${JSON.stringify(req.body)}\n`;
  fs.appendFileSync('/tmp/profile-update.log', logData);
  
  try {
    console.log('🔥🔥🔥 [/profile] Route handler called');
    console.log('🔥 [/profile] User:', req.user?.id);
    console.log('🔥 [/profile] Body:', JSON.stringify(req.body));
    
    // 直接调用controller
    await profileController.updateProfile(req, res, next);
    
    fs.appendFileSync('/tmp/profile-update.log', `[${new Date().toISOString()}] Controller执行完成\n`);
  } catch (error) {
    console.error('🔥 [/profile] Wrapper Error:', error);
    fs.appendFileSync('/tmp/profile-update.log', `[${new Date().toISOString()}] Error: ${error.message}\n`);
    next(error);
  }
});

// 使用子路由处理其他profile相关请求
router.use('/profile', require('./profile'));

// ==================== Upload Routes ====================
router.use('/upload', require('./upload'));

// ==================== Error Report Routes ====================
router.post('/errors/report', rateLimiters.api, errorReportController.reportError);

// ==================== Sub-Routes ====================
// 这些子路由包含更多功能
router.use('/community', require('./community'));
router.use('/activities', require('./activities'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/messages', require('./message'));
router.use('/groups', require('./groups'));

module.exports = router;
