// src/controllers/topicController.js
// 话题控制器 - 核心功能

const { PrismaClient } = require('@prisma/client');
const response = require('../utils/response');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const AlgorithmService = require('../services/algorithmService');
const WechatService = require('../services/wechatService');
const { CacheManager } = require('../utils/redis');
const config = require('../config');

const prisma = new PrismaClient();

class TopicController {
  /**
   * 获取话题列表（支持筛选、排序、分页）
   * GET /api/v1/topics
   */
  static async getTopics(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        topicType,
        sortBy = 'hot', // hot, new, trending
        tags,
        search,
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // 构建查询条件（只使用数据库中最基本的字段）
      const where = {};

      if (category) {
        where.category = category;
      }

      if (topicType) {
        where.topicType = topicType;
      }

      if (tags) {
        const tagArray = tags.split(',');
        where.OR = tagArray.map((tag) => ({
          tags: { contains: tag },
        }));
      }

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { content: { contains: search } },
        ];
      }

      // 构建排序（只使用数据库中最基本的字段）
      let orderBy = {};
      switch (sortBy) {
        case 'hot':
          orderBy = { likesCount: 'desc' };
          break;
        case 'new':
          orderBy = { createdAt: 'desc' };
          break;
        case 'trending':
          orderBy = { viewsCount: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }

      // 查询话题
      const [topics, total] = await Promise.all([
        prisma.topic.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                level: true,
                isCertified: true,
              },
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
      logger.error('获取话题列表失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取话题详情
   * GET /api/v1/topics/:id
   */
  static async getTopicDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId; // 可能为空（未登录）

      const topic = await prisma.topic.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              bio: true,
              level: true,
              isCertified: true,
              isVip: true,
            },
          },
        },
      });

      if (!topic) {
        throw new AppError('RESOURCE_NOT_FOUND', '话题不存在');
      }

      if (topic.status !== 'published') {
        // 只有作者可以查看未发布的话题
        if (!userId || userId !== topic.authorId) {
          throw new AppError('RESOURCE_FORBIDDEN', '该话题暂不可访问');
        }
      }

      // 增加浏览量
      await prisma.topic.update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      });

      // 记录用户行为
      if (userId) {
        await prisma.userAction.create({
          data: {
            userId,
            actionType: 'view',
            targetType: 'topic',
            targetId: id,
          },
        }).catch(() => {}); // 忽略错误，不影响主流程

        // 检查用户是否点赞/收藏
        const [liked, bookmarked] = await Promise.all([
          prisma.like.findFirst({
            where: { userId, targetType: 'topic', targetId: id },
          }),
          prisma.bookmark.findFirst({
            where: { userId, topicId: id },
          }),
        ]);

        topic.isLiked = !!liked;
        topic.isBookmarked = !!bookmarked;
      }

      // 获取快速操作统计
      if (topic.quickActions) {
        const quickActionStats = await Promise.all(
          topic.quickActions.map(async (action) => {
            const count = await prisma.topicQuickAction.count({
              where: {
                topicId: id,
                actionType: action.type,
              },
            });

            let userAction = false;
            if (userId) {
              userAction = await prisma.topicQuickAction.findFirst({
                where: {
                  topicId: id,
                  userId,
                  actionType: action.type,
                },
              });
            }

            return {
              ...action,
              count,
              userAction: !!userAction,
            };
          })
        );

        topic.quickActionStats = quickActionStats;
      }

      return response.success(res, topic);
    } catch (error) {
      logger.error('获取话题详情失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 创建话题
   * POST /api/v1/topics
   */
  static async createTopic(req, res) {
    try {
      const {
        title,
        content,
        contentType = 'text',
        category,
        topicType = 'discussion',
        images,
      } = req.body;

      // 验证必填字段
      if (!title || !content || !category) {
        throw new AppError('VALIDATION_REQUIRED_FIELD', '标题、内容和分类为必填项');
      }

      // 验证字段长度
      if (title.length < config.business.topic.titleMinLength) {
        throw new AppError('VALIDATION_INVALID_FORMAT', `标题至少 ${config.business.topic.titleMinLength} 个字符`);
      }

      if (title.length > config.business.topic.titleMaxLength) {
        throw new AppError('VALIDATION_INVALID_FORMAT', `标题最多 ${config.business.topic.titleMaxLength} 个字符`);
      }

      if (content.length < config.business.topic.contentMinLength) {
        throw new AppError('VALIDATION_INVALID_FORMAT', `内容至少 ${config.business.topic.contentMinLength} 个字符`);
      }

      // 内容安全检测
      const titleCheck = await WechatService.msgSecCheck(title);
      if (!titleCheck.pass) {
        throw new AppError('VALIDATION_INVALID_FORMAT', '标题包含敏感内容，请修改后重试');
      }

      const contentCheck = await WechatService.msgSecCheck(content);
      if (!contentCheck.pass) {
        throw new AppError('VALIDATION_INVALID_FORMAT', '内容包含敏感内容，请修改后重试');
      }


      // 创建话题（只使用数据库中最基本的字段）
      const topic = await prisma.topic.create({
        data: {
          authorId: req.userId,
          title,
          content,
          contentType,
          category,
          topicType,
          images,
          viewsCount: 0,
          likesCount: 0,
          commentsCount: 0,
          bookmarksCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastActiveAt: new Date(),
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      });

      // 更新用户话题数和积分
      await prisma.user.update({
        where: { id: req.userId },
        data: {
          topicsCount: { increment: 1 },
          credits: { increment: config.business.credits.topicCreate },
          exp: { increment: config.business.credits.topicCreate },
        },
      });

      // 清除相关缓存
      await CacheManager.delPattern(`ieclub:topics:*`);

      logger.info('创建话题:', { topicId: topic.id, userId: req.userId });

      return response.created(res, topic, '发布成功');
    } catch (error) {
      logger.error('创建话题失败:', error);
      return response.serverError(res, '发布失败');
    }
  }

  /**
   * 更新话题
   * PUT /api/v1/topics/:id
   */
  static async updateTopic(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 检查话题是否存在且属于当前用户
      const topic = await prisma.topic.findUnique({
        where: { id },
      });

      if (!topic) {
        return response.notFound(res, '话题不存在');
      }

      if (topic.authorId !== req.userId) {
        return response.forbidden(res, '无权修改此话题');
      }

      // 内容安全检测
      if (updateData.title) {
        const check = await WechatService.msgSecCheck(updateData.title);
        if (!check.pass) {
          return response.error(res, '标题包含敏感内容', 400);
        }
      }

      if (updateData.content) {
        const check = await WechatService.msgSecCheck(updateData.content);
        if (!check.pass) {
          return response.error(res, '内容包含敏感内容', 400);
        }
      }

      // 更新话题
      const updatedTopic = await prisma.topic.update({
        where: { id },
        data: updateData,
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      });

      // 清除缓存
      await CacheManager.del(CacheManager.makeKey('topic', id));

      return response.success(res, updatedTopic, '更新成功');
    } catch (error) {
      logger.error('更新话题失败:', error);
      return response.serverError(res, '更新失败');
    }
  }

  /**
   * 删除话题
   * DELETE /api/v1/topics/:id
   */
  static async deleteTopic(req, res) {
    try {
      const { id } = req.params;

      const topic = await prisma.topic.findUnique({
        where: { id },
      });

      if (!topic) {
        return response.notFound(res, '话题不存在');
      }

      if (topic.authorId !== req.userId) {
        return response.forbidden(res, '无权删除此话题');
      }

      // 软删除
      await prisma.topic.update({
        where: { id },
        data: { status: 'deleted' },
      });

      // 更新用户话题数
      await prisma.user.update({
        where: { id: req.userId },
        data: { topicsCount: { decrement: 1 } },
      });

      // 清除缓存
      await CacheManager.delPattern(`ieclub:topics:*`);

      return response.success(res, null, '删除成功');
    } catch (error) {
      logger.error('删除话题失败:', error);
      return response.serverError(res, '删除失败');
    }
  }

  /**
   * 点赞/取消点赞话题
   * POST /api/v1/topics/:id/like
   */
  static async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      // 检查话题是否存在
      const topic = await prisma.topic.findUnique({
        where: { id },
      });

      if (!topic || topic.status !== 'published') {
        return response.notFound(res, '话题不存在');
      }

      // 检查是否已点赞
      const existingLike = await prisma.like.findFirst({
        where: {
          userId,
          targetType: 'topic',
          targetId: id,
        },
      });

      let isLiked = false;
      let likesCount = topic.likesCount;

      if (existingLike) {
        // 取消点赞
        await prisma.$transaction([
          prisma.like.delete({
            where: { id: existingLike.id },
          }),
          prisma.topic.update({
            where: { id },
            data: { likesCount: { decrement: 1 } },
          }),
        ]);
        likesCount -= 1;
      } else {
        // 点赞
        await prisma.$transaction([
          prisma.like.create({
            data: {
              userId,
              targetType: 'topic',
              targetId: id,
            },
          }),
          prisma.topic.update({
            where: { id },
            data: { likesCount: { increment: 1 } },
          }),
        ]);
        likesCount += 1;
        isLiked = true;

        // 记录用户行为
        await prisma.userAction.create({
          data: {
            userId,
            actionType: 'like',
            targetType: 'topic',
            targetId: id,
          },
        }).catch(() => {});

        // 给作者发送通知（不是自己点赞自己）
        if (topic.authorId !== userId) {
          await prisma.notification.create({
            data: {
              userId: topic.authorId,
              type: 'like',
              title: '收到新点赞',
              content: '有人点赞了你的话题',
              actorId: userId,
              targetType: 'topic',
              targetId: id,
              link: `/pages/topic-detail/index?id=${id}`,
            },
          }).catch(() => {});
        }
      }

      return response.success(res, {
        isLiked,
        likesCount,
      }, isLiked ? '点赞成功' : '已取消点赞');
    } catch (error) {
      logger.error('点赞操作失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 收藏/取消收藏话题
   * POST /api/v1/topics/:id/bookmark
   */
  static async toggleBookmark(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const topic = await prisma.topic.findUnique({
        where: { id },
      });

      if (!topic || topic.status !== 'published') {
        return response.notFound(res, '话题不存在');
      }

      const existingBookmark = await prisma.bookmark.findFirst({
        where: { userId, topicId: id },
      });

      let isBookmarked = false;
      let bookmarksCount = topic.bookmarksCount;

      if (existingBookmark) {
        // 取消收藏
        await prisma.$transaction([
          prisma.bookmark.delete({
            where: { id: existingBookmark.id },
          }),
          prisma.topic.update({
            where: { id },
            data: { bookmarksCount: { decrement: 1 } },
          }),
        ]);
        bookmarksCount -= 1;
      } else {
        // 收藏
        await prisma.$transaction([
          prisma.bookmark.create({
            data: { userId, topicId: id },
          }),
          prisma.topic.update({
            where: { id },
            data: { bookmarksCount: { increment: 1 } },
          }),
        ]);
        bookmarksCount += 1;
        isBookmarked = true;

        // 记录行为
        await prisma.userAction.create({
          data: {
            userId,
            actionType: 'bookmark',
            targetType: 'topic',
            targetId: id,
          },
        }).catch(() => {});
      }

      return response.success(res, {
        isBookmarked,
        bookmarksCount,
      }, isBookmarked ? '收藏成功' : '已取消收藏');
    } catch (error) {
      logger.error('收藏操作失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 快速操作（想听、我来分享、想合作等）
   * POST /api/v1/topics/:id/quick-action
   */
  static async quickAction(req, res) {
    try {
      const { id } = req.params;
      const { actionType } = req.body; // interested, can_help, want_collab
      const userId = req.userId;

      if (!actionType) {
        return response.error(res, '缺少操作类型');
      }

      const topic = await prisma.topic.findUnique({
        where: { id },
      });

      if (!topic || topic.status !== 'published') {
        return response.notFound(res, '话题不存在');
      }

      // 检查是否已操作
      const existing = await prisma.topicQuickAction.findFirst({
        where: {
          topicId: id,
          userId,
          actionType,
        },
      });

      let userAction = false;

      if (existing) {
        // 取消操作
        await prisma.topicQuickAction.delete({
          where: { id: existing.id },
        });
      } else {
        // 新增操作
        await prisma.topicQuickAction.create({
          data: {
            topicId: id,
            userId,
            actionType,
          },
        });
        userAction = true;

        // 记录行为
        await prisma.userAction.create({
          data: {
            userId,
            actionType: 'click',
            targetType: 'topic',
            targetId: id,
            metadata: { quickAction: actionType },
          },
        }).catch(() => {});

        // 通知作者
        if (topic.authorId !== userId) {
          const actionLabels = {
            interested: '对你的话题感兴趣',
            can_help: '可以帮助你',
            want_collab: '想和你合作',
          };

          await prisma.notification.create({
            data: {
              userId: topic.authorId,
              type: 'match',
              title: '收到新互动',
              content: `有人${actionLabels[actionType] || '互动了'}`,
              actorId: userId,
              targetType: 'topic',
              targetId: id,
              link: `/pages/topic-detail/index?id=${id}`,
            },
          }).catch(() => {});
        }
      }

      // 获取最新统计
      const count = await prisma.topicQuickAction.count({
        where: {
          topicId: id,
          actionType,
        },
      });

      return response.success(res, {
        actionType,
        count,
        userAction,
      }, userAction ? '操作成功' : '已取消');
    } catch (error) {
      logger.error('快速操作失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取推荐话题
   * GET /api/v1/topics/recommend
   */
  static async getRecommendTopics(req, res) {
    try {
      const { limit = 20 } = req.query;
      const userId = req.userId;

      if (!userId) {
        // 未登录用户返回热门话题
        const hotTopics = await prisma.topic.findMany({
          where: { status: 'published', isHot: true },
          orderBy: { hotScore: 'desc' },
          take: parseInt(limit),
          include: {
            author: {
              select: { id: true, nickname: true, avatar: true },
            },
          },
        });

        return response.success(res, hotTopics);
      }

      // 已登录用户使用推荐算法
      const recommendedTopics = await AlgorithmService.recommendTopics(userId, parseInt(limit));

      return response.success(res, recommendedTopics);
    } catch (error) {
      logger.error('获取推荐话题失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取供需匹配推荐
   * GET /api/v1/topics/:id/matches
   */
  static async getMatches(req, res) {
    try {
      const { id } = req.params;
      const { limit = 10 } = req.query;

      const matches = await AlgorithmService.matchRecommendation(id, parseInt(limit));

      return response.success(res, matches);
    } catch (error) {
      logger.error('获取匹配推荐失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取趋势话题
   * GET /api/v1/topics/trending
   */
  static async getTrendingTopics(req, res) {
    try {
      const { limit = 10 } = req.query;

      const trendingTopics = await AlgorithmService.detectTrendingTopics(parseInt(limit));

      return response.success(res, trendingTopics);
    } catch (error) {
      logger.error('获取趋势话题失败:', error);
      return response.serverError(res);
    }
  }
}

module.exports = TopicController;