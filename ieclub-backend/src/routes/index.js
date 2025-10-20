// ===== 3. routes/index.js - 路由配置（完整版）=====
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const topicController = require('../controllers/topicController');
const commentController = require('../controllers/commentController');
const userController = require('../controllers/userController');

const { authenticate } = require('../middleware/auth');

// ===== 认证路由 =====
router.post('/auth/send-code', authController.sendVerifyCode);
router.post('/auth/verify-code', authController.verifyCode);
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// ===== 话题路由 =====
router.get('/topics', topicController.getTopics);
router.get('/topics/:id', topicController.getTopicById);
router.post('/topics', authenticate, topicController.createTopic);
router.put('/topics/:id', authenticate, topicController.updateTopic);
router.delete('/topics/:id', authenticate, topicController.deleteTopic);
router.post('/topics/:id/like', authenticate, topicController.likeTopic);
router.post('/topics/:id/quick-action', authenticate, topicController.quickAction);

// ===== 评论路由 =====
router.get('/topics/:topicId/comments', commentController.getComments);
router.post('/comments', authenticate, commentController.createComment);
router.post('/comments/:id/like', authenticate, commentController.likeComment);
router.delete('/comments/:id', authenticate, commentController.deleteComment);

// ===== 用户路由 =====
router.get('/users/profile', authenticate, userController.getProfile);
router.put('/users/profile', authenticate, userController.updateProfile);

module.exports = router;