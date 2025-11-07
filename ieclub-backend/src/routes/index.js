// src/routes/index.js - 优化后的路由配置
// 包含速率限制、请求日志、性能监控

const express = require('express');
const router = express.Router();

// 控制器
const AuthController = require('../controllers/authController');
const topicController = require('../controllers/topicController');
const commentController = require('../controllers/commentController');
const UserController = require('../controllers/userController');
const searchController = require('../controllers/searchController');
const uploadController = require('../controllers/uploadController');
const announcementController = require('../controllers/announcementController');
const errorReportController = require('../controllers/errorReportController');
const LocalUploadService = require('../services/localUploadService');

// 中间件
const { authenticate } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { rateLimiters } = require('../middleware/rateLimiter');
const { requestLogger } = require('../middleware/requestLogger');
const { performanceMiddleware } = require('../utils/performanceMonitor');

// ==================== 全局中间件 ====================
// 请求日志（记录所有请求）
router.use(requestLogger());

// 性能监控（记录响应时间）
router.use(performanceMiddleware());

// ==================== CSRF Token获取 ====================
// 获取CSRF Token（公开接口）- 前端必须先调用此接口才能调用需要CSRF保护的接口
const { getCsrfToken } = require('../middleware/csrf');
router.get('/auth/csrf-token', getCsrfToken);

// ==================== CSRF 保护配置 ====================
// 不需要CSRF保护的认证接口（公开接口、只读操作）
const csrfIgnorePaths = [
  '^/auth/login$',              // 密码登录（使用其他安全措施）
  '^/auth/wechat-login$',       // 微信登录
  '^/auth/send-verify-code$'    // 发送验证码（有频率限制）
];

const csrf = csrfProtection({ ignorePaths: csrfIgnorePaths });

// ==================== Authentication Routes ====================
// 发送验证码（严格限制，无需CSRF）
router.post('/auth/send-verify-code', 
  rateLimiters.auth, 
  AuthController.sendVerifyCode
);

// 验证验证码（严格限制，无需CSRF - 改为公开接口供测试使用）
router.post('/auth/verify-code', 
  rateLimiters.auth, 
  AuthController.verifyCode
);

// 注册（严格限制，无需CSRF - 新用户没有session）
router.post('/auth/register', 
  rateLimiters.auth, 
  AuthController.register
);

// 密码登录（严格限制，无需CSRF）
router.post('/auth/login', 
  rateLimiters.auth, 
  AuthController.login
);

// 验证码登录（严格限制，无需CSRF - 验证码本身就是验证）
router.post('/auth/login-with-code', 
  rateLimiters.auth, 
  AuthController.loginWithCode
);

// 忘记密码（严格限制，需要CSRF）
router.post('/auth/forgot-password', 
  rateLimiters.auth, 
  csrf, 
  AuthController.forgotPassword
);

// 重置密码（严格限制，需要CSRF）
router.post('/auth/reset-password', 
  rateLimiters.auth, 
  csrf, 
  AuthController.resetPassword
);

// 获取个人信息（API限制）
router.get('/auth/profile', 
  authenticate, 
  rateLimiters.api, 
  AuthController.getProfile
);

// 更新个人信息（API限制）
router.put('/auth/profile', 
  authenticate, 
  rateLimiters.api, 
  csrf, 
  AuthController.updateProfile
);

// 修改密码（API限制）
router.put('/auth/change-password', 
  authenticate, 
  rateLimiters.api, 
  csrf, 
  AuthController.changePassword
);

// 绑定微信（API限制）
router.post('/auth/bind-wechat', 
  authenticate, 
  rateLimiters.api, 
  csrf, 
  AuthController.bindWechat
);

// 发送手机验证码（严格限制）
router.post('/auth/send-phone-code', 
  rateLimiters.auth, 
  AuthController.sendPhoneCode
);

// 绑定手机（API限制）
router.post('/auth/bind-phone', 
  authenticate, 
  rateLimiters.api, 
  csrf, 
  AuthController.bindPhone
);

// 手机号登录（严格限制，无需CSRF）
router.post('/auth/login-with-phone', 
  rateLimiters.auth, 
  AuthController.loginWithPhone
);

// 解绑手机（API限制）
router.post('/auth/unbind-phone', 
  authenticate, 
  rateLimiters.api, 
  csrf, 
  AuthController.unbindPhone
);

// 解绑微信（API限制）
router.post('/auth/unbind-wechat', 
  authenticate, 
  rateLimiters.api, 
  csrf, 
  AuthController.unbindWechat
);

// 注销账号（严格限制）
router.delete('/auth/account', 
  authenticate, 
  rateLimiters.auth, 
  csrf, 
  AuthController.deleteAccount
);

// 登出（API限制）
router.post('/auth/logout', 
  authenticate, 
  rateLimiters.api, 
  csrf, 
  AuthController.logout
);

// 微信登录（严格限制）
router.post('/auth/wechat-login', 
  rateLimiters.auth, 
  AuthController.wechatLogin
);

// ==================== Topic Routes ====================
// 获取话题列表（宽松限制）
router.get('/topics', 
  rateLimiters.api, 
  topicController.getTopics
);

// 获取话题详情（宽松限制）
router.get('/topics/:id', 
  rateLimiters.api, 
  topicController.getTopicDetail
);

// 创建话题（内容限制）
router.post('/topics', 
  authenticate, 
  rateLimiters.content, 
  csrf, 
  topicController.createTopic
);

// 更新话题（内容限制）
router.put('/topics/:id', 
  authenticate, 
  rateLimiters.content, 
  csrf, 
  topicController.updateTopic
);

// 删除话题（API限制）
router.delete('/topics/:id', 
  authenticate, 
  rateLimiters.api, 
  csrf, 
  topicController.deleteTopic
);

// 点赞话题（互动限制）
router.post('/topics/:id/like', 
  authenticate, 
  rateLimiters.interaction, 
  csrf, 
  topicController.toggleLike
);

// 收藏话题（互动限制）
router.post('/topics/:id/bookmark', 
  authenticate, 
  rateLimiters.interaction, 
  csrf, 
  topicController.toggleBookmark
);

// 快速操作（互动限制）
router.post('/topics/:id/quick-action', 
  authenticate, 
  rateLimiters.interaction, 
  csrf, 
  topicController.quickAction
);

// 推荐话题（宽松限制）
router.get('/topics/recommend', 
  rateLimiters.api, 
  topicController.getRecommendTopics
);

// 热门话题（宽松限制）
router.get('/topics/trending', 
  rateLimiters.api, 
  topicController.getTrendingTopics
);

// 匹配话题（API限制）
router.get('/topics/:id/matches', 
  rateLimiters.api, 
  topicController.getMatches
);

// ==================== Comment Routes ====================
// 获取评论列表（宽松限制）
router.get('/topics/:topicId/comments', 
  rateLimiters.api, 
  commentController.getComments
);

// 获取回复列表（宽松限制）
router.get('/comments/:commentId/replies', 
  rateLimiters.api, 
  commentController.getReplies
);

// 创建评论（内容限制）
router.post('/comments', 
  authenticate, 
  rateLimiters.content, 
  csrf, 
  commentController.createComment
);

// 点赞评论（互动限制）
router.post('/comments/:id/like', 
  authenticate, 
  rateLimiters.interaction, 
  csrf, 
  commentController.likeComment
);

// 删除评论（API限制）
router.delete('/comments/:id', 
  authenticate, 
  rateLimiters.api, 
  csrf, 
  commentController.deleteComment
);

// ==================== Post Routes ====================
router.use('/posts', require('./posts'));

// ==================== Profile Routes ====================
router.use('/profile', require('./profile'));

// ==================== User Routes ====================
// 获取用户列表（API限制）
router.get('/users', 
  rateLimiters.api, 
  UserController.getUsers
);

// 搜索用户（搜索限制）
router.get('/users/search', 
  rateLimiters.search, 
  searchController.searchUsers
);

// 获取用户信息（API限制）
router.get('/users/:id', 
  rateLimiters.api, 
  UserController.getUserProfile
);

// 更新用户信息（API限制）
router.put('/users/:id', 
  authenticate, 
  rateLimiters.api, 
  UserController.updateUserProfile
);

// 关注用户（互动限制）
router.post('/users/:id/follow', 
  authenticate, 
  rateLimiters.interaction, 
  UserController.followUser
);

// 获取关注列表（API限制）
router.get('/users/:id/following', 
  rateLimiters.api, 
  UserController.getFollowing
);

// 获取粉丝列表（API限制）
router.get('/users/:id/followers', 
  rateLimiters.api, 
  UserController.getFollowers
);

