// ==================== ieclub-backend/src/controllers/userController.js ====================

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

      // 获取话题详情
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