// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// 发送验证码
router.post('/send-code', authController.sendVerificationCode);

// 注册
router.post('/register', authController.register);

// 登录
router.post('/login', authController.login);

// 忘记密码 - 第一步：验证邮箱
router.post('/forgot-password', authController.forgotPassword);

// 重置密码 - 第二步：设置新密码
router.post('/reset-password', authController.resetPassword);

// 修改密码（需要登录）
router.post('/change-password', authenticate, authController.changePassword);

// 获取登录日志（需要登录）
router.get('/login-logs', authenticate, authController.getLoginLogs);

// 获取安全日志（需要登录）
router.get('/security-logs', authenticate, authController.getSecurityLogs);

module.exports = router;