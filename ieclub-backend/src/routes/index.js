// src/routes/index.js - Main routing configuration
const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const topicController = require('../controllers/topicController');
const commentController = require('../controllers/commentController');
const UserController = require('../controllers/userController');
const searchController = require('../controllers/searchController');
const notificationController = require('../controllers/notificationController');
const uploadController = require('../controllers/uploadController');
const announcementController = require('../controllers/announcementController');
const LocalUploadService = require('../services/localUploadService');

const { authenticate } = require('../middleware/auth');

// Authentication Routes
router.post('/auth/send-verify-code', AuthController.sendVerifyCode);
router.post('/auth/verify-code', AuthController.verifyCode);
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/login-with-code', AuthController.loginWithCode);
router.post('/auth/forgot-password', AuthController.forgotPassword);
router.post('/auth/reset-password', AuthController.resetPassword);
router.get('/auth/profile', authenticate, AuthController.getProfile);
router.put('/auth/profile', authenticate, AuthController.updateProfile);
router.put('/auth/change-password', authenticate, AuthController.changePassword);
router.post('/auth/bind-wechat', authenticate, AuthController.bindWechat);
router.post('/auth/bind-phone', authenticate, AuthController.bindPhone);
router.post('/auth/logout', authenticate, AuthController.logout);
router.post('/auth/wechat-login', AuthController.wechatLogin);

// Topic Routes
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

// Comment Routes
router.get('/topics/:topicId/comments', commentController.getComments);
router.post('/comments', authenticate, commentController.createComment);
router.post('/comments/:id/like', authenticate, commentController.likeComment);
router.delete('/comments/:id', authenticate, commentController.deleteComment);

// User Routes
router.get('/users', UserController.getUsers);
router.get('/users/search', searchController.searchUsers);
router.get('/users/:id', UserController.getUserProfile);
router.put('/users/:id', authenticate, UserController.updateUserProfile);
router.post('/users/:id/follow', authenticate, UserController.followUser);
router.get('/users/:id/following', UserController.getFollowing);
router.get('/users/:id/followers', UserController.getFollowers);
router.post('/users/:id/like', authenticate, UserController.likeUser);
router.post('/users/:id/heart', authenticate, UserController.heartUser);

// Search Routes
router.get('/search/topics', searchController.searchTopics);
router.get('/search/users', searchController.searchUsers);
router.get('/search/hot-keywords', searchController.getHotKeywords);
router.get('/search/history', authenticate, searchController.getSearchHistory);
router.delete('/search/history', authenticate, searchController.clearSearchHistory);
router.get('/search/suggest', searchController.getSuggestions);

// Notification Routes
router.get('/notifications', authenticate, notificationController.getNotifications);
router.get('/notifications/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/notifications/:id/read', authenticate, notificationController.markAsRead);
router.put('/notifications/read-all', authenticate, notificationController.markAllAsRead);
router.delete('/notifications/:id', authenticate, notificationController.deleteNotification);

// Upload Routes
router.post('/upload/images', authenticate, LocalUploadService.getUploadMiddleware().array('images', 9), uploadController.uploadImages);
router.post('/upload/documents', authenticate, LocalUploadService.getUploadMiddleware().array('documents', 3), uploadController.uploadDocuments);
router.post('/upload/link-preview', authenticate, uploadController.getLinkPreview);
router.delete('/upload/file', authenticate, uploadController.deleteFile);

// Community Routes
router.use('/community', require('./community'));

// Activity Routes
router.use('/activities', require('./activities'));

// Announcement Routes
router.get('/announcements', announcementController.getAnnouncements);
router.get('/announcements/:id', announcementController.getAnnouncementDetail);
router.put('/announcements/:id/read', authenticate, announcementController.markAsRead);

// Leaderboard Routes
router.use('/leaderboard', require('./leaderboard'));

// Badge Routes
router.use('/badges', require('./badges'));

// Stats Routes
router.use('/stats', require('./stats'));

// Feedback Routes
router.use('/feedback', require('./feedback'));

// Test Route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'IEclub API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
