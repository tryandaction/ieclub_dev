// src/routes/index.js - Main routing configuration
const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const topicController = require('../controllers/topicController');
const commentController = require('../controllers/commentController');
const UserController = require('../controllers/userController');
const searchController = require('../controllers/searchController');
const uploadController = require('../controllers/uploadController');
const announcementController = require('../controllers/announcementController');
const errorReportController = require('../controllers/errorReportController');
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
router.get('/comments/:commentId/replies', commentController.getReplies);
router.post('/comments', authenticate, commentController.createComment);
router.post('/comments/:id/like', authenticate, commentController.likeComment);
router.delete('/comments/:id', authenticate, commentController.deleteComment);

// Post Routes (新增社区帖子功能)
router.use('/posts', require('./posts'));

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
const searchControllerV2 = require('../controllers/searchControllerV2');
router.get('/search', searchControllerV2.globalSearch);
router.get('/search/posts', searchControllerV2.searchPosts);
router.get('/search/topics', searchController.searchTopics);
router.get('/search/users', searchController.searchUsers);
router.get('/search/activities', searchControllerV2.searchActivities);
router.get('/search/hot-keywords', searchController.getHotKeywords);
router.get('/search/suggestions', searchControllerV2.getSuggestions);
router.get('/search/history', authenticate, searchControllerV2.getSearchHistory);
router.delete('/search/history', authenticate, searchControllerV2.clearSearchHistory);
router.get('/search/suggest', searchController.getSuggestions);

// Notification Routes (完整版路由已迁移到 notificationRoutes.js)
router.use('/notifications', require('./notificationRoutes'));

// Upload Routes
const uploadControllerV2 = require('../controllers/uploadControllerV2');
router.post('/upload/images', authenticate, LocalUploadService.getUploadMiddleware().array('images', 9), uploadController.uploadImages);
router.post('/upload/images-v2', authenticate, LocalUploadService.getUploadMiddleware().array('images', 9), uploadControllerV2.uploadImages);
router.post('/upload/avatar', authenticate, LocalUploadService.getUploadMiddleware().single('avatar'), uploadControllerV2.uploadAvatar);
router.post('/upload/documents', authenticate, LocalUploadService.getUploadMiddleware().array('documents', 3), uploadController.uploadDocuments);
router.post('/upload/documents-v2', authenticate, LocalUploadService.getUploadMiddleware().array('documents', 3), uploadControllerV2.uploadDocuments);
router.post('/upload/link-preview', authenticate, uploadController.getLinkPreview);
router.delete('/upload/file', authenticate, uploadController.deleteFile);
router.delete('/upload/file-v2', authenticate, uploadControllerV2.deleteFile);

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
const statsControllerV2 = require('../controllers/statsControllerV2');
router.use('/stats', require('./stats'));
router.get('/stats-v2/platform', statsControllerV2.getPlatformStats);
router.get('/stats-v2/user/:userId?', authenticate, statsControllerV2.getUserStats);
router.get('/stats-v2/trend', statsControllerV2.getContentTrend);
router.get('/stats-v2/hot', statsControllerV2.getHotContent);
router.get('/stats-v2/behavior/:userId?', authenticate, statsControllerV2.getUserBehaviorAnalysis);
router.get('/stats-v2/credits/:userId?', authenticate, statsControllerV2.getCreditTrend);
router.get('/stats-v2/categories', statsControllerV2.getCategoryStats);
router.get('/stats-v2/leaderboard', statsControllerV2.getLeaderboard);
router.get('/stats-v2/dashboard', authenticate, statsControllerV2.getMyDashboard);

// Feedback Routes
router.use('/feedback', require('./feedback'));

// Admin Routes (管理后台)
router.use('/admin', require('./admin'));

// Moderation Routes (内容审核)
router.use('/moderation', require('./moderation'));

// Monitoring Routes (性能监控)
router.use('/monitoring', require('./monitoring'));

// Credit Routes (积分系统)
router.use('/credits', require('./credits'));

// Backup Routes (数据备份)
router.use('/backup', require('./backup'));

// RBAC Routes (角色权限管理)
router.use('/rbac', require('./rbac'));

// Error Report Routes (不需要认证，让匿名用户也能报告错误)
router.post('/errors/report', errorReportController.reportError);
router.get('/errors/stats', authenticate, errorReportController.getErrorStats);

// Test Route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'IEclub API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
