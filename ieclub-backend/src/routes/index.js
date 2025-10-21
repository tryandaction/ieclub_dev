// ===== routes/index.js - 路由配置（完整版）=====
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const topicController = require('../controllers/topicController');
const commentController = require('../controllers/commentController');
const userController = require('../controllers/userController');
const searchController = require('../controllers/searchController');
const notificationController = require('../controllers/notificationController');
const communityController = require('../controllers/communityController');

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
router.get('/users/search', userController.searchUsers);
router.get('/users/:id', userController.getUserProfile);
router.put('/users/:id', authenticate, userController.updateUserProfile);
router.post('/users/:id/follow', authenticate, userController.followUser);
router.get('/users/:id/following', userController.getFollowing);
router.get('/users/:id/followers', userController.getFollowers);
router.post('/users/:id/like', authenticate, userController.likeUser);
router.post('/users/:id/heart', authenticate, userController.heartUser);

// ===== 认证路由 =====
router.post('/auth/send-code', authController.sendVerificationCode);
router.post('/auth/verify-code', authController.verifyCode);
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.post('/auth/change-password', authenticate, authController.changePassword);
router.get('/auth/login-logs', authenticate, authController.getLoginLogs);
router.get('/auth/security-logs', authenticate, authController.getSecurityLogs);

// ===== 搜索路由 =====
router.get('/search', searchController.search);
router.get('/search/hot', searchController.getHotSearches);
router.get('/search/history', authenticate, searchController.getSearchHistory);
router.delete('/search/history', authenticate, searchController.clearSearchHistory);
router.get('/search/suggestions', searchController.getSearchSuggestions);

// ===== 通知路由 =====
router.get('/notifications', authenticate, notificationController.getNotifications);
router.get('/notifications/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/notifications/:id/read', authenticate, notificationController.markAsRead);
router.put('/notifications/read-all', authenticate, notificationController.markAllAsRead);
router.delete('/notifications/:id', authenticate, notificationController.deleteNotification);

// ===== 社区路由 =====
router.use('/community', require('./community'));

module.exports = router;