// ==================== ieclub-backend/src/controllers/notificationController.js ====================
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
      const { page = 1, limit = 20, type, isRead } = req.query;
      const userId = req.userId;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = { userId };
      if (type) where.type = type;
      if (isRead !== undefined) where.isRead = isRead === 'true';

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.notification.count({ where }),
      ]);

      return response.paginated(res, notifications, {
        page: parseInt(page),
        limit: take,
        total,
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

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return response.success(res, { unreadCount });
    } catch (error) {
      logger.error('获取未读数量失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 标记单个通知为已读
   * PUT /api/v1/notifications/:id/read
   */
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        return response.notFound(res, '通知不存在');
      }

      await prisma.notification.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });

      return response.success(res, null, '标记成功');
    } catch (error) {
      logger.error('标记已读失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 标记所有通知为已读
   * PUT /api/v1/notifications/read-all
   */
  static async markAllAsRead(req, res) {
    try {
      const userId = req.userId;

      const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });

      return response.success(res, { count: result.count }, '全部标记成功');
    } catch (error) {
      logger.error('标记全部已读失败:', error);
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
        where: { id, userId },
      });

      if (!notification) {
        return response.notFound(res, '通知不存在');
      }

      await prisma.notification.delete({ where: { id } });

      return response.success(res, null, '删除成功');
    } catch (error) {
      logger.error('删除通知失败:', error);
      return response.serverError(res);
    }
  }
}

module.exports = NotificationController;

// ==================== ieclub-backend/src/controllers/userController.js ====================
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
        select: {
          id: true,
          nickname: true,
          avatar: true,
          gender: true,
          bio: true,
          skills: true,
          interests: true,
          level: true,
          credits: true,
          topicsCount: true,
          commentsCount: true,
          likesCount: true,
          fansCount: true,
          followsCount: true,
          isCertified: true,
          isVip: true,
          createdAt: true,
        },
      });

      if (!user) {
        return response.notFound(res, '用户不存在');
      }

      if (currentUserId) {
        const isFollowing = await prisma.follow.findFirst({
          where: {
            followerId: currentUserId,
            followingId: id,
          },
        });
        user.isFollowing = !!isFollowing;
      }

      return response.success(res, user);
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取用户话题列表
   * GET /api/v1/users/:id/topics
   */
  static async getUserTopics(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [topics, total] = await Promise.all([
        prisma.topic.findMany({
          where: {
            authorId: id,
            status: 'published',
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            author: {
              select: { id: true, nickname: true, avatar: true },
            },
          },
        }),
        prisma.topic.count({
          where: { authorId: id, status: 'published' },
        }),
      ]);

      return response.paginated(res, topics, {
        page: parseInt(page),
        limit: take,
        total,
      });
    } catch (error) {
      logger.error('获取用户话题失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取用户评论列表
   * GET /api/v1/users/:id/comments
   */
  static async getUserComments(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: {
            authorId: id,
            status: 'published',
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            author: {
              select: { id: true, nickname: true, avatar: true },
            },
            topic: {
              select: { id: true, title: true },
            },
          },
        }),
        prisma.comment.count({
          where: { authorId: id, status: 'published' },
        }),
      ]);

      return response.paginated(res, comments, {
        page: parseInt(page),
        limit: take,
        total,
      });
    } catch (error) {
      logger.error('获取用户评论失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 关注/取消关注用户
   * POST /api/v1/users/:id/follow
   */
  static async toggleFollow(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (id === userId) {
        return response.error(res, '不能关注自己');
      }

      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!targetUser) {
        return response.notFound(res, '用户不存在');
      }

      const existingFollow = await prisma.follow.findFirst({
        where: {
          followerId: userId,
          followingId: id,
        },
      });

      let isFollowing = false;

      if (existingFollow) {
        await prisma.$transaction([
          prisma.follow.delete({ where: { id: existingFollow.id } }),
          prisma.user.update({
            where: { id: userId },
            data: { followsCount: { decrement: 1 } },
          }),
          prisma.user.update({
            where: { id },
            data: { fansCount: { decrement: 1 } },
          }),
        ]);
      } else {
        await prisma.$transaction([
          prisma.follow.create({
            data: {
              followerId: userId,
              followingId: id,
            },
          }),
          prisma.user.update({
            where: { id: userId },
            data: { followsCount: { increment: 1 } },
          }),
          prisma.user.update({
            where: { id },
            data: { fansCount: { increment: 1 } },
          }),
        ]);
        isFollowing = true;

        await prisma.notification
          .create({
            data: {
              userId: id,
              type: 'follow',
              title: '新粉丝',
              content: '有人关注了你',
              actorId: userId,
              targetType: 'user',
              targetId: userId,
              link: `/pages/user-profile/index?id=${userId}`,
            },
          })
          .catch(() => {});
      }

      return response.success(
        res,
        { isFollowing },
        isFollowing ? '关注成功' : '已取消关注'
      );
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

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [follows, total] = await Promise.all([
        prisma.follow.findMany({
          where: { followingId: id },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            follower: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                bio: true,
                level: true,
                isCertified: true,
              },
            },
          },
        }),
        prisma.follow.count({ where: { followingId: id } }),
      ]);

      const followers = follows.map((f) => f.follower);

      return response.paginated(res, followers, {
        page: parseInt(page),
        limit: take,
        total,
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

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [follows, total] = await Promise.all([
        prisma.follow.findMany({
          where: { followerId: id },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            following: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                bio: true,
                level: true,
                isCertified: true,
              },
            },
          },
        }),
        prisma.follow.count({ where: { followerId: id } }),
      ]);

      const following = follows.map((f) => f.following);

      return response.paginated(res, following, {
        page: parseInt(page),
        limit: take,
        total,
      });
    } catch (error) {
      logger.error('获取关注列表失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取我的话题
   * GET /api/v1/me/topics
   */
  static async getMyTopics(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const userId = req.userId;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = { authorId: userId };
      if (status) where.status = status;

      const [topics, total] = await Promise.all([
        prisma.topic.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            author: {
              select: { id: true, nickname: true, avatar: true },
            },
          },
        }),
        prisma.topic.count({ where }),
      ]);

      return response.paginated(res, topics, {
        page: parseInt(page),
        limit: take,
        total,
      });
    } catch (error) {
      logger.error('获取我的话题失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取我的收藏
   * GET /api/v1/me/bookmarks
   */
  static async getMyBookmarks(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userId = req.userId;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [bookmarks, total] = await Promise.all([
        prisma.bookmark.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            topic: {
              include: {
                author: {
                  select: { id: true, nickname: true, avatar: true },
                },
              },
            },
          },
        }),
        prisma.bookmark.count({ where: { userId } }),
      ]);

      const topics = bookmarks.map((b) => ({
        ...b.topic,
        bookmarkedAt: b.createdAt,
      }));

      return response.paginated(res, topics, {
        page: parseInt(page),
        limit: take,
        total,
      });
    } catch (error) {
      logger.error('获取我的收藏失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取我的点赞
   * GET /api/v1/me/likes
   */
  static async getMyLikes(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userId = req.userId;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [likes, total] = await Promise.all([
        prisma.like.findMany({
          where: {
            userId,
            targetType: 'topic',
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.like.count({
          where: { userId, targetType: 'topic' },
        }),
      ]);

      const topicIds = likes.map((l) => l.targetId);
      const topics = await prisma.topic.findMany({
        where: { id: { in: topicIds } },
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      });

      const topicsWithLikeTime = topics.map((topic) => {
        const like = likes.find((l) => l.targetId === topic.id);
        return {
          ...topic,
          likedAt: like.createdAt,
        };
      });

      return response.paginated(res, topicsWithLikeTime, {
        page: parseInt(page),
        limit: take,
        total,
      });
    } catch (error) {
      logger.error('获取我的点赞失败:', error);
      return response.serverError(res);
    }
  }
}

module.exports = UserController;