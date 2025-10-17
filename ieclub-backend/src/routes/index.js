// src/routes/index.js
// 主路由配置（修复后的版本）

const express = require('express');
const router = express.Router();

// 导入控制器（修复导入错误）
const AuthController = require('../controllers/authController');
const TopicController = require('../controllers/topicController');
const CommentController = require('../controllers/commentController');
const UploadController = require('../controllers/uploadController');
const NotificationController = require('../controllers/notificationController'); // ✅ 独立导入
const UserController = require('../controllers/userController'); // ✅ 独立导入
const SearchController = require('../controllers/searchController'); // ✅ 搜索控制器

// 导入中间件
const { authenticate, optionalAuth, refreshToken } = require('../middleware/auth');
const {
  uploadMultipleImages,
  uploadMultipleDocuments,
  handleUploadError,
} = require('../middleware/upload');
const {
  validateWechatLogin,
  validateCreateTopic,
  validateUpdateTopic,
  validateCreateComment,
  validateUpdateProfile,
  validateQuickAction,
  validateLinkPreview,
  validatePagination,
  validateUUID,
} = require('../middleware/validation');

// ==================== 认证路由 ====================
router.post('/auth/wechat-login', validateWechatLogin, AuthController.wechatLogin);
router.post('/auth/refresh-token', refreshToken);
router.get('/auth/me', authenticate, AuthController.getCurrentUser);
router.put('/auth/profile', authenticate, validateUpdateProfile, AuthController.updateProfile);
router.post('/auth/logout', authenticate, AuthController.logout);
router.post('/auth/daily-checkin', authenticate, AuthController.dailyCheckin);

// ==================== 文件上传路由 ====================
router.post(
  '/upload/images',
  authenticate,
  uploadMultipleImages,
  handleUploadError,
  UploadController.uploadImages
);

router.post(
  '/upload/documents',
  authenticate,
  uploadMultipleDocuments,
  handleUploadError,
  UploadController.uploadDocuments
);

router.post(
  '/upload/link-preview',
  authenticate,
  validateLinkPreview,
  UploadController.getLinkPreview
);

router.delete('/upload/file', authenticate, UploadController.deleteFile);
router.get('/upload/signature', authenticate, UploadController.getUploadSignature);

// ==================== 话题路由 ====================
// 列表和推荐
router.get('/topics', optionalAuth, validatePagination, TopicController.getTopics);
router.get('/topics/recommend', optionalAuth, TopicController.getRecommendTopics);
router.get('/topics/trending', TopicController.getTrendingTopics);

// CRUD
router.post('/topics', authenticate, validateCreateTopic, TopicController.createTopic);
router.get('/topics/:id', optionalAuth, validateUUID('id'), TopicController.getTopicDetail);
router.put('/topics/:id', authenticate, validateUpdateTopic, TopicController.updateTopic);
router.delete('/topics/:id', authenticate, validateUUID('id'), TopicController.deleteTopic);

// 互动
router.post('/topics/:id/like', authenticate, validateUUID('id'), TopicController.toggleLike);
router.post('/topics/:id/bookmark', authenticate, validateUUID('id'), TopicController.toggleBookmark);
router.post('/topics/:id/quick-action', authenticate, validateQuickAction, TopicController.quickAction);
router.get('/topics/:id/matches', validateUUID('id'), TopicController.getMatches);

// ==================== 评论路由 ====================
router.get(
  '/topics/:topicId/comments',
  optionalAuth,
  validateUUID('topicId'),
  validatePagination,
  CommentController.getComments
);
router.get(
  '/comments/:id/replies',
  optionalAuth,
  validateUUID('id'),
  validatePagination,
  CommentController.getReplies
);
router.post(
  '/topics/:topicId/comments',
  authenticate,
  validateCreateComment,
  CommentController.createComment
);
router.put('/comments/:id', authenticate, validateUUID('id'), CommentController.updateComment);
router.delete('/comments/:id', authenticate, validateUUID('id'), CommentController.deleteComment);
router.post('/comments/:id/like', authenticate, validateUUID('id'), CommentController.toggleLike);

// ==================== 通知路由 ====================
router.get('/notifications', authenticate, validatePagination, NotificationController.getNotifications);
router.get('/notifications/unread-count', authenticate, NotificationController.getUnreadCount);
router.put('/notifications/:id/read', authenticate, validateUUID('id'), NotificationController.markAsRead);
router.put('/notifications/read-all', authenticate, NotificationController.markAllAsRead);
router.delete('/notifications/:id', authenticate, validateUUID('id'), NotificationController.deleteNotification);
router.post('/notifications/system', authenticate, NotificationController.createSystemNotification);

// ==================== 用户路由 ====================
router.get('/users/:id', optionalAuth, validateUUID('id'), UserController.getUserProfile);
router.get('/users/:id/topics', optionalAuth, validateUUID('id'), validatePagination, UserController.getUserTopics);
router.get('/users/:id/comments', optionalAuth, validateUUID('id'), validatePagination, UserController.getUserComments);
router.post('/users/:id/follow', authenticate, validateUUID('id'), UserController.followUser);
router.get('/users/:id/followers', validateUUID('id'), validatePagination, UserController.getFollowers);
router.get('/users/:id/following', validateUUID('id'), validatePagination, UserController.getFollowing);

// 我的内容
router.get('/me/topics', authenticate, validatePagination, UserController.getMyTopics);
router.get('/me/bookmarks', authenticate, validatePagination, UserController.getMyBookmarks);
router.get('/me/likes', authenticate, validatePagination, UserController.getMyLikes);

// ==================== 搜索路由 ====================
router.get('/search/topics', optionalAuth, SearchController.searchTopics);
router.get('/search/users', optionalAuth, SearchController.searchUsers);
router.get('/search/hot-keywords', SearchController.getHotKeywords);
router.get('/search/history', authenticate, SearchController.getSearchHistory);
router.delete('/search/history', authenticate, SearchController.clearSearchHistory);
router.get('/search/suggest', SearchController.getSuggestions);

// ==================== 健康检查 ====================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'IEclub API is running',
    version: '2.0.0',
    timestamp: Date.now(),
    env: process.env.NODE_ENV,
  });
});

// ==================== API 信息 ====================
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'IEclub API',
    version: '2.0.0',
    documentation: 'https://docs.ieclub.online',
    endpoints: {
      auth: '/api/v1/auth',
      topics: '/api/v1/topics',
      comments: '/api/v1/comments',
      upload: '/api/v1/upload',
      notifications: '/api/v1/notifications',
      users: '/api/v1/users',
      search: '/api/v1/search',
    },
  });
});

module.exports = router;