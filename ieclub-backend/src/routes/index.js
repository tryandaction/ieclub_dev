// ===== routes/index.js - 路由配置（完整版）=====
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const topicController = require('../controllers/topicController');
const commentController = require('../controllers/commentController');
const userController = require('../controllers/userController');
const searchController = require('../controllers/searchController');
const notificationController = require('../controllers/notificationController');
// const communityController = require('../controllers/communityController');
const uploadController = require('../controllers/uploadController');
const LocalUploadService = require('../services/localUploadService');

const { authenticate } = require('../middleware/auth');

// ===== 认证路由 =====
router.post('/auth/send-code', authController.sendVerifyCode);
router.post('/auth/verify-code', authController.verifyCode);
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// ===== 话题路由 =====
router.get('/topics', topicController.getTopics);
router.get('/topics/:id', topicController.getTopicDetail);
router.post('/topics', authenticate, topicController.createTopic);
router.put('/topics/:id', authenticate, topicController.updateTopic);
router.delete('/topics/:id', authenticate, topicController.deleteTopic);
router.post('/topics/:id/like', authenticate, topicController.toggleLike);
router.post('/topics/:id/bookmark', authenticate, topicController.toggleBookmark);
router.post('/topics/:id/quick-action', authenticate, topicController.quickAction);
router.get('/topics/recommend', topicController.getRecommendTopics);
router.get('/topics/trending', topicController.getTrendingTopics);
router.get('/topics/:id/matches', topicController.getMatches);

// ===== 评论路由 =====
router.get('/topics/:topicId/comments', commentController.getComments);
router.post('/comments', authenticate, commentController.createComment);
router.post('/comments/:id/like', authenticate, commentController.likeComment);
router.delete('/comments/:id', authenticate, commentController.deleteComment);

// ===== 用户路由 =====
router.get('/users/search', searchController.searchUsers);
router.get('/users/:id', userController.getUserProfile);
router.put('/users/:id', authenticate, userController.updateUserProfile);
router.post('/users/:id/follow', authenticate, userController.followUser);
router.get('/users/:id/following', userController.getFollowing);
router.get('/users/:id/followers', userController.getFollowers);
router.post('/users/:id/like', authenticate, userController.likeUser);
router.post('/users/:id/heart', authenticate, userController.heartUser);

// ===== 搜索路由 =====
router.get('/search/topics', searchController.searchTopics);
router.get('/search/users', searchController.searchUsers);
router.get('/search/hot-keywords', searchController.getHotKeywords);
router.get('/search/history', authenticate, searchController.getSearchHistory);
router.delete('/search/history', authenticate, searchController.clearSearchHistory);
router.get('/search/suggest', searchController.getSuggestions);

// ===== 通知路由 =====
router.get('/notifications', authenticate, notificationController.getNotifications);
router.get('/notifications/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/notifications/:id/read', authenticate, notificationController.markAsRead);
router.put('/notifications/read-all', authenticate, notificationController.markAllAsRead);
router.delete('/notifications/:id', authenticate, notificationController.deleteNotification);

// ===== 文件上传路由 =====
router.post('/upload/images', authenticate, LocalUploadService.getUploadMiddleware().array('images', 9), uploadController.uploadImages);
router.post('/upload/documents', authenticate, LocalUploadService.getUploadMiddleware().array('documents', 3), uploadController.uploadDocuments);
router.post('/upload/link-preview', authenticate, uploadController.getLinkPreview);
router.delete('/upload/file', authenticate, uploadController.deleteFile);

// ===== 社区路由 =====
router.use('/community', require('./community'));

// ===== 活动路由 =====
router.use('/activities', require('./activities'));

module.exports = router;