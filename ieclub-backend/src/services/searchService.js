// ieclub-backend/src/services/searchService.js
// 搜索服务 - 提供全局搜索功能（优化版）

const prisma = require('../config/database');
const logger = require('../utils/logger');
const { cacheGet, cacheSet } = require('../utils/redis-enhanced');

/**
 * 搜索配置
 */
const SEARCH_CONFIG = {
  defaultPageSize: 20,
  maxPageSize: 100,
  minKeywordLength: 2,
  maxKeywordLength: 100,
  excerptLength: 150,
  suggestionLimit: 10,
  hotKeywordsDays: 7,
  cacheTime: 300 // 5分钟
};

class SearchService {
  /**
   * 全局搜索（优化版）
   */
  async globalSearch(keyword, options = {}) {
    // 参数验证
    if (!keyword || keyword.length < SEARCH_CONFIG.minKeywordLength) {
      throw new Error('搜索关键词太短');
    }

    if (keyword.length > SEARCH_CONFIG.maxKeywordLength) {
      throw new Error('搜索关键词太长');
    }

    const {
      page = 1,
      pageSize = SEARCH_CONFIG.defaultPageSize,
      types = ['posts', 'users', 'activities']
    } = options;

    // 验证分页参数
    const validPageSize = Math.min(Math.max(1, pageSize), SEARCH_CONFIG.maxPageSize);
    const validPage = Math.max(1, page);

    // 尝试从缓存获取
    const cacheKey = `search:global:${keyword}:${validPage}:${validPageSize}:${types.join(',')}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.debug('搜索结果命中缓存', { keyword, types });
      return cached;
    }

    const results = {
      posts: [],
      users: [],
      activities: [],
      total: 0,
      keyword,
      timestamp: new Date()
    };

    // 构建搜索任务映射
    const searchTasks = new Map();
    if (types.includes('posts')) {
      searchTasks.set('posts', this.searchPosts(keyword, validPage, validPageSize));
    }
    if (types.includes('users')) {
      searchTasks.set('users', this.searchUsers(keyword, validPage, validPageSize));
    }
    if (types.includes('activities')) {
      searchTasks.set('activities', this.searchActivities(keyword, validPage, validPageSize));
    }

    // 并行执行搜索
    const searchResults = await Promise.allSettled(
      Array.from(searchTasks.values())
    );

    // 整合结果（使用 Map 保证顺序）
    let index = 0;
    for (const [type, _] of searchTasks) {
      const result = searchResults[index];
      if (result.status === 'fulfilled') {
        results[type] = result.value[type] || [];
        results.total += result.value.total || 0;
      } else {
        logger.error(`搜索${type}失败:`, result.reason);
        results[type] = [];
      }
      index++;
    }

    // 缓存结果
    await cacheSet(cacheKey, results, SEARCH_CONFIG.cacheTime);

    return results;
  }

  /**
   * 搜索帖子（优化版）
   */
  async searchPosts(keyword, page = 1, pageSize = SEARCH_CONFIG.defaultPageSize) {
    const skip = (page - 1) * pageSize;

    // 优化：使用全文搜索（如果数据库支持）
    const where = {
      publishedAt: { not: null },
      status: { not: 'deleted' },
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        { content: { contains: keyword, mode: 'insensitive' } }
      ]
    };

    try {
      const [posts, total] = await Promise.all([
        prisma.topic.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: [
            { likesCount: 'desc' },
            { createdAt: 'desc' }
          ],
          select: {
            id: true,
            title: true,
            content: true,
            tags: true,
            likesCount: true,
            commentsCount: true,
            viewsCount: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                level: true
              }
            },
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }),
        prisma.topic.count({ where })
      ]);

      return {
        posts: posts.map(post => ({
          id: post.id,
          title: post.title,
          excerpt: this.getExcerpt(post.content, keyword, SEARCH_CONFIG.excerptLength),
          tags: this._parseTags(post.tags),
          author: post.author,
          category: post.category,
          stats: {
            likes: post.likesCount,
            comments: post.commentsCount,
            views: post.viewsCount
          },
          createdAt: post.createdAt.toISOString()
        })),
        total,
        hasMore: skip + pageSize < total
      };
    } catch (error) {
      logger.error('搜索帖子失败:', error);
      throw error;
    }
  }

  /**
   * 搜索用户（优化版）
   */
  async searchUsers(keyword, page = 1, pageSize = SEARCH_CONFIG.defaultPageSize) {
    const skip = (page - 1) * pageSize;

    const where = {
      status: 'active',
      OR: [
        { nickname: { contains: keyword, mode: 'insensitive' } },
        { bio: { contains: keyword, mode: 'insensitive' } }
        // 注意：不搜索邮箱（隐私保护）
      ]
    };

    try {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: [
            { level: 'desc' },
            { credits: 'desc' }
          ],
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true,
            level: true,
            credits: true,
            topicsCount: true,
            commentsCount: true,
            likesCount: true,
            fansCount: true
          }
        }),
        prisma.user.count({ where })
      ]);

      return {
        users: users.map(user => ({
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          bio: user.bio || '',
          level: user.level,
          credits: user.credits,
          stats: {
            topics: user.topicsCount || 0,
            comments: user.commentsCount || 0,
            likes: user.likesCount || 0,
            fans: user.fansCount || 0
          }
        })),
        total,
        hasMore: skip + pageSize < total
      };
    } catch (error) {
      logger.error('搜索用户失败:', error);
      throw error;
    }
  }

  /**
   * 搜索活动（优化版）
   */
  async searchActivities(keyword, page = 1, pageSize = SEARCH_CONFIG.defaultPageSize) {
    const skip = (page - 1) * pageSize;

    const where = {
      status: 'published',
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { location: { contains: keyword, mode: 'insensitive' } }
      ]
    };

    try {
      const [activities, total] = await Promise.all([
        prisma.activity.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: [{ startTime: 'asc' }],
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            startTime: true,
            endTime: true,
            maxParticipants: true,
            organizer: {
              select: {
                id: true,
                nickname: true,
                avatar: true
              }
            },
            category: {
              select: {
                id: true,
                name: true
              }
            },
            _count: {
              select: {
                participants: true
              }
            }
          }
        }),
        prisma.activity.count({ where })
      ]);

      return {
        activities: activities.map(activity => ({
          id: activity.id,
          title: activity.title,
          excerpt: this.getExcerpt(activity.description, keyword, SEARCH_CONFIG.excerptLength),
          location: activity.location,
          time: {
            start: activity.startTime.toISOString(),
            end: activity.endTime.toISOString()
          },
          participants: {
            current: activity._count.participants,
            max: activity.maxParticipants
          },
          organizer: activity.organizer,
          category: activity.category
        })),
        total,
        hasMore: skip + pageSize < total
      };
    } catch (error) {
      logger.error('搜索活动失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门搜索关键词（优化版）
   */
  async getHotKeywords(limit = SEARCH_CONFIG.suggestionLimit) {
    const cacheKey = `search:hot:keywords:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await prisma.searchHistory.groupBy({
        by: ['keyword'],
        _count: {
          keyword: true
        },
        orderBy: {
          _count: {
            keyword: 'desc'
          }
        },
        take: limit,
        where: {
          createdAt: {
            gte: new Date(Date.now() - SEARCH_CONFIG.hotKeywordsDays * 24 * 60 * 60 * 1000)
          }
        }
      });

      const keywords = result.map(item => ({
        keyword: item.keyword,
        count: item._count.keyword
      }));

      // 缓存1小时
      await cacheSet(cacheKey, keywords, 3600);

      return keywords;
    } catch (error) {
      logger.error('获取热门关键词失败:', error);
      return [];
    }
  }

  /**
   * 保存搜索历史（异步，不阻塞主流程）
   */
  async saveSearchHistory(userId, keyword, resultType = null) {
    // 使用 setImmediate 异步执行，不阻塞主流程
    setImmediate(async () => {
      try {
        await prisma.searchHistory.create({
          data: {
            userId,
            keyword: keyword.substring(0, SEARCH_CONFIG.maxKeywordLength),
            resultType
          }
        });
      } catch (error) {
        logger.error('保存搜索历史失败:', error);
      }
    });
  }

  /**
   * 获取用户搜索历史（优化版）
   */
  async getUserSearchHistory(userId, limit = SEARCH_CONFIG.suggestionLimit) {
    try {
      // 使用子查询去重，保留最新的记录
      const history = await prisma.$queryRaw`
        SELECT DISTINCT ON (keyword) keyword, resultType, createdAt
        FROM search_history
        WHERE userId = ${userId}
        ORDER BY keyword, createdAt DESC
        LIMIT ${limit}
      `;

      return history;
    } catch (error) {
      logger.error('获取用户搜索历史失败:', error);
      return [];
    }
  }

  /**
   * 清空用户搜索历史
   */
  async clearSearchHistory(userId) {
    try {
      const result = await prisma.searchHistory.deleteMany({
        where: { userId }
      });

      logger.info('清空搜索历史', { userId, count: result.count });

      return { message: '清空成功', count: result.count };
    } catch (error) {
      logger.error('清空搜索历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取搜索建议（优化版）
   */
  async getSuggestions(keyword, limit = SEARCH_CONFIG.suggestionLimit) {
    if (!keyword || keyword.length < SEARCH_CONFIG.minKeywordLength) {
      return [];
    }

    const cacheKey = `search:suggestions:${keyword}:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 并行查询多个来源
      const [posts, users, activities] = await Promise.all([
        prisma.topic.findMany({
          where: {
            publishedAt: { not: null },
            status: { not: 'deleted' },
            title: { contains: keyword, mode: 'insensitive' }
          },
          take: limit,
          select: { title: true },
          orderBy: [
            { likesCount: 'desc' },
            { viewsCount: 'desc' }
          ]
        }),
        prisma.user.findMany({
          where: {
            status: 'active',
            nickname: { contains: keyword, mode: 'insensitive' }
          },
          take: limit,
          select: { nickname: true },
          orderBy: [{ level: 'desc' }]
        }),
        prisma.activity.findMany({
          where: {
            status: 'published',
            title: { contains: keyword, mode: 'insensitive' }
          },
          take: limit,
          select: { title: true },
          orderBy: [{ participantsCount: 'desc' }]
        })
      ]);

      // 合并去重
      const suggestions = new Set();
      posts.forEach(p => suggestions.add(p.title));
      users.forEach(u => suggestions.add(u.nickname));
      activities.forEach(a => suggestions.add(a.title));

      const result = Array.from(suggestions).slice(0, limit);

      // 缓存10分钟
      await cacheSet(cacheKey, result, 600);

      return result;
    } catch (error) {
      logger.error('获取搜索建议失败:', error);
      return [];
    }
  }

  /**
   * 获取内容摘要（高亮关键词）
   */
  getExcerpt(content, keyword, maxLength = SEARCH_CONFIG.excerptLength) {
    if (!content) return '';

    // 移除 HTML 标签
    const plainText = content.replace(/<[^>]*>/g, '');

    const lowerContent = plainText.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const keywordIndex = lowerContent.indexOf(lowerKeyword);

    if (keywordIndex === -1) {
      // 如果没找到关键词，返回开头部分
      return plainText.substring(0, maxLength) + (plainText.length > maxLength ? '...' : '');
    }

    // 以关键词为中心，截取前后文
    const halfLength = Math.floor(maxLength / 2);
    const start = Math.max(0, keywordIndex - halfLength);
    const end = Math.min(plainText.length, start + maxLength);
    
    let excerpt = plainText.substring(start, end);
    
    if (start > 0) {
      excerpt = '...' + excerpt;
    }
    
    if (end < plainText.length) {
      excerpt = excerpt + '...';
    }

    return excerpt;
  }

  /**
   * 解析标签（私有方法）
   * @private
   */
  _parseTags(tags) {
    if (!tags) return [];
    try {
      return typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch (error) {
      logger.warn('解析标签失败:', { tags, error: error.message });
      return [];
    }
  }
}

module.exports = new SearchService();
