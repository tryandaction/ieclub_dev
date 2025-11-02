// backend/src/controllers/searchController.js
// 搜索控制器 - 支持话题、用户、全文搜索

const { PrismaClient } = require('@prisma/client');
const response = require('../utils/response');
const logger = require('../utils/logger');
const { getRedis } = require('../utils/redis');
const searchService = require('../services/searchService');

const redis = getRedis();
const prisma = require('../config/database');

class SearchController {
  /**
   * 搜索话题（全文搜索）
   * GET /api/v1/search/topics
   * Query参数：
   *   - q: 搜索关键词
   *   - category: 分类筛选
   *   - topicType: 话题类型筛选
   *   - tags: 标签筛选（逗号分隔）
   *   - sortBy: 排序方式（relevance/hot/new）
   *   - page: 页码
   *   - limit: 每页数量
   */
  static async searchTopics(req, res) {
    try {
      const {
        q,
        keyword: keywordParam,
        category,
        topicType,
        tags,
        sortBy = 'relevance',
        page = 1,
        limit = 20,
      } = req.query;

      // 支持 q 或 keyword 参数
      const searchKeyword = q || keywordParam;

      if (!searchKeyword || searchKeyword.trim().length === 0) {
        return response.error(res, '请输入搜索关键词');
      }

      const keyword = searchKeyword.trim();

      // 记录搜索历史（如果用户已登录）
      if (req.userId) {
        await this.saveSearchHistory(req.userId, keyword, 'topic');
      }

      // 尝试从缓存获取
      const cacheKey = `search:topics:${keyword}:${category}:${topicType}:${tags}:${sortBy}:${page}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info('搜索命中缓存', { keyword });
        return response.success(res, JSON.parse(cached));
      }

      const skip = (page - 1) * limit;

      // 构建搜索条件
      const where = {
        status: 'published',
        OR: [
          { title: { contains: keyword } },
          { content: { contains: keyword } },
        ],
      };

      // 分类筛选
      if (category) {
        where.category = category;
      }

      // 话题类型筛选
      if (topicType) {
        where.topicType = topicType;
      }

      // 标签筛选
      if (tags) {
        const tagArray = tags.split(',').map((t) => t.trim());
        // Prisma中JSON字段搜索需要特殊处理
        where.OR.push({
          tags: {
            hasSome: tagArray,
          },
        });
      }

      // 排序规则
      let orderBy = {};
      switch (sortBy) {
        case 'hot':
          orderBy = { likesCount: 'desc' };
          break;
        case 'new':
          orderBy = { createdAt: 'desc' };
          break;
        case 'relevance':
        default:
          // 相关度排序：标题匹配优先，然后按点赞数
          orderBy = [{ likesCount: 'desc' }, { createdAt: 'desc' }];
          break;
      }

      // 执行搜索
      const [topics, total] = await Promise.all([
        prisma.topic.findMany({
          where,
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
          orderBy,
          skip,
          take: parseInt(limit),
        }),
        prisma.topic.count({ where }),
      ]);

      // 高亮关键词
      const highlightedTopics = topics.map((topic) => ({
        ...topic,
        titleHighlight: this.highlightKeyword(topic.title, keyword),
        contentHighlight: this.highlightKeyword(
          topic.content.substring(0, 200),
          keyword
        ),
      }));

      const result = {
        topics: highlightedTopics,
        keyword,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      // 缓存结果（5分钟）
      await redis.setex(cacheKey, 300, JSON.stringify(result));

      logger.info('话题搜索完成', { keyword, total });
      return response.success(res, result);
    } catch (error) {
      logger.error('搜索话题失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 搜索用户
   * GET /api/v1/search/users
   * Query参数：
   *   - q: 搜索关键词（昵称、技能）
   *   - page: 页码
   *   - limit: 每页数量
   */
  static async searchUsers(req, res) {
    try {
      const { q, page = 1, limit = 20 } = req.query;

      if (!q || q.trim().length === 0) {
        return response.error(res, '请输入搜索关键词');
      }

      const keyword = q.trim();

      // 记录搜索历史
      if (req.userId) {
        await this.saveSearchHistory(req.userId, keyword, 'user');
      }

      const skip = (page - 1) * limit;

      // 构建搜索条件
      const where = {
        status: 'active',
        OR: [
          { nickname: { contains: keyword } },
          { bio: { contains: keyword } },
          // 技能搜索（JSON字段）
          {
            skills: {
              hasSome: [keyword],
            },
          },
        ],
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true,
            skills: true,
            interests: true,
            city: true,
            level: true,
            _count: {
              select: {
                topics: true,
                followers: true,
              },
            },
          },
          orderBy: [{ level: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: parseInt(limit),
        }),
        prisma.user.count({ where }),
      ]);

      // 检查当前用户是否关注了搜索结果中的用户
      let followingMap = {};
      if (req.userId) {
        const followings = await prisma.follow.findMany({
          where: {
            followerId: req.userId,
            followingId: { in: users.map((u) => u.id) },
          },
        });
        followingMap = followings.reduce((acc, f) => {
          acc[f.followingId] = true;
          return acc;
        }, {});
      }

      const usersWithFollowStatus = users.map((user) => ({
        ...user,
        isFollowing: followingMap[user.id] || false,
      }));

      logger.info('用户搜索完成', { keyword, total });

      return response.success(res, {
        users: usersWithFollowStatus,
        keyword,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('搜索用户失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取搜索建议
   * GET /api/v1/search/suggestions
   */
  static async getSearchSuggestions(req, res) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q) {
        // 返回热门搜索
        const popularSearches = await searchService.getPopularSearches(limit);
        return response.success(res, {
          suggestions: popularSearches,
          type: 'popular'
        });
      }

      // 智能纠错
      const correction = searchService.correctSpelling(q);
      
      // 获取搜索建议
      const suggestions = await searchService.getSearchSuggestions(q, limit);

      // 获取相关搜索
      const related = await searchService.getRelatedSearches(q, 5);

      return response.success(res, {
        keyword: q,
        correction: correction.corrected ? correction : null,
        suggestions,
        related,
        type: 'suggestions'
      });
    } catch (error) {
      logger.error('获取搜索建议失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取自动补全
   * GET /api/v1/search/autocomplete
   */
  static async getAutoComplete(req, res) {
    try {
      const { q, limit = 8 } = req.query;

      if (!q) {
        return response.success(res, { completions: [] });
      }

      const completions = await searchService.getAutoComplete(q, limit);

      return response.success(res, { completions });
    } catch (error) {
      logger.error('自动补全失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取用户搜索历史
   * GET /api/v1/search/history
   */
  static async getSearchHistory(req, res) {
    try {
      const userId = req.userId;
      const { limit = 10 } = req.query;

      if (!userId) {
        return response.success(res, { history: [] });
      }

      const history = await searchService.getUserSearchHistory(userId, limit);

      return response.success(res, { history });
    } catch (error) {
      logger.error('获取搜索历史失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 清除搜索历史
   * DELETE /api/v1/search/history
   */
  static async clearSearchHistory(req, res) {
    try {
      const userId = req.userId;

      if (!userId) {
        return response.error(res, '请先登录');
      }

      const success = await searchService.clearUserSearchHistory(userId);

      if (success) {
        return response.success(res, { message: '清除成功' });
      } else {
        return response.error(res, '清除失败');
      }
    } catch (error) {
      logger.error('清除搜索历史失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取热门搜索词
   * GET /api/v1/search/hot-keywords
   */
  static async getHotKeywords(req, res) {
    try {
      const { limit = 10 } = req.query;

      // 从Redis获取热门搜索词（按搜索次数排序）
      const hotKeywords = await redis.zrevrange(
        'search:hot_keywords',
        0,
        parseInt(limit) - 1,
        'WITHSCORES'
      );

      // 格式化结果 [keyword1, score1, keyword2, score2, ...]
      const keywords = [];
      for (let i = 0; i < hotKeywords.length; i += 2) {
        keywords.push({
          keyword: hotKeywords[i],
          count: parseInt(hotKeywords[i + 1]),
        });
      }

      return response.success(res, { keywords });
    } catch (error) {
      logger.error('获取热门搜索词失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 智能搜索建议（自动完成）
   * GET /api/v1/search/suggest
   * Query参数：
   *   - q: 输入的关键词前缀
   *   - type: 搜索类型（topic/user）
   */
  static async getSuggestions(req, res) {
    try {
      const { q, type = 'topic' } = req.query;

      if (!q || q.length < 2) {
        return response.success(res, { suggestions: [] });
      }

      const prefix = q.trim().toLowerCase();

      // 从Redis获取搜索建议（使用Sorted Set存储）
      const suggestions = await redis.zrangebylex(
        `search:suggest:${type}`,
        `[${prefix}`,
        `[${prefix}\xff`,
        'LIMIT',
        0,
        10
      );

      return response.success(res, { suggestions });
    } catch (error) {
      logger.error('获取搜索建议失败:', error);
      return response.serverError(res);
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 保存搜索历史
   */
  static async saveSearchHistory(userId, keyword, type) {
    try {
      const historyKey = `search:history:${userId}`;
      const hotKeywordsKey = 'search:hot_keywords';
      const suggestKey = `search:suggest:${type}`;

      const historyItem = JSON.stringify({
        keyword,
        type,
        timestamp: new Date().toISOString(),
      });

      // 保存到用户搜索历史（最多保存20条）
      await redis.lpush(historyKey, historyItem);
      await redis.ltrim(historyKey, 0, 19);

      // 更新热门搜索词（Sorted Set，按搜索次数排序）
      await redis.zincrby(hotKeywordsKey, 1, keyword);

      // 更新搜索建议（Sorted Set，用于前缀匹配）
      await redis.zadd(suggestKey, 0, keyword.toLowerCase());

      // 设置过期时间（热门搜索词30天，搜索历史7天）
      await redis.expire(hotKeywordsKey, 30 * 24 * 60 * 60);
      await redis.expire(historyKey, 7 * 24 * 60 * 60);
      await redis.expire(suggestKey, 30 * 24 * 60 * 60);
    } catch (error) {
      logger.error('保存搜索历史失败:', error);
      // 不影响主流程，只记录错误
    }
  }

  /**
   * 高亮关键词
   */
  static highlightKeyword(text, keyword) {
    if (!text || !keyword) return text;

    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}

module.exports = SearchController;