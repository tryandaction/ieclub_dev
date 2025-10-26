// ==================== ieclub-backend/src/controllers/userController.js ====================

const { PrismaClient } = require('@prisma/client');
const response = require('../utils/response');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class UserController {
  /**
    * 获取用户列表
    * GET /api/users
    */
  static async getUsers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20,
        search = '',
        major = '',
        grade = '',
        skills = ''
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = {};

      // 搜索条件
      if (search) {
        where.OR = [
          { nickname: { contains: search } },
          { bio: { contains: search } }
        ];
      }

      if (major) {
        where.major = { contains: major };
      }

      if (grade) {
        where.grade = grade;
      }

      if (skills) {
        where.skills = { contains: skills };
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true,
            major: true,
            grade: true,
            skills: true,
            interests: true,
            verified: true,
            createdAt: true
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      return response.success(res, {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }, '获取用户列表成功');
    } catch (error) {
      logger.error('获取用户列表失败:', error);
      return response.error(res, '获取用户列表失败', 500);
    }
  }

  /**
    * 获取用户详细信息（增强版）
    * GET /api/v1/users/:id
    */
  static async getUserProfile(req, res) {
    try {
      const { id } = req.params;
      const {
        sortBy = 'latest', // latest, likes, hearts, popular
        filterType = 'all', // all, topics, projects, comments
        // major, // 专业筛选
        // skills, // 技能筛选
        // interests // 兴趣筛选
      } = req.query;

      // 获取用户基本信息
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
          verified: true,
          major: true,
          grade: true,
          skills: true,
          interests: true,
          website: true,
          github: true,
          createdAt: true,
          _count: {
            select: {
              topics: true,
              followers: true,
              following: true,
              ownedProjects: true
            }
          }
        }
      });

      if (!user) {
        return response.notFound(res, '用户不存在');
      }

      // 检查当前用户是否关注了该用户
      let isFollowing = false;
      if (req.userId && req.userId !== id) {
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: req.userId,
              followingId: id
            }
          }
        });
        isFollowing = !!follow;
      }

      // 构建内容查询条件
      const contentData = {};

      // 获取用户话题（支持排序和筛选）
      if (filterType === 'all' || filterType === 'topics') {
        const topicOrderBy =
          sortBy === 'latest' ? { createdAt: 'desc' } :
          sortBy === 'likes' ? [{ likes: { _count: 'desc' } }] :
          sortBy === 'hearts' ? [{ bookmarks: { _count: 'desc' } }] :
          sortBy === 'popular' ? { viewCount: 'desc' } :
          { createdAt: 'desc' };

        const topics = await prisma.topic.findMany({
          where: {
            authorId: id,
            status: 'published'
          },
          include: {
            _count: {
              select: {
                likes: true,
                bookmarks: true,
                comments: true,
                participants: true
              }
            }
          },
          orderBy: topicOrderBy,
          take: 20
        });

        contentData.topics = topics.map(topic => ({
          ...topic,
          likeCount: topic._count.likes,
          heartCount: topic._count.bookmarks,
          commentCount: topic._count.comments,
          participantCount: topic._count.participants
        }));
      }

      // 获取用户项目
      if (filterType === 'all' || filterType === 'projects') {
        const projectOrderBy =
          sortBy === 'latest' ? { createdAt: 'desc' } :
          sortBy === 'likes' ? [{ likes: { _count: 'desc' } }] :
          { createdAt: 'desc' };

        const projects = await prisma.project.findMany({
          where: { ownerId: id },
          include: {
            _count: {
              select: {
                members: true,
                likes: true
              }
            }
          },
          orderBy: projectOrderBy,
          take: 20
        });

        contentData.projects = projects.map(project => ({
          ...project,
          memberCount: project._count.members,
          likeCount: project._count.likes
        }));
      }

      // 获取用户评论
      if (filterType === 'all' || filterType === 'comments') {
        const comments = await prisma.comment.findMany({
          where: { authorId: id },
          include: {
            topic: {
              select: {
                id: true,
                title: true,
                cover: true
              }
            },
            _count: {
              select: {
                likes: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        });

        contentData.comments = comments.map(comment => ({
          ...comment,
          likeCount: comment._count.likes
        }));
      }

      return response.success(res, {
        user: {
          ...user,
          topicCount: user._count.topics,
          followerCount: user._count.followers,
          followingCount: user._count.following,
          projectCount: user._count.ownedProjects
        },
        isFollowing,
        content: contentData
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

  /**
   * 更新用户资料
   * PUT /api/v1/users/:id
   */
  static async updateUserProfile(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const {
        nickname,
        bio,
        major,
        grade,
        skills,
        interests,
        website,
        github,
        avatar
      } = req.body;

      // 检查用户权限
      if (userId !== id) {
        return response.forbidden(res, '无权限修改其他用户资料');
      }

      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return response.notFound(res, '用户不存在');
      }

      // 更新用户资料
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(nickname && { nickname }),
          ...(bio !== undefined && { bio }),
          ...(major && { major }),
          ...(grade && { grade }),
          ...(skills && { skills }),
          ...(interests && { interests }),
          ...(website && { website }),
          ...(github && { github }),
          ...(avatar && { avatar })
        },
        select: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
          verified: true,
          major: true,
          grade: true,
          skills: true,
          interests: true,
          website: true,
          github: true,
          updatedAt: true
        }
      });

      return response.success(res, updatedUser, '用户资料更新成功');
    } catch (error) {
      logger.error('更新用户资料失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 点赞用户
   * POST /api/v1/users/:id/like
   */
  static async likeUser(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (userId === id) {
        return response.error(res, '不能给自己点赞');
      }

      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return response.notFound(res, '用户不存在');
      }

      // 检查是否已点赞
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_targetId_targetType: {
            userId,
            targetId: id,
            targetType: 'user'
          }
        }
      });

      if (existingLike) {
        // 已点赞，执行取消点赞
        await prisma.like.delete({
          where: {
            userId_targetId_targetType: {
              userId,
              targetId: id,
              targetType: 'user'
            }
          }
        });

        return response.success(res, { isLiked: false }, '已取消点赞');
      } else {
        // 未点赞，执行点赞
        await prisma.like.create({
          data: {
            userId,
            targetId: id,
            targetType: 'user'
          }
        });

        return response.success(res, { isLiked: true }, '点赞成功');
      }
    } catch (error) {
      logger.error('点赞操作失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 收藏用户
   * POST /api/v1/users/:id/heart
   */
  static async heartUser(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (userId === id) {
        return response.error(res, '不能收藏自己');
      }

      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return response.notFound(res, '用户不存在');
      }

      // 检查是否已收藏
      const existingHeart = await prisma.bookmark.findUnique({
        where: {
          userId_topicId: {
            userId,
            topicId: id
          }
        }
      });

      if (existingHeart) {
        // 已收藏，执行取消收藏
        await prisma.bookmark.delete({
          where: {
            userId_topicId: {
              userId,
              topicId: id
            }
          }
        });

        return response.success(res, { isHearted: false }, '已取消收藏');
      } else {
        // 未收藏，执行收藏
        await prisma.bookmark.create({
          data: {
            userId,
            topicId: id
          }
        });

        return response.success(res, { isHearted: true }, '收藏成功');
      }
    } catch (error) {
      logger.error('收藏操作失败:', error);
      return response.serverError(res);
    }
  }
}

module.exports = UserController;