// ===== routes/index.js - 路由配置（完整版）=====
const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const topicController = require('../controllers/topicController');
const commentController = require('../controllers/commentController');
const UserController = require('../controllers/userController');
const searchController = require('../controllers/searchController');
const notificationController = require('../controllers/notificationController');
// const communityController = require('../controllers/communityController');
const uploadController = require('../controllers/uploadController');
const announcementController = require('../controllers/announcementController');
const LocalUploadService = require('../services/localUploadService');

const { authenticate } = require('../middleware/auth');

// 创建控制器实例
const authControllerInstance = new AuthController();
const userControllerInstance = new UserController();

// ===== 认证路由 =====
router.post('/auth/send-code', AuthController.sendVerifyCode);
router.post('/auth/verify-code', AuthController.verifyCode);
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/forgot-password', AuthController.forgotPassword);
router.post('/auth/reset-password', AuthController.resetPassword);
router.get('/auth/profile', authenticate, authControllerInstance.getProfile.bind(authControllerInstance));

// ===== 话题路由 =====
router.get('/topics', topicController.getTopics);

// 添加测试路由
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API连接正常',
    timestamp: new Date().toISOString(),
    data: {
      topics: [
        {
          id: '1',
          title: '测试话题1',
          cover: null,
          author: { nickname: '测试用户', avatar: null },
          likesCount: 10,
          commentsCount: 5
        },
        {
          id: '2',
          title: '测试话题2',
          cover: null,
          author: { nickname: '测试用户2', avatar: null },
          likesCount: 8,
          commentsCount: 3
        }
      ]
    }
  });
});
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
router.get('/users', UserController.getUsers);
router.get('/users/search', searchController.searchUsers);
router.get('/users/:id', UserController.getUserProfile);
router.put('/users/:id', authenticate, UserController.updateUserProfile);
router.post('/users/:id/follow', authenticate, UserController.followUser);
router.get('/users/:id/following', UserController.getFollowing);
router.get('/users/:id/followers', UserController.getFollowers);
router.post('/users/:id/like', authenticate, UserController.likeUser);
router.post('/users/:id/heart', authenticate, UserController.heartUser);

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

// ===== 公告路由 =====
router.get('/announcements', announcementController.getAnnouncements);
router.get('/announcements/:id', announcementController.getAnnouncementDetail);
router.put('/announcements/:id/read', authenticate, announcementController.markAsRead);

module.exports = router;