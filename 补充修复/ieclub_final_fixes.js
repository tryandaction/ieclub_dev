// ==================== 文件1: src/controllers/notificationController.js ====================
// 独立的通知控制器

const { PrismaClient } = require('@prisma/client');
const response = require('../utils/response');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class NotificationController {
  /**
   * 获取通知列表
   * GET /api/v1/notifications
   */
  static async getNotifications(req, res) {
    try {
      const { page = 1, limit = 20, type } = req.query;
      const userId = req.userId;

      const skip = (page - 1) * limit;

      const where = { receiverId: userId };
      if (type) {
        where.type = type;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.notification.count({ where }),
      ]);

      // 标记为已送达
      await prisma.notification.updateMany({
        where: {
          receiverId: userId,
          status: 'pending',
        },
        data: { status: 'delivered' },
      });

      return response.success(res, {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('获取通知列表失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取未读通知数量
   * GET /api/v1/notifications/unread-count
   */
  static async getUnreadCount(req, res) {
    try {
      const userId = req.userId;

      const count = await prisma.notification.count({
        where: {
          receiverId: userId,
          isRead: false,
        },
      });

      return response.success(res, { count });
    } catch (error) {
      logger.error('获取未读数量失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 标记通知为已读
   * PUT /api/v1/notifications/:id/read
   */
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const notification = await prisma.notification.findFirst({
        where: {
          id,
          receiverId: userId,
        },
      });

      if (!notification) {
        return response.notFound(res, '通知不存在');
      }

      await prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return response.success(res, null, '已标记为已读');
    } catch (error) {
      logger.error('标记已读失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 全部标记为已读
   * PUT /api/v1/notifications/read-all
   */
  static async markAllAsRead(req, res) {
    try {
      const userId = req.userId;

      await prisma.notification.updateMany({
        where: {
          receiverId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return response.success(res, null, '已全部标记为已读');
    } catch (error) {
      logger.error('全部标记已读失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 删除通知
   * DELETE /api/v1/notifications/:id
   */
  static async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const notification = await prisma.notification.findFirst({
        where: {
          id,
          receiverId: userId,
        },
      });

      if (!notification) {
        return response.notFound(res, '通知不存在');
      }

      await prisma.notification.delete({
        where: { id },
      });

      return response.success(res, null, '删除成功');
    } catch (error) {
      logger.error('删除通知失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 创建系统通知（管理员使用）
   * POST /api/v1/notifications/system
   */
  static async createSystemNotification(req, res) {
    try {
      const { title, content, targetUsers } = req.body;

      if (!title || !content) {
        return response.error(res, '标题和内容不能为空');
      }

      // 如果targetUsers为空，发送给所有用户
      let userIds = targetUsers;
      if (!userIds || userIds.length === 0) {
        const users = await prisma.user.findMany({
          select: { id: true },
        });
        userIds = users.map((u) => u.id);
      }

      // 批量创建通知
      const notifications = userIds.map((userId) => ({
        type: 'system',
        receiverId: userId,
        title,
        content,
        status: 'pending',
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      logger.info('系统通知创建成功:', { title, count: userIds.length });

      return response.success(res, null, `已发送给 ${userIds.length} 位用户`);
    } catch (error) {
      logger.error('创建系统通知失败:', error);
      return response.serverError(res);
    }
  }
}

module.exports = NotificationController;


// ==================== 文件2: src/controllers/userController.js ====================
// 独立的用户控制器

const { PrismaClient } = require('@prisma/client');
const response = require('../utils/response');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class UserController {
  /**
   * 获取用户信息
   * GET /api/v1/users/:id
   */
  static async getUserProfile(req, res) {
    try {
      const { id } = req.params;
      const currentUserId = req.userId;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              topics: true,
              comments: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      if (!user) {
        return response.notFound(res, '用户不存在');
      }

      // 检查是否关注
      let isFollowing = false;
      if (currentUserId && currentUserId !== id) {
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: id,
            },
          },
        });
        isFollowing = !!follow;
      }

      // 不返回敏感信息
      const { openid, phone, email, ...safeUser } = user;

      return response.success(res, {
        ...safeUser,
        isFollowing,
        stats: {
          topics: user._count.topics,
          comments: user._count.comments,
          followers: user._count.followers,
          following: user._count.following,
        },
      });
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取用户发布的话题
   * GET /api/v1/users/:id/topics
   */
  static async getUserTopics(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (page - 1) * limit;

      const [topics, total] = await Promise.all([
        prisma.topic.findMany({
          where: { authorId: id },
          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
                bookmarks: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.topic.count({ where: { authorId: id } }),
      ]);

      return response.success(res, {
        topics,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('获取用户话题失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 关注用户
   * POST /api/v1/users/:id/follow
   */
  static async followUser(req, res) {
    try {
      const { id } = req.params; // 被关注者ID
      const followerId = req.userId; // 关注者ID

      if (followerId === id) {
        return response.error(res, '不能关注自己');
      }

      // 检查被关注用户是否存在
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        return response.notFound(res, '用户不存在');
      }

      // 检查是否已关注
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId: id,
          },
        },
      });

      if (existingFollow) {
        // 已关注，执行取消关注
        await prisma.follow.delete({
          where: {
            followerId_followingId: {
              followerId,
              followingId: id,
            },
          },
        });

        return response.success(res, { isFollowing: false }, '已取消关注');
      } else {
        // 未关注，执行关注
        await prisma.follow.create({
          data: {
            followerId,
            followingId: id,
          },
        });

        // 创建通知
        await prisma.notification.create({
          data: {
            type: 'follow',
            senderId: followerId,
            receiverId: id,
            content: '关注了你',
            status: 'pending',
          },
        });

        return response.success(res, { isFollowing: true }, '关注成功');
      }
    } catch (error) {
      logger.error('关注操作失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取粉丝列表
   * GET /api/v1/users/:id/followers
   */
  static async getFollowers(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (page - 1) * limit;

      const [followers, total] = await Promise.all([
        prisma.follow.findMany({
          where: { followingId: id },
          include: {
            follower: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                bio: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.follow.count({ where: { followingId: id } }),
      ]);

      const followerList = followers.map((f) => f.follower);

      return response.success(res, {
        followers: followerList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('获取粉丝列表失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取关注列表
   * GET /api/v1/users/:id/following
   */
  static async getFollowing(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (page - 1) * limit;

      const [following, total] = await Promise.all([
        prisma.follow.findMany({
          where: { followerId: id },
          include: {
            following: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                bio: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.follow.count({ where: { followerId: id } }),
      ]);

      const followingList = following.map((f) => f.following);

      return response.success(res, {
        following: followingList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('获取关注列表失败:', error);
      return response.serverError(res);
    }
  }
}

module.exports = UserController;


// ==================== 文件3: 修复后的 src/routes/index.js ====================
const express = require('express');
const router = express.Router();

// ✅ 正确导入所有控制器
const AuthController = require('../controllers/authController');
const TopicController = require('../controllers/topicController');
const CommentController = require('../controllers/commentController');
const UploadController = require('../controllers/uploadController');
const NotificationController = require('../controllers/notificationController'); // ✅ 独立导入
const UserController = require('../controllers/userController'); // ✅ 独立导入

// 导入中间件
const { authenticate, optionalAuth, refreshToken } = require('../middleware/auth');
const {
  uploadMultipleImages,
  uploadMultipleDocuments,
  handleUploadError,
} = require('../middleware/upload');

// ==================== 健康检查 ====================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'IEclub API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ==================== 认证路由 ====================
router.post('/auth/wechat-login', AuthController.wechatLogin);
router.post('/auth/refresh-token', refreshToken);
router.get('/auth/me', authenticate, AuthController.getCurrentUser);
router.put('/auth/profile', authenticate, AuthController.updateProfile);
router.post('/auth/logout', authenticate, AuthController.logout);
router.post('/auth/daily-checkin', authenticate, AuthController.dailyCheckin);

// ==================== 文件上传路由 ====================
router.post('/upload/images', authenticate, uploadMultipleImages, handleUploadError, UploadController.uploadImages);
router.post('/upload/documents', authenticate, uploadMultipleDocuments, handleUploadError, UploadController.uploadDocuments);
router.post('/upload/link-preview', authenticate, UploadController.getLinkPreview);

// ==================== 话题路由 ====================
router.get('/topics', optionalAuth, TopicController.getTopics);
router.get('/topics/recommend', optionalAuth, TopicController.getRecommendTopics);
router.get('/topics/trending', TopicController.getTrendingTopics);
router.post('/topics', authenticate, TopicController.createTopic);
router.get('/topics/:id', optionalAuth, TopicController.getTopicDetail);
router.put('/topics/:id', authenticate, TopicController.updateTopic);
router.delete('/topics/:id', authenticate, TopicController.deleteTopic);
router.post('/topics/:id/like', authenticate, TopicController.likeTopic);
router.post('/topics/:id/bookmark', authenticate, TopicController.bookmarkTopic);
router.post('/topics/:id/quick-action', authenticate, TopicController.quickAction);
router.get('/topics/:id/matches', authenticate, TopicController.getMatches);

// ==================== 评论路由 ====================
router.get('/topics/:topicId/comments', optionalAuth, CommentController.getComments);
router.post('/topics/:topicId/comments', authenticate, CommentController.createComment);
router.put('/comments/:id', authenticate, CommentController.updateComment);
router.delete('/comments/:id', authenticate, CommentController.deleteComment);
router.post('/comments/:id/like', authenticate, CommentController.likeComment);

// ==================== 通知路由 ====================
router.get('/notifications', authenticate, NotificationController.getNotifications);
router.get('/notifications/unread-count', authenticate, NotificationController.getUnreadCount);
router.put('/notifications/:id/read', authenticate, NotificationController.markAsRead);
router.put('/notifications/read-all', authenticate, NotificationController.markAllAsRead);
router.delete('/notifications/:id', authenticate, NotificationController.deleteNotification);
router.post('/notifications/system', authenticate, NotificationController.createSystemNotification);

// ==================== 用户路由 ====================
router.get('/users/:id', optionalAuth, UserController.getUserProfile);
router.get('/users/:id/topics', UserController.getUserTopics);
router.post('/users/:id/follow', authenticate, UserController.followUser);
router.get('/users/:id/followers', UserController.getFollowers);
router.get('/users/:id/following', UserController.getFollowing);

// ==================== 搜索路由（待实现） ====================
router.get('/search/topics', optionalAuth, (req, res) => {
  res.json({ success: true, message: '搜索功能开发中' });
});

router.get('/search/users', optionalAuth, (req, res) => {
  res.json({ success: true, message: '搜索功能开发中' });
});

module.exports = router;