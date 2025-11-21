// src/controllers/topicController.js
// 话题控制器 - 核心功能

const response = require('../utils/response');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const AlgorithmService = require('../services/algorithmService');
const WechatService = require('../services/wechatService');
const creditService = require('../services/creditService');
const notificationService = require('../services/notificationService');
const websocketService = require('../services/websocketService');
const config = require('../config');
const prisma = require('../config/database');
const { withCache, buildKey } = require('../utils/cacheHelper');
const { validatePagination, validateId, validateRequired } = require('../utils/validationHelper');
const { canOperate } = require('../utils/permissionHelper');

class TopicController {
  /**
   * 获取话题列表（支持筛选、排序、分页）
   * GET /api/v1/topics
   */
  static async getTopics(req, res) {
    try {
      const {
        page: rawPage,
        limit: rawLimit,
        category,
        topicType,
        sortBy = 'hot',
        tags,
        search,
      } = req.query;

      // 使用验证工具统一分页参数
      const { page, pageSize } = validatePagination(rawPage, rawLimit, 100);
      const skip = (page - 1) * pageSize;
      const take = pageSize;

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

      // 优化查询：只选择需要的字段
      const [topics, total] = await Promise.all([
        prisma.topic.findMany({
          where,
          orderBy,
          skip,
          take,
          select: {
            id: true,
            title: true,
            content: true,
            summary: true,
            category: true,
            topicType: true,
            tags: true,
            images: true,
            viewsCount: true,
            likesCount: true,
            commentsCount: true,
            bookmarksCount: true,
            hotScore: true,
            createdAt: true,
            updatedAt: true,
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

      // 批量检查用户点赞和收藏状态（如果已登录）
      const userId = req.userId;
      let userLikes = new Set();
      let userBookmarks = new Set();
      
      if (userId && topics.length > 0) {
        const topicIds = topics.map(t => t.id);
        const [likes, bookmarks] = await Promise.all([
          prisma.like.findMany({
            where: { userId, targetType: 'topic', targetId: { in: topicIds } },
            select: { targetId: true }
          }),
          prisma.bookmark.findMany({
            where: { userId, topicId: { in: topicIds } },
            select: { topicId: true }
          })
        ]);
        
        userLikes = new Set(likes.map(l => l.targetId));
        userBookmarks = new Set(bookmarks.map(b => b.topicId));
      }

      // 添加用户状态
      const topicsWithUserStatus = topics.map(topic => ({
        ...topic,
        isLiked: userLikes.has(topic.id),
        isBookmarked: userBookmarks.has(topic.id)
      }));

      return response.paginated(res, topicsWithUserStatus, {
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

      // 检查话题是否已发布（使用publishedAt字段）
      if (!topic.publishedAt) {
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
        tags,
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

      // 内容安全检测（包装错误处理）
      try {
        const titleCheck = await WechatService.msgSecCheck(title);
        if (!titleCheck.pass) {
          throw new AppError('VALIDATION_INVALID_FORMAT', '标题包含敏感内容，请修改后重试');
        }

        const contentCheck = await WechatService.msgSecCheck(content);
        if (!contentCheck.pass) {
          throw new AppError('VALIDATION_INVALID_FORMAT', '内容包含敏感内容，请修改后重试');
        }
      } catch (secCheckError) {
        // 如果内容安全检测服务不可用，记录日志但继续发布
        logger.warn('内容安全检测失败，跳过检测:', secCheckError.message);
      }

      // 处理images和tags字段（确保是JSON字符串）
      let imagesJson = null;
      let tagsJson = null;

      if (images) {
        imagesJson = typeof images === 'string' ? images : JSON.stringify(images);
      }

      if (tags) {
        tagsJson = typeof tags === 'string' ? tags : JSON.stringify(tags);
      }

      // 创建话题（只使用数据库中存在的字段）
      const topic = await prisma.topic.create({
        data: {
          authorId: req.userId,
          title,
          content,
          contentType,
          category,
          topicType,
          images: imagesJson,
          tags: tagsJson,
          publishedAt: new Date(), // 设置发布时间表示已发布
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

      // 更新用户话题数（使用事务避免竞态条件）
      await prisma.user.update({
        where: { id: req.userId },
        data: {
          topicsCount: { increment: 1 },
        },
      }).catch(err => {
        logger.warn('更新用户话题数失败:', err.message);
      });

      // 添加积分和经验值（非关键操作，失败不影响发布）
      creditService.addCredits(req.userId, 'topic_create', {
        relatedType: 'topic',
        relatedId: topic.id,
        metadata: { title: topic.title, category: topic.category },
      }).catch(err => {
        logger.warn('添加积分失败:', err.message);
      });

      // 检查是否是第一个话题，授予勋章（非关键操作）
      prisma.topic.count({
        where: { authorId: req.userId, publishedAt: { not: null } },
      }).then(userTopicsCount => {
        if (userTopicsCount === 1) {
          creditService.awardBadge(req.userId, 'first_topic').catch(() => {});
        } else if (userTopicsCount === 10) {
          creditService.awardBadge(req.userId, 'prolific_writer').catch(() => {});
        } else if (userTopicsCount === 50) {
          creditService.awardBadge(req.userId, 'content_creator').catch(() => {});
        } else if (userTopicsCount === 100) {
          creditService.awardBadge(req.userId, 'topic_master').catch(() => {});
        }
      }).catch(err => {
        logger.warn('授予勋章失败:', err.message);
      });

      // 清除相关缓存（非关键操作）
      CacheManager.delPattern(`ieclub:topics:*`).catch(err => {
        logger.warn('清除缓存失败:', err.message);
      });

      logger.info('创建话题成功:', { topicId: topic.id, userId: req.userId, title: topic.title });

      return response.created(res, topic, '发布成功');
    } catch (error) {
      logger.error('创建话题失败:', { 
        error: error.message, 
        stack: error.stack,
        userId: req.userId,
        body: req.body 
      });
      
      // 根据错误类型返回不同的响应
      if (error instanceof AppError) {
        return response.error(res, error.message, 400);
      }
      
      return response.serverError(res, error.message || '发布失败');
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

      // 软删除（通过清除publishedAt实现）
      await prisma.topic.update({
        where: { id },
        data: { publishedAt: null },
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

      if (!topic || !topic.publishedAt) {
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

        // 给作者增加积分（不是自己点赞自己）
        if (topic.authorId !== userId) {
          // 给作者增加积分
          await creditService.addCredits(topic.authorId, 'like_received', {
            relatedType: 'topic',
            relatedId: id,
            metadata: { fromUserId: userId },
          }).catch(() => {});

          // 给点赞者增加经验值
          await creditService.addCredits(userId, 'like_given', {
            relatedType: 'topic',
            relatedId: id,
          }).catch(() => {});

          // 检查作者获得的点赞数，授予勋章
          const authorLikesCount = await prisma.like.count({
            where: {
              targetType: 'topic',
              topic: { authorId: topic.authorId },
            },
          });

          if (authorLikesCount === 100) {
            await creditService.awardBadge(topic.authorId, 'popular');
          } else if (authorLikesCount === 500) {
            await creditService.awardBadge(topic.authorId, 'star');
          } else if (authorLikesCount === 1000) {
            await creditService.awardBadge(topic.authorId, 'celebrity');
          }

          // 给作者发送通知（使用通知服务）
          const notification = await notificationService.createLikeNotification(
            topic.authorId,
            userId,
            'topic',
            id,
            topic.title
          ).catch(err => {
            logger.error('创建点赞通知失败:', err);
          });

          // WebSocket 实时推送通知
          if (notification) {
            websocketService.sendNotification(topic.authorId, notification);
          }
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

      if (!topic || !topic.publishedAt) {
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

      if (!topic || !topic.publishedAt) {
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
          where: { 
            publishedAt: { not: null }, 
            isHot: true 
          },
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