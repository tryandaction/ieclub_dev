// ===== services/statsService.js - 数据统计服务 =====
const prisma = require('../config/database');
const logger = require('../utils/logger');
const { startOfWeek, startOfMonth, startOfYear, subDays } = require('date-fns');

class StatsService {
  /**
   * 获取用户统计数据
   */
  async getUserStats(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              topics: true,
              comments: true,
              followers: true,
              following: true,
              receivedLikes: true,
              bookmarks: true,
            }
          }
        }
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 获取本周和本月的统计
      const weeklyStats = await this.getUserPeriodStats(userId, 'week');
      const monthlyStats = await this.getUserPeriodStats(userId, 'month');

      return {
        basic: {
          totalTopics: user._count.topics,
          totalComments: user._count.comments,
          followersCount: user._count.followers,
          followingCount: user._count.following,
          totalLikes: user._count.receivedLikes,
          totalBookmarks: user._count.bookmarks,
          points: user.points,
          level: user.level
        },
        weekly: weeklyStats,
        monthly: monthlyStats
      };
    } catch (error) {
      logger.error('获取用户统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户某时间段的统计
   */
  async getUserPeriodStats(userId, period = 'week') {
    const startDate = this.getStartDate(period);

    const [topicsCount, commentsCount, newFollowers, likesCount] = await Promise.all([
      // 发布话题数
      prisma.topic.count({
        where: {
          authorId: userId,
          createdAt: { gte: startDate }
        }
      }),
      // 评论数
      prisma.comment.count({
        where: {
          userId: userId,
          createdAt: { gte: startDate }
        }
      }),
      // 新增粉丝数
      prisma.follow.count({
        where: {
          followingId: userId,
          createdAt: { gte: startDate }
        }
      }),
      // 获得点赞数
      prisma.like.count({
        where: {
          topic: {
            authorId: userId
          },
          createdAt: { gte: startDate }
        }
      })
    ]);

    return {
      topicsCount,
      commentsCount,
      newFollowers,
      likesCount
    };
  }

  /**
   * 计算用户活跃度
   */
  async calculateUserActivity(userId, days = 30) {
    try {
      const startDate = subDays(new Date(), days);

      // 获取用户在指定时间内的活动
      const [topics, comments, likes] = await Promise.all([
        prisma.topic.findMany({
          where: {
            authorId: userId,
            createdAt: { gte: startDate }
          },
          select: { createdAt: true }
        }),
        prisma.comment.findMany({
          where: {
            userId: userId,
            createdAt: { gte: startDate }
          },
          select: { createdAt: true }
        }),
        prisma.like.findMany({
          where: {
            userId: userId,
            createdAt: { gte: startDate }
          },
          select: { createdAt: true }
        })
      ]);

      // 按天统计活动
      const activityByDay = {};
      for (let i = 0; i < days; i++) {
        const date = subDays(new Date(), i).toISOString().split('T')[0];
        activityByDay[date] = {
          topics: 0,
          comments: 0,
          likes: 0,
          total: 0
        };
      }

      // 统计各类活动
      topics.forEach(t => {
        const date = t.createdAt.toISOString().split('T')[0];
        if (activityByDay[date]) {
          activityByDay[date].topics++;
          activityByDay[date].total++;
        }
      });

      comments.forEach(c => {
        const date = c.createdAt.toISOString().split('T')[0];
        if (activityByDay[date]) {
          activityByDay[date].comments++;
          activityByDay[date].total++;
        }
      });

      likes.forEach(l => {
        const date = l.createdAt.toISOString().split('T')[0];
        if (activityByDay[date]) {
          activityByDay[date].likes++;
          activityByDay[date].total++;
        }
      });

      // 计算活跃天数和平均活跃度
      const activeDays = Object.values(activityByDay).filter(day => day.total > 0).length;
      const totalActivity = Object.values(activityByDay).reduce((sum, day) => sum + day.total, 0);
      const avgActivity = activeDays > 0 ? totalActivity / activeDays : 0;

      return {
        activeDays,
        totalActivity,
        avgActivity: Math.round(avgActivity * 10) / 10,
        activityByDay
      };
    } catch (error) {
      logger.error('计算用户活跃度失败:', error);
      return {
        activeDays: 0,
        totalActivity: 0,
        avgActivity: 0,
        activityByDay: {}
      };
    }
  }

  /**
   * 计算用户影响力
   */
  async calculateUserInfluence(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              followers: true,
              topics: true,
              receivedLikes: true
            }
          },
          topics: {
            select: {
              _count: {
                select: {
                  likes: true,
                  comments: true,
                  views: true
                }
              }
            }
          }
        }
      });

      if (!user) return 0;

      // 计算总浏览量、点赞量、评论量
      const totalViews = user.topics.reduce((sum, t) => sum + t._count.views, 0);
      const totalLikes = user.topics.reduce((sum, t) => sum + t._count.likes, 0);
      const totalComments = user.topics.reduce((sum, t) => sum + t._count.comments, 0);

      // 影响力计算公式
      const influence = 
        user._count.followers * 10 +
        user._count.topics * 5 +
        totalViews * 0.1 +
        totalLikes * 2 +
        totalComments * 3;

      return Math.round(influence);
    } catch (error) {
      logger.error('计算用户影响力失败:', error);
      return 0;
    }
  }

  /**
   * 获取平台整体统计
   */
  async getPlatformStats() {
    try {
      const [totalUsers, totalTopics, totalComments, activeUsers] = await Promise.all([
        prisma.user.count(),
        prisma.topic.count(),
        prisma.comment.count(),
        prisma.user.count({
          where: {
            lastActiveAt: {
              gte: subDays(new Date(), 7)
            }
          }
        })
      ]);

      return {
        totalUsers,
        totalTopics,
        totalComments,
        activeUsers,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('获取平台统计失败:', error);
      return {
        totalUsers: 0,
        totalTopics: 0,
        totalComments: 0,
        activeUsers: 0,
        updatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * 获取热门标签统计
   */
  async getPopularTags(limit = 20) {
    try {
      // 由于没有看到tags表的schema，这里用简化版本
      // 实际应该从topic_tags关联表中统计
      
      const topics = await prisma.topic.findMany({
        where: {
          status: { not: 'deleted' }
        },
        select: {
          tags: true
        }
      });

      // 统计标签频率
      const tagCount = {};
      topics.forEach(topic => {
        if (topic.tags && Array.isArray(topic.tags)) {
          topic.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          });
        }
      });

      // 排序并返回前N个
      const popularTags = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));

      return popularTags;
    } catch (error) {
      logger.error('获取热门标签失败:', error);
      return [];
    }
  }

  /**
   * 辅助函数：获取时间段起始日期
   */
  getStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'week':
        return startOfWeek(now, { weekStartsOn: 1 });
      case 'month':
        return startOfMonth(now);
      case 'year':
        return startOfYear(now);
      case 'day':
        return subDays(now, 1);
      default:
        return startOfWeek(now, { weekStartsOn: 1 });
    }
  }

  /**
   * 计算用户成长趋势
   */
  async getUserGrowthTrend(userId, days = 30) {
    try {
      const trends = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startDate = new Date(date.setHours(0, 0, 0, 0));
        const endDate = new Date(date.setHours(23, 59, 59, 999));

        const [followersCount, topicsCount, likesCount] = await Promise.all([
          prisma.follow.count({
            where: {
              followingId: userId,
              createdAt: { gte: startDate, lte: endDate }
            }
          }),
          prisma.topic.count({
            where: {
              authorId: userId,
              createdAt: { gte: startDate, lte: endDate }
            }
          }),
          prisma.like.count({
            where: {
              topic: { authorId: userId },
              createdAt: { gte: startDate, lte: endDate }
            }
          })
        ]);

        trends.push({
          date: startDate.toISOString().split('T')[0],
          followers: followersCount,
          topics: topicsCount,
          likes: likesCount
        });
      }

      return trends;
    } catch (error) {
      logger.error('计算成长趋势失败:', error);
      return [];
    }
  }
}

module.exports = new StatsService();

