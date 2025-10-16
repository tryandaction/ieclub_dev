// src/routes/index.js
// 主路由配置

const express = require('express');
const router = express.Router();

// 导入控制器
const AuthController = require('../controllers/authController');
const TopicController = require('../controllers/topicController');
const UploadController = require('../controllers/uploadController');
const CommentController = require('../controllers/commentController');
const NotificationController = require('../controllers/notificationController');
const UserController = require('../controllers/userController');

// 导入中间件
const { authenticate, optionalAuth, refreshToken } = require('../middleware/auth');
const {
  uploadMultipleImages,
  uploadMultipleDocuments,
  handleUploadError,
} = require('../middleware/upload');

// ==================== 认证路由 ====================
router.post('/auth/wechat-login', AuthController.wechatLogin);
router.post('/auth/refresh-token', refreshToken);
router.get('/auth/me', authenticate, AuthController.getCurrentUser);
router.put('/auth/profile', authenticate, AuthController.updateProfile);
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

router.post('/upload/link-preview', authenticate, UploadController.getLinkPreview);

// ==================== 话题路由 ====================
// 列表和推荐
router.get('/topics', optionalAuth, TopicController.getTopics);
router.get('/topics/recommend', optionalAuth, TopicController.getRecommendTopics);
router.get('/topics/trending', TopicController.getTrendingTopics);

// CRUD
router.post('/topics', authenticate, TopicController.createTopic);
router.get('/topics/:id', optionalAuth, TopicController.getTopicDetail);
router.put('/topics/:id', authenticate, TopicController.updateTopic);
router.delete('/topics/:id', authenticate, TopicController.deleteTopic);

// 互动
router.post('/topics/:id/like', authenticate, TopicController.toggleLike);
router.post('/topics/:id/bookmark', authenticate, TopicController.toggleBookmark);
router.post('/topics/:id/quick-action', authenticate, TopicController.quickAction);
router.get('/topics/:id/matches', TopicController.getMatches);

// ==================== 评论路由 ====================
router.get('/topics/:topicId/comments', optionalAuth, CommentController.getComments);
router.post('/topics/:topicId/comments', authenticate, CommentController.createComment);
router.put('/comments/:id', authenticate, CommentController.updateComment);
router.delete('/comments/:id', authenticate, CommentController.deleteComment);
router.post('/comments/:id/like', authenticate, CommentController.toggleLike);

// ==================== 通知路由 ====================
router.get('/notifications', authenticate, NotificationController.getNotifications);
router.get('/notifications/unread-count', authenticate, NotificationController.getUnreadCount);
router.put('/notifications/:id/read', authenticate, NotificationController.markAsRead);
router.put('/notifications/read-all', authenticate, NotificationController.markAllAsRead);
router.delete('/notifications/:id', authenticate, NotificationController.deleteNotification);

// ==================== 用户路由 ====================
router.get('/users/:id', optionalAuth, UserController.getUserProfile);
router.get('/users/:id/topics', optionalAuth, UserController.getUserTopics);
router.get('/users/:id/comments', optionalAuth, UserController.getUserComments);
router.post('/users/:id/follow', authenticate, UserController.toggleFollow);
router.get('/users/:id/followers', UserController.getFollowers);
router.get('/users/:id/following', UserController.getFollowing);

// 我的内容
router.get('/me/topics', authenticate, UserController.getMyTopics);
router.get('/me/bookmarks', authenticate, UserController.getMyBookmarks);
router.get('/me/likes', authenticate, UserController.getMyLikes);

// ==================== 搜索路由 ====================
router.get('/search', optionalAuth, TopicController.getTopics); // 复用话题列表接口
router.get('/search/hot-tags', TopicController.getHotTags);

// ==================== 健康检查 ====================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'IEclub API is running',
    version: '2.0.0',
    timestamp: Date.now(),
  });
});

module.exports = router;
