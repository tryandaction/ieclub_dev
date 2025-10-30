// ===== controllers/leaderboardController.js - 排行榜控制器 =====
const prisma = require('../config/database');
const logger = require('../utils/logger');
const { startOfWeek, startOfMonth, subDays } = require('date-fns');

class LeaderboardController {
  /**
   * 获取综合排行榜（基于积分和活跃度）
   */
  async getOverallLeaderboard(req, res) {
    try {
      const { timeRange = 'week', limit = 50 } = req.query;
      
      const dateFilter = getDateFilter(timeRange);
      
      // 获取用户列表，按积分和活跃度排序
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          // 如果有时间范围限制，可以根据活动时间筛选
        },
        select: {
          id: true,
          nickname: true,
          avatar: true,
          level: true,
          points: true,
          department: true,
          grade: true,
          bio: true,
          _count: {
            select: {
              topics: true,
              comments: true,
              followers: true,
              receivedLikes: true,
            }
          },
          topics: {
            where: dateFilter,
            select: {
              _count: {
                select: {
                  likes: true,
                  comments: true,
                }
              }
            }
          }
        },
        orderBy: [
          { points: 'desc' },
          { level: 'desc' }
        ],
        take: parseInt(limit)
      });

      // 计算综合得分
      const leaderboard = users.map((user, index) => {
        const topicLikes = user.topics.reduce((sum, topic) => sum + topic._count.likes, 0);
        const topicComments = user.topics.reduce((sum, topic) => sum + topic._count.comments, 0);
        
        const score = calculateOverallScore({
          points: user.points,
          level: user.level,
          topicsCount: user._count.topics,
          commentsCount: user._count.comments,
          followersCount: user._count.followers,
          likesCount: user._count.receivedLikes,
          topicLikes,
          topicComments
        });

        return {
          rank: index + 1,
          user: {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            level: user.level,
            department: user.department,
            grade: user.grade,
            bio: user.bio
          },
          score: Math.round(score),
          points: user.points,
          stats: {
            topicsCount: user._count.topics,
            commentsCount: user._count.comments,
            followersCount: user._count.followers,
            likesCount: user._count.receivedLikes
          },
          change: 0 // TODO: 计算排名变化
        };
      });

      res.json({
        success: true,
        data: {
          timeRange,
          leaderboard,
          total: leaderboard.length,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('获取综合排行榜失败:', error);
      res.status(500).json({
        success: false,
        message: '获取排行榜失败'
      });
    }
  }

  /**
   * 获取知识分享排行榜（基于"我来讲"成团次数）
   */
  async getSharingLeaderboard(req, res) {
    try {
      const { timeRange = 'week', limit = 50 } = req.query;
      const dateFilter = getDateFilter(timeRange);

      // 获取发布了"我来讲"话题的用户
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          topics: {
            some: {
              type: 'topic_offer',
              ...dateFilter
            }
          }
        },
        select: {
          id: true,
          nickname: true,
          avatar: true,
          level: true,
          department: true,
          grade: true,
          topics: {
            where: {
              type: 'topic_offer',
              ...dateFilter
            },
            select: {
              id: true,
              status: true,
              _count: {
                select: {
                  likes: true,
                  comments: true,
                  interestedUsers: true
                }
              }
            }
          }
        },
        take: parseInt(limit) * 2 // 多取一些，后面会重新排序
      });

      // 计算每个用户的成团次数和总互动数
      const leaderboard = users.map(user => {
        const completedTopics = user.topics.filter(t => t.status === 'completed').length;
        const totalInterested = user.topics.reduce((sum, t) => sum + t._count.interestedUsers, 0);
        const totalLikes = user.topics.reduce((sum, t) => sum + t._count.likes, 0);
        const totalComments = user.topics.reduce((sum, t) => sum + t._count.comments, 0);

        return {
          user: {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            level: user.level,
            department: user.department,
            grade: user.grade
          },
          completedCount: completedTopics,
          topicsCount: user.topics.length,
          totalInterested,
          totalLikes,
          totalComments,
          score: completedTopics * 100 + totalInterested * 10 + totalLikes * 5 + totalComments * 3
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit))
      .map((item, index) => ({
        rank: index + 1,
        ...item,
        change: 0
      }));

      res.json({
        success: true,
        data: {
          timeRange,
          leaderboard,
          total: leaderboard.length,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('获取知识分享排行榜失败:', error);
      res.status(500).json({
        success: false,
        message: '获取排行榜失败'
      });
    }
  }

  /**
   * 获取人气排行榜（基于粉丝数）
   */
  async getPopularityLeaderboard(req, res) {
    try {
      const { timeRange = 'week', limit = 50 } = req.query;

      const users = await prisma.user.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true,
          nickname: true,
          avatar: true,
          level: true,
          department: true,
          grade: true,
          bio: true,
          _count: {
            select: {
              followers: true,
              topics: true,
              receivedLikes: true
            }
          }
        },
        orderBy: {
          followers: {
            _count: 'desc'
          }
        },
        take: parseInt(limit)
      });

      const leaderboard = users.map((user, index) => ({
        rank: index + 1,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          level: user.level,
          department: user.department,
          grade: user.grade,
          bio: user.bio
        },
        followersCount: user._count.followers,
        topicsCount: user._count.topics,
        likesCount: user._count.receivedLikes,
        change: 0
      }));

      res.json({
        success: true,
        data: {
          timeRange,
          leaderboard,
          total: leaderboard.length,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('获取人气排行榜失败:', error);
      res.status(500).json({
        success: false,
        message: '获取排行榜失败'
      });
    }
  }

  /**
   * 获取话题热度排行榜
   */
  async getTopicLeaderboard(req, res) {
    try {
      const { timeRange = 'week', limit = 50 } = req.query;
      const dateFilter = getDateFilter(timeRange);

      const topics = await prisma.topic.findMany({
        where: {
          status: { not: 'deleted' },
          ...dateFilter
        },
        select: {
          id: true,
          title: true,
          type: true,
          cover: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              bookmarks: true,
              interestedUsers: true,
              views: true
            }
          }
        },
        take: parseInt(limit) * 2
      });

      // 计算热度分数
      const leaderboard = topics.map(topic => {
        const score = calculateTopicHotScore({
          likes: topic._count.likes,
          comments: topic._count.comments,
          bookmarks: topic._count.bookmarks,
          interested: topic._count.interestedUsers,
          views: topic._count.views,
          createdAt: topic.createdAt
        });

        return {
          topic: {
            id: topic.id,
            title: topic.title,
            type: topic.type,
            cover: topic.cover,
            author: topic.author
          },
          score: Math.round(score),
          stats: {
            likes: topic._count.likes,
            comments: topic._count.comments,
            bookmarks: topic._count.bookmarks,
            interested: topic._count.interestedUsers,
            views: topic._count.views
          }
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit))
      .map((item, index) => ({
        rank: index + 1,
        ...item,
        change: 0
      }));

      res.json({
        success: true,
        data: {
          timeRange,
          leaderboard,
          total: leaderboard.length,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('获取话题热度排行榜失败:', error);
      res.status(500).json({
        success: false,
        message: '获取排行榜失败'
      });
    }
  }

  /**
   * 获取项目关注排行榜
   */
  async getProjectLeaderboard(req, res) {
    try {
      const { timeRange = 'week', limit = 50 } = req.query;
      const dateFilter = getDateFilter(timeRange);

      const projects = await prisma.topic.findMany({
        where: {
          type: 'project',
          status: { not: 'deleted' },
          ...dateFilter
        },
        select: {
          id: true,
          title: true,
          description: true,
          cover: true,
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          },
          _count: {
            select: {
              interestedUsers: true,
              likes: true,
              comments: true,
              bookmarks: true
            }
          }
        },
        orderBy: {
          interestedUsers: {
            _count: 'desc'
          }
        },
        take: parseInt(limit)
      });

      const leaderboard = projects.map((project, index) => ({
        rank: index + 1,
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          cover: project.cover,
          author: project.author
        },
        interestedCount: project._count.interestedUsers,
        likesCount: project._count.likes,
        commentsCount: project._count.comments,
        bookmarksCount: project._count.bookmarks,
        change: 0
      }));

      res.json({
        success: true,
        data: {
          timeRange,
          leaderboard,
          total: leaderboard.length,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('获取项目关注排行榜失败:', error);
      res.status(500).json({
        success: false,
        message: '获取排行榜失败'
      });
    }
  }

  /**
   * 获取指定用户的排名详情
   */
  async getUserRanking(req, res) {
    try {
      const { userId } = req.params;

      // 获取用户基本信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nickname: true,
          avatar: true,
          level: true,
          points: true,
          department: true,
          grade: true,
          _count: {
            select: {
              topics: true,
              comments: true,
              followers: true,
              receivedLikes: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 计算各个排行榜中的排名
      const rankings = {
        overall: await calculateUserRank(userId, 'overall'),
        sharing: await calculateUserRank(userId, 'sharing'),
        popularity: await calculateUserRank(userId, 'popularity')
      };

      res.json({
        success: true,
        data: {
          user,
          rankings,
          stats: {
            topicsCount: user._count.topics,
            commentsCount: user._count.comments,
            followersCount: user._count.followers,
            likesCount: user._count.receivedLikes
          }
        }
      });
    } catch (error) {
      logger.error('获取用户排名失败:', error);
      res.status(500).json({
        success: false,
        message: '获取排名失败'
      });
    }
  }

  /**
   * 获取当前登录用户的排名
   */
  async getMyRanking(req, res) {
    try {
      const userId = req.user.userId;
      
      // 复用getUserRanking的逻辑
      req.params.userId = userId;
      await this.getUserRanking(req, res);
    } catch (error) {
      logger.error('获取我的排名失败:', error);
      res.status(500).json({
        success: false,
        message: '获取排名失败'
      });
    }
  }
}

// ===== 辅助函数 =====

/**
 * 获取时间范围过滤条件
 */
function getDateFilter(timeRange) {
  const now = new Date();
  let startDate;

  switch (timeRange) {
    case 'week':
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'month':
      startDate = startOfMonth(now);
      break;
    case 'all':
      return {};
    default:
      startDate = startOfWeek(now, { weekStartsOn: 1 });
  }

  return {
    createdAt: {
      gte: startDate
    }
  };
}

/**
 * 计算综合得分
 */
function calculateOverallScore(data) {
  return (
    data.points * 1.0 +
    data.level * 50 +
    data.topicsCount * 30 +
    data.commentsCount * 5 +
    data.followersCount * 10 +
    data.likesCount * 3 +
    data.topicLikes * 5 +
    data.topicComments * 3
  );
}

/**
 * 计算话题热度分数
 */
function calculateTopicHotScore(data) {
  const daysSinceCreation = Math.max(1, (Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const timeFactor = Math.pow(daysSinceCreation + 2, -1.5); // 时间衰减因子

  return (
    data.likes * 10 +
    data.comments * 15 +
    data.bookmarks * 8 +
    data.interested * 12 +
    data.views * 1
  ) * timeFactor;
}

/**
 * 计算用户在特定排行榜中的排名
 */
async function calculateUserRank(userId, type) {
  try {
    // 这里简化实现，实际应该根据type计算对应的排名
    // 返回排名、总人数、击败百分比
    const totalUsers = await prisma.user.count({ where: { isActive: true } });
    
    // TODO: 实现真实的排名计算
    const rank = Math.floor(Math.random() * totalUsers) + 1;
    const beatPercentage = ((totalUsers - rank) / totalUsers * 100).toFixed(1);

    return {
      rank,
      total: totalUsers,
      beatPercentage: parseFloat(beatPercentage)
    };
  } catch (error) {
    logger.error('计算用户排名失败:', error);
    return {
      rank: null,
      total: null,
      beatPercentage: null
    };
  }
}

module.exports = new LeaderboardController();

