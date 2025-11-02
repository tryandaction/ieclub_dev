// ieclub-backend/src/services/statsService.js
// 数据统计和分析服务（优化版）

const prisma = require('../config/database');
const { cacheGet, cacheSet } = require('../utils/redis-enhanced');
const logger = require('../utils/logger');

// 缓存配置
const CACHE_TTL = {
  USER_STATS: 900,        // 用户统计15分钟
  PLATFORM_STATS: 1800,   // 平台统计30分钟
  HOT_CONTENT: 600,       // 热门内容10分钟
  LEADERBOARD: 600,       // 排行榜10分钟
  CATEGORY_STATS: 1800,   // 分类统计30分钟
  TREND: 3600             // 趋势数据1小时
};

class StatsService {
  /**
   * 获取用户统计数据（优化版 - 添加缓存）
   */
  async getUserStats(userId) {
    // 尝试从缓存获取
    const cacheKey = `stats:user:${userId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.debug('用户统计命中缓存', { userId });
      return cached;
    }

    const [user, posts, comments, likes, activities] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
            select: {
          credits: true,
          level: true,
          exp: true,
          topicsCount: true,
          commentsCount: true,
          likesCount: true,
          fansCount: true,
          createdAt: true
        }
      }),
      prisma.topic.count({
        where: { authorId: userId, publishedAt: { not: null } }
      }),
      prisma.comment.count({
        where: { userId }
      }),
      prisma.like.count({
        where: { userId }
      }),
      prisma.activityParticipant.count({
        where: { userId, status: 'approved' }
      })
    ]);

    // 计算活跃天数
    const firstActivity = await prisma.creditLog.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    });

    const activeDays = firstActivity
      ? Math.floor((Date.now() - firstActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // 最近7天活跃度
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await prisma.creditLog.count({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo }
      }
    });

    const result = {
      user: {
        credits: user.credits,
        level: user.level,
        exp: user.exp,
        joinDate: user.createdAt.toISOString(),
        activeDays
      },
      content: {
        posts,
        comments,
        likes,
        activities
      },
      social: {
        fans: user.fansCount,
        receivedLikes: user.likesCount
      },
      activity: {
        recentWeek: recentActivity,
        averageDaily: activeDays > 0 ? (recentActivity / 7).toFixed(2) : 0
      }
    };

    // 缓存结果
    await cacheSet(cacheKey, result, CACHE_TTL.USER_STATS);

    return result;
  }

  /**
   * 获取平台整体统计（优化版 - 添加缓存）
   */
  async getPlatformStats() {
    // 尝试从缓存获取
    const cacheKey = 'stats:platform';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.debug('平台统计命中缓存');
      return cached;
    }

    const [
      totalUsers,
      activeUsers,
      totalPosts,
      totalComments,
      totalActivities,
      todayPosts,
      todayComments,
      todayUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.topic.count({ where: { publishedAt: { not: null } } }),
      prisma.comment.count(),
      prisma.activity.count({ where: { status: 'published' } }),
      this.getTodayCount('topic'),
      this.getTodayCount('comment'),
      this.getTodayCount('user')
    ]);

    const result = {
      users: {
        total: totalUsers,
        active: activeUsers,
        today: todayUsers
      },
      content: {
        posts: totalPosts,
        comments: totalComments,
        activities: totalActivities
      },
      today: {
        posts: todayPosts,
        comments: todayComments,
        newUsers: todayUsers
      }
    };

    // 缓存结果
    await cacheSet(cacheKey, result, CACHE_TTL.PLATFORM_STATS);

    return result;
  }

  /**
   * 获取内容趋势（最近30天）
   */
  async getContentTrend(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 按天统计
    const dailyStats = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [posts, comments, users] = await Promise.all([
      prisma.topic.count({
        where: {
            publishedAt: {
              gte: date,
              lt: nextDate
            }
          }
        }),
      prisma.comment.count({
        where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        }),
        prisma.user.count({
        where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
        }
      })
    ]);

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        posts,
        comments,
        users
      });
    }

    return dailyStats;
  }

  /**
   * 获取热门内容（优化版 - 添加缓存）
   */
  async getHotContent(options = {}) {
    const {
      type = 'posts', // posts, activities, users
      limit = 10,
      days = 7
    } = options;

    // 尝试从缓存获取
    const cacheKey = `stats:hot:${type}:${limit}:${days}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.debug('热门内容命中缓存', { type, limit, days });
      return cached;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    switch (type) {
      case 'posts':
        return await prisma.topic.findMany({
          where: {
            publishedAt: { gte: startDate }
          },
          take: limit,
          orderBy: [
            { likesCount: 'desc' },
            { commentsCount: 'desc' },
            { viewsCount: 'desc' }
          ],
          select: {
            id: true,
            title: true,
            content: true,
            likesCount: true,
            commentsCount: true,
            viewsCount: true,
            publishedAt: true,
            author: {
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
            }
          }
        }).then(result => {
          cacheSet(cacheKey, result, CACHE_TTL.HOT_CONTENT);
          return result;
        });

      case 'activities':
        return await prisma.activity.findMany({
          where: {
            status: 'published',
            createdAt: { gte: startDate }
          },
          take: limit,
          orderBy: [
            { participantsCount: 'desc' }
          ],
          select: {
            id: true,
            title: true,
            description: true,
            participantsCount: true,
            startTime: true,
            endTime: true,
            organizer: {
              select: {
                id: true,
                nickname: true,
                avatar: true
              }
            }
          }
        }).then(result => {
          cacheSet(cacheKey, result, CACHE_TTL.HOT_CONTENT);
          return result;
        });

      case 'users':
        return await prisma.user.findMany({
          where: {
            status: 'active',
            createdAt: { gte: startDate }
          },
          take: limit,
          orderBy: [
            { credits: 'desc' },
            { level: 'desc' }
          ],
          select: {
            id: true,
            nickname: true,
            avatar: true,
            level: true,
            credits: true,
            topicsCount: true,
            commentsCount: true
          }
        }).then(result => {
          cacheSet(cacheKey, result, CACHE_TTL.HOT_CONTENT);
          return result;
        });

      default:
        return [];
    }
  }

  /**
   * 获取用户行为分析
   */
  async getUserBehaviorAnalysis(userId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 获取行为数据
    const [
      recentPosts,
      recentComments,
      recentLikes,
      monthlyPosts,
      monthlyComments,
      creditHistory
    ] = await Promise.all([
      prisma.topic.count({
        where: {
          authorId: userId,
          publishedAt: { gte: sevenDaysAgo }
        }
      }),
      prisma.comment.count({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo }
        }
      }),
      prisma.like.count({
            where: {
          userId,
          createdAt: { gte: sevenDaysAgo }
            }
          }),
          prisma.topic.count({
            where: {
              authorId: userId,
          publishedAt: { gte: thirtyDaysAgo }
            }
          }),
      prisma.comment.count({
            where: {
          userId,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.creditLog.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
          })
        ]);

    // 计算活跃度分数（0-100）
    const activityScore = Math.min(100, 
      recentPosts * 10 + 
      recentComments * 5 + 
      recentLikes * 2
    );

    // 分析最活跃时间段
    const activityByHour = {};
    creditHistory.forEach(log => {
      const hour = log.createdAt.getHours();
      activityByHour[hour] = (activityByHour[hour] || 0) + 1;
    });

    const mostActiveHour = Object.keys(activityByHour).reduce((a, b) => 
      activityByHour[a] > activityByHour[b] ? a : b, 0
    );

    return {
      recent: {
        posts: recentPosts,
        comments: recentComments,
        likes: recentLikes,
        activityScore
      },
      monthly: {
        posts: monthlyPosts,
        comments: monthlyComments,
        averagePostsPerWeek: (monthlyPosts / 4).toFixed(1),
        averageCommentsPerWeek: (monthlyComments / 4).toFixed(1)
      },
      behavior: {
        mostActiveHour: parseInt(mostActiveHour),
        activityDistribution: activityByHour
      }
    };
  }

  /**
   * 获取积分趋势
   */
  async getCreditTrend(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.creditLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    });

    // 按天分组统计
    const dailyCredits = {};
    let cumulativeCredits = 0;

    logs.forEach(log => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!dailyCredits[date]) {
        dailyCredits[date] = {
          date,
          gained: 0,
          spent: 0,
          cumulative: 0
        };
      }

      if (log.credits > 0) {
        dailyCredits[date].gained += log.credits;
      } else {
        dailyCredits[date].spent += Math.abs(log.credits);
      }

      cumulativeCredits += log.credits;
      dailyCredits[date].cumulative = cumulativeCredits;
    });

    return Object.values(dailyCredits);
  }

  /**
   * 获取分类统计
   */
  async getCategoryStats() {
    // 获取所有分类及其内容数量
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            topics: true,
            activities: true
          }
        }
      }
    });

    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      postsCount: cat._count.topics,
      activitiesCount: cat._count.activities,
      total: cat._count.topics + cat._count.activities
    })).sort((a, b) => b.total - a.total);
  }

  /**
   * 辅助函数：获取今天的数量
   */
  async getTodayCount(model) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const modelMap = {
      user: 'user',
      topic: 'topic',
      comment: 'comment'
    };

    const modelName = modelMap[model];
    if (!modelName) return 0;

    return await prisma[modelName].count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });
  }

  /**
   * 获取排行榜（优化版 - 添加缓存）
   */
  async getLeaderboard(type = 'credits', limit = 50) {
    // 尝试从缓存获取
    const cacheKey = `stats:leaderboard:${type}:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.debug('排行榜命中缓存', { type, limit });
      return cached;
    }

    const orderByMap = {
      credits: { credits: 'desc' },
      level: { level: 'desc' },
      posts: { topicsCount: 'desc' },
      likes: { likesCount: 'desc' }
    };

    const orderBy = orderByMap[type] || orderByMap.credits;

    const result = await prisma.user.findMany({
      where: { status: 'active' },
      take: limit,
      orderBy,
      select: {
        id: true,
        nickname: true,
        avatar: true,
        level: true,
        credits: true,
        exp: true,
        topicsCount: true,
        commentsCount: true,
        likesCount: true
      }
    });

    // 缓存结果
    await cacheSet(cacheKey, result, CACHE_TTL.LEADERBOARD);

    return result;
  }
}

module.exports = new StatsService();