// 点赞用户（互动限制）
router.post('/users/:id/like', 
  authenticate, 
  rateLimiters.interaction, 
  UserController.likeUser
);

// 送心用户（互动限制）
router.post('/users/:id/heart', 
  authenticate, 
  rateLimiters.interaction, 
  UserController.heartUser
);

// ==================== Search Routes ====================
const searchControllerV2 = require('../controllers/searchControllerV2');

// 全局搜索（搜索限制）
router.get('/search', 
  rateLimiters.search, 
  searchControllerV2.globalSearch
);

// 搜索帖子（搜索限制）
router.get('/search/posts', 
  rateLimiters.search, 
  searchControllerV2.searchPosts
);

// 搜索话题（搜索限制）
router.get('/search/topics', 
  rateLimiters.search, 
  searchController.searchTopics
);

// 搜索用户（搜索限制）
router.get('/search/users', 
  rateLimiters.search, 
  searchController.searchUsers
);

// 搜索活动（搜索限制）
router.get('/search/activities', 
  rateLimiters.search, 
  searchControllerV2.searchActivities
);

// 热门关键词（API限制）
router.get('/search/hot-keywords', 
  rateLimiters.api, 
  searchController.getHotKeywords
);

// 搜索建议（搜索限制）
router.get('/search/suggestions', 
  rateLimiters.search, 
  searchControllerV2.getSuggestions
);

// 搜索历史（API限制）
router.get('/search/history', 
  authenticate, 
  rateLimiters.api, 
  searchControllerV2.getSearchHistory
);

// 清除搜索历史（API限制）
router.delete('/search/history', 
  authenticate, 
  rateLimiters.api, 
  searchControllerV2.clearSearchHistory
);

// 搜索建议（旧版）
router.get('/search/suggest', 
  rateLimiters.search, 
  searchController.getSuggestions
);

// ==================== Notification Routes ====================
router.use('/notifications', require('./notificationRoutes'));

// ==================== Upload Routes ====================
const uploadControllerV2 = require('../controllers/uploadControllerV2');

// 上传图片（上传限制）
router.post('/upload/images', 
  authenticate, 
  rateLimiters.upload, 
  LocalUploadService.getUploadMiddleware().array('images', 9), 
  uploadController.uploadImages
);

// 上传图片 V2（上传限制）
router.post('/upload/images-v2', 
  authenticate, 
  rateLimiters.upload, 
  LocalUploadService.getUploadMiddleware().array('images', 9), 
  uploadControllerV2.uploadImages
);

// 上传头像（上传限制）
router.post('/upload/avatar', 
  authenticate, 
  rateLimiters.upload, 
  LocalUploadService.getUploadMiddleware().single('avatar'), 
  uploadControllerV2.uploadAvatar
);

// 上传文档（上传限制）
router.post('/upload/documents', 
  authenticate, 
  rateLimiters.upload, 
  LocalUploadService.getUploadMiddleware().array('documents', 3), 
  uploadController.uploadDocuments
);

// 上传文档 V2（上传限制）
router.post('/upload/documents-v2', 
  authenticate, 
  rateLimiters.upload, 
  LocalUploadService.getUploadMiddleware().array('documents', 3), 
  uploadControllerV2.uploadDocuments
);

// 链接预览（API限制）
router.post('/upload/link-preview', 
  authenticate, 
  rateLimiters.api, 
  uploadController.getLinkPreview
);

// 删除文件（API限制）
router.delete('/upload/file', 
  authenticate, 
  rateLimiters.api, 
  uploadController.deleteFile
);

// 删除文件 V2（API限制）
router.delete('/upload/file-v2', 
  authenticate, 
  rateLimiters.api, 
  uploadControllerV2.deleteFile
);

// ==================== Community Routes ====================
router.use('/community', require('./community'));

// ==================== Activity Routes ====================
router.use('/activities', require('./activities'));

// ==================== Announcement Routes ====================
// 获取公告列表（API限制）
router.get('/announcements', 
  rateLimiters.api, 
  announcementController.getAnnouncements
);

// 获取公告详情（API限制）
router.get('/announcements/:id', 
  rateLimiters.api, 
  announcementController.getAnnouncementDetail
);

// 标记已读（API限制）
router.put('/announcements/:id/read', 
  authenticate, 
  rateLimiters.api, 
  announcementController.markAsRead
);

// ==================== Leaderboard Routes ====================
router.use('/leaderboard', require('./leaderboard'));

// ==================== Badge Routes ====================
router.use('/badges', require('./badges'));

// ==================== Stats Routes ====================
const statsControllerV2 = require('../controllers/statsControllerV2');
router.use('/stats', require('./stats'));

// 统计接口（API限制）
router.get('/stats-v2/platform', rateLimiters.api, statsControllerV2.getPlatformStats);
router.get('/stats-v2/user/:userId?', authenticate, rateLimiters.api, statsControllerV2.getUserStats);
router.get('/stats-v2/trend', rateLimiters.api, statsControllerV2.getContentTrend);
router.get('/stats-v2/hot', rateLimiters.api, statsControllerV2.getHotContent);
router.get('/stats-v2/behavior/:userId?', authenticate, rateLimiters.api, statsControllerV2.getUserBehaviorAnalysis);
router.get('/stats-v2/credits/:userId?', authenticate, rateLimiters.api, statsControllerV2.getCreditTrend);
router.get('/stats-v2/categories', rateLimiters.api, statsControllerV2.getCategoryStats);
router.get('/stats-v2/leaderboard', rateLimiters.api, statsControllerV2.getLeaderboard);
router.get('/stats-v2/dashboard', authenticate, rateLimiters.api, statsControllerV2.getMyDashboard);

// ==================== Feedback Routes ====================
router.use('/feedback', require('./feedback'));

// ==================== Admin Routes ====================
router.use('/admin', require('./admin'));

// ==================== Moderation Routes ====================
router.use('/moderation', require('./moderation'));

// ==================== Monitoring Routes ====================
router.use('/monitoring', require('./monitoring'));

// ==================== Credit Routes ====================
router.use('/credits', require('./credits'));

// ==================== Backup Routes ====================
router.use('/backup', require('./backup'));

// ==================== RBAC Routes ====================
router.use('/rbac', require('./rbac'));

// ==================== Error Report Routes ====================
// 报告错误（不需要认证，但有速率限制）
router.post('/errors/report', 
  rateLimiters.api, 
  errorReportController.reportError
);

// 错误统计（需要认证和API限制）
router.get('/errors/stats', 
  authenticate, 
  rateLimiters.api, 
  errorReportController.getErrorStats
);

// ==================== Health Check Routes ====================
router.use('/health', require('./health'));

// ==================== API Root Route ====================
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'IEClub API v2.0 - 企业级社区平台（优化版）',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    features: [
      '✅ 速率限制',
      '✅ 请求日志',
      '✅ 性能监控',
      '✅ CSRF 保护',
      '✅ 查询超时',
      '✅ 缓存优化'
    ],
    endpoints: {
      auth: 'POST /api/auth/login',
      topics: 'GET /api/topics',
      activities: 'GET /api/activities',
      users: 'GET /api/users',
      health: 'GET /api/health',
      docs: 'GET /api/docs'
    },
    documentation: 'https://docs.ieclub.online',
    support: 'support@ieclub.online'
  });
});

// ==================== API Documentation Route ====================
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'IEClub API Documentation v2.0',
    version: '2.0.0',
    optimizations: {
      rateLimiting: {
        auth: '60秒5次（严格限制）',
        api: '60秒30次（中等限制）',
        search: '60秒100次（宽松限制）',
        upload: '5分钟10次（上传限制）',
        content: '5分钟20次（内容限制）',
        interaction: '60秒50次（互动限制）'
      },
      caching: {
        search: '5分钟',
        admin: '5分钟',
        stats: '10分钟'
      },
      monitoring: {
        requestLogging: '所有请求',
        performanceTracking: '响应时间',
        errorTracking: '错误率'
      }
    },
    categories: {
      authentication: '认证授权',
      topics: '话题管理',
      activities: '活动管理',
      users: '用户管理',
      credits: '积分系统',
      search: '搜索功能'
    },
    fullDocumentation: 'https://docs.ieclub.online/api',
    postmanCollection: 'https://docs.ieclub.online/postman'
  });
});

// ==================== Test Route ====================
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'IEclub API is running (Optimized)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    memory: {
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    },
    optimizations: {
      rateLimiting: 'enabled',
      requestLogging: 'enabled',
      performanceMonitoring: 'enabled',
      csrfProtection: 'enabled',
      queryTimeout: 'enabled'
    }
  });
});

module.exports = router;
