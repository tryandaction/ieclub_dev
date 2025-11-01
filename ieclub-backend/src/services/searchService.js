// ieclub-backend/src/services/searchService.js
// 搜索服务 - 提供全局搜索功能

const prisma = require('../config/database');
const logger = require('../utils/logger');

class SearchService {
  /**
   * 全局搜索
   */
  async globalSearch(keyword, options = {}) {
    const {
      page = 1,
      pageSize = 20,
      types = ['posts', 'users', 'activities'] // 搜索类型
    } = options;

    const results = {
      posts: [],
      users: [],
      activities: [],
      total: 0
    };

    // 并行搜索各类型内容
    const promises = [];

    if (types.includes('posts')) {
      promises.push(this.searchPosts(keyword, page, pageSize));
    }

    if (types.includes('users')) {
      promises.push(this.searchUsers(keyword, page, pageSize));
    }

    if (types.includes('activities')) {
      promises.push(this.searchActivities(keyword, page, pageSize));
    }

    const searchResults = await Promise.all(promises);

    // 整合结果
    let index = 0;
    if (types.includes('posts')) {
      results.posts = searchResults[index].posts;
      results.total += searchResults[index].total;
      index++;
    }

    if (types.includes('users')) {
      results.users = searchResults[index].users;
      results.total += searchResults[index].total;
      index++;
    }

    if (types.includes('activities')) {
      results.activities = searchResults[index].activities;
      results.total += searchResults[index].total;
    }

    return results;
  }

  /**
   * 搜索帖子
   */
  async searchPosts(keyword, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = {
      publishedAt: { not: null },
      OR: [
        { title: { contains: keyword } },
        { content: { contains: keyword } }
      ]
    };

    const [posts, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        skip,
        take,
        orderBy: [
          { likesCount: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
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
        content: this.getExcerpt(post.content, keyword),
        tags: post.tags ? JSON.parse(post.tags) : [],
        author: post.author,
        category: post.category,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        viewsCount: post.viewsCount,
        createdAt: post.createdAt.toISOString()
      })),
      total,
      hasMore: skip + take < total
    };
  }

  /**
   * 搜索用户
   */
  async searchUsers(keyword, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = {
      status: 'active',
      OR: [
        { nickname: { contains: keyword } },
        { bio: { contains: keyword } },
        { email: { contains: keyword } }
      ]
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
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
          topics: user.topicsCount,
          comments: user.commentsCount,
          likes: user.likesCount,
          fans: user.fansCount
        }
      })),
      total,
      hasMore: skip + take < total
    };
  }

  /**
   * 搜索活动
   */
  async searchActivities(keyword, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = {
      status: 'published',
      OR: [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
        { location: { contains: keyword } }
      ]
    };

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take,
        orderBy: [{ startTime: 'asc' }],
        include: {
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
        description: this.getExcerpt(activity.description, keyword),
        location: activity.location,
        startTime: activity.startTime.toISOString(),
        endTime: activity.endTime.toISOString(),
        maxParticipants: activity.maxParticipants,
        participantsCount: activity._count.participants,
        organizer: activity.organizer,
        category: activity.category
      })),
      total,
      hasMore: skip + take < total
    };
  }

  /**
   * 获取热门搜索关键词
   */
  async getHotKeywords(limit = 10) {
    // 从搜索历史中统计热门关键词
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
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
        }
      }
    });

    return result.map(item => ({
      keyword: item.keyword,
      count: item._count.keyword
    }));
  }

  /**
   * 保存搜索历史
   */
  async saveSearchHistory(userId, keyword, resultType = null) {
    try {
      await prisma.searchHistory.create({
        data: {
          userId,
          keyword,
          resultType
        }
      });
    } catch (error) {
      logger.error('保存搜索历史失败:', error);
    }
  }

  /**
   * 获取用户搜索历史
   */
  async getUserSearchHistory(userId, limit = 10) {
      const history = await prisma.searchHistory.findMany({
        where: { userId },
      orderBy: [{ createdAt: 'desc' }],
        take: limit,
      distinct: ['keyword'], // 去重
      select: {
        keyword: true,
        resultType: true,
        createdAt: true
      }
    });

    return history;
  }

  /**
   * 清空用户搜索历史
   */
  async clearSearchHistory(userId) {
    const result = await prisma.searchHistory.deleteMany({
        where: { userId }
      });

    return { message: '清空成功', count: result.count };
  }

  /**
   * 获取搜索建议
   */
  async getSuggestions(keyword, limit = 10) {
    if (!keyword || keyword.length < 2) {
      return [];
    }

    // 从帖子标题获取建议
    const posts = await prisma.topic.findMany({
        where: {
        publishedAt: { not: null },
        title: { contains: keyword }
      },
      take: limit,
      select: {
        title: true
      },
      orderBy: [
        { likesCount: 'desc' },
        { viewsCount: 'desc' }
      ]
    });

    // 从用户昵称获取建议
    const users = await prisma.user.findMany({
      where: {
        status: 'active',
        nickname: { contains: keyword }
      },
      take: limit,
        select: {
        nickname: true
      },
      orderBy: [{ level: 'desc' }]
    });

    // 从活动标题获取建议
    const activities = await prisma.activity.findMany({
      where: {
        status: 'published',
        title: { contains: keyword }
      },
      take: limit,
      select: {
        title: true
      },
      orderBy: [{ participantsCount: 'desc' }]
    });

    // 合并去重
    const suggestions = new Set();
    posts.forEach(p => suggestions.add(p.title));
    users.forEach(u => suggestions.add(u.nickname));
    activities.forEach(a => suggestions.add(a.title));

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * 获取内容摘要（高亮关键词）
   */
  getExcerpt(content, keyword, maxLength = 150) {
    if (!content) return '';

    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const keywordIndex = lowerContent.indexOf(lowerKeyword);

    if (keywordIndex === -1) {
      // 如果没找到关键词，返回开头部分
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    // 以关键词为中心，截取前后文
    const start = Math.max(0, keywordIndex - Math.floor(maxLength / 2));
    const end = Math.min(content.length, start + maxLength);
    
    let excerpt = content.substring(start, end);
    
    if (start > 0) {
      excerpt = '...' + excerpt;
    }
    
    if (end < content.length) {
      excerpt = excerpt + '...';
    }

    return excerpt;
  }
}

module.exports = new SearchService();
