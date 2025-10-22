// ieclub-backend/src/controllers/rankingController.js
// 排行榜控制器 - 第二版本

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/response');
const redis = require('../utils/redis');

/**
 * 计算用户贡献分数
 * @param {Object} userData - 用户统计数据
 * @returns {Object} 分数详情
 */
function calculateContributionScore(userData) {
  // 话题质量分 (40%)
  const topicQualityScore = (
    userData.topicLikes * 2 +
    userData.topicFavorites * 3 +
    userData.topicComments * 1 +
    userData.topicViews * 0.1
  ) * 0.4;

  // 互动活跃度 (30%)
  const interactionScore = (
    userData.commentsGiven * 2 +
    userData.likesGiven * 1 +
    userData.quickReplies * 5
  ) * 0.3;

  // 帮助他人分 (30%)
  const helpOthersScore = (
    userData.supplyMatches * 10 +
    userData.demandMatches * 5 +
    userData.commentLikes * 3
  ) * 0.3;

  return {
    topicQualityScore,
    interactionScore,
    helpOthersScore,
    totalScore: topicQualityScore + interactionScore + helpOthersScore
  };
}

/**
 * 获取时间范围
 */
function getTimeRange(period) {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'total':
    default:
      startDate = new Date(0); // 从最早开始
      break;
  }

  return { startDate, endDate: now };
}

/**
 * 获取排行榜列表
 */
exports.getRankingList = asyncHandler(async (req, res) => {
  const {
    type = 'contribution',
    period = 'week',
    page = 1,
    pageSize = 20
  } = req.query;

  const currentUserId = req.user.id;
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);
  const { startDate } = getTimeRange(period);

  // 尝试从缓存获取
  const cacheKey = `rankings:${type}:${period}:${page}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return res.json(successResponse(JSON.parse(cached)));
  }

  // 查询所有用户的统计数据
  const users = await prisma.user.findMany({
    select: {
      id: true,
      nickname: true,
      avatar: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          topics: true,
          comments: true
        }
      },
      topics: {
        where: {
          createdAt: { gte: startDate }
        },
        select: {
          _count: {
            select: {
              likes: true,
              favorites: true,
              comments: true
            }
          },
          viewsCount: true,
          type: true,
          matches: true
        }
      },
      comments: {
        where: {
          createdAt: { gte: startDate }
        },
        select: {
          createdAt: true,
          topic: {
            select: {
              createdAt: true
            }
          },
          _count: {
            select: {
              likes: true
            }
          }
        }
      },
      likes: {
        where: {
          createdAt: { gte: startDate }
        }
      }
    }
  });

  // 计算每个用户的得分
  const rankedUsers = users.map(user => {
    const userData = {
      topicLikes: user.topics.reduce((sum, t) => sum + t._count.likes, 0),
      topicFavorites: user.topics.reduce((sum, t) => sum + t._count.favorites, 0),
      topicComments: user.topics.reduce((sum, t) => sum + t._count.comments, 0),
      topicViews: user.topics.reduce((sum, t) => sum + t.viewsCount, 0),
      commentsGiven: user.comments.length,
      likesGiven: user.likes.length,
      quickReplies: user.comments.filter(comment => {
        const commentTime = new Date(comment.createdAt);
        const topicTime = new Date(comment.topic.createdAt);
        const hoursDiff = (commentTime - topicTime) / (1000 * 60 * 60);
        return hoursDiff <= 24;
      }).length,
      supplyMatches: user.topics.filter(t => t.type === 'supply' && t.matches.length > 0).length,
      demandMatches: user.topics.filter(t => t.type === 'demand' && t.matches.length > 0).length,
      commentLikes: user.comments.reduce((sum, c) => sum + c._count.likes, 0)
    };

    const scores = calculateContributionScore(userData);

    return {
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio || '',
      ...scores,
      stats: {
        topicsCount: user._count.topics,
        likesReceived: userData.topicLikes,
        favoritesReceived: userData.topicFavorites,
        commentsReceived: userData.topicComments,
        commentsGiven: userData.commentsGiven,
        likesGiven: userData.likesGiven,
        matchSuccessCount: userData.supplyMatches + userData.demandMatches
      }
    };
  });

  // 根据类型排序
  rankedUsers.sort((a, b) => {
    switch (type) {
      case 'topic_quality':
        return b.topicQualityScore - a.topicQualityScore;
      case 'interaction':
        return b.interactionScore - a.interactionScore;
      case 'help_others':
        return b.helpOthersScore - a.helpOthersScore;
      case 'contribution':
      default:
        return b.totalScore - a.totalScore;
    }
  });

  // 添加排名
  rankedUsers.forEach((user, index) => {
    user.rank = index + 1;
  });

  // 分页
  const paginatedUsers = rankedUsers.slice(skip, skip + take);
  const total = rankedUsers.length;
  const hasMore = skip + take < total;

  // 获取当前用户排名
  const myRanking = rankedUsers.find(u => u.userId === currentUserId) || null;

  const result = {
    rankings: paginatedUsers,
    total,
    hasMore,
    currentPage: parseInt(page),
    myRanking,
    updateTime: new Date().toISOString()
  };

  // 缓存5分钟
  await redis.setex(cacheKey, 300, JSON.stringify(result));

  res.json(successResponse(result));
});

/**
 * 获取用户排名详情
 */
exports.getUserRanking = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { type = 'contribution', period = 'week' } = req.query;

  // 复用 getRankingList 逻辑获取完整排行榜
  req.query = { type, period, page: 1, pageSize: 1000 };
  
  const mockRes = {
    json: (data) => data
  };
  
  const result = await exports.getRankingList(req, mockRes);
  const rankings = result.data.rankings;
  
  const userRanking = rankings.find(r => r.userId === parseInt(userId));
  
  if (!userRanking) {
    throw new AppError('用户未上榜', 404);
  }

  res.json(successResponse(userRanking));
});

/**
 * 获取我的排名
 */
exports.getMyRanking = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  req.params = { userId };
  return exports.getUserRanking(req, res);
});

/**
 * 获取排行榜奖励配置
 */
exports.getRewardConfig = asyncHandler(async (req, res) => {
  const rewards = [
    {
      rank: 1,
      badge: '🥇',
      badgeColor: '#FFD700',
      title: '社区之星'
    },
    {
      rank: 2,
      badge: '🥈',
      badgeColor: '#C0C0C0',
      title: '优秀贡献者'
    },
    {
      rank: 3,
      badge: '🥉',
      badgeColor: '#CD7F32',
      title: '活跃先锋'
    },
    {
      rank: 10,
      badge: '⭐',
      badgeColor: '#667eea',
      title: 'Top 10'
    },
    {
      rank: 50,
      badge: '✨',
      badgeColor: '#999999',
      title: 'Top 50'
    }
  ];

  res.json(successResponse(rewards));
});

module.exports = exports;