// ieclub-backend/src/controllers/matchingController.js
// 智能匹配控制器 - 第三版本

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/response');
const redis = require('../utils/redis');

/**
 * 计算两个用户之间的相似度
 */
async function calculateSimilarity(user1Id, user2Id) {
  // 获取两个用户的详细数据
  const [user1Data, user2Data] = await Promise.all([
    getUserData(user1Id),
    getUserData(user2Id)
  ]);

  // 1. 主页相似度 (30%)
  const profileSimilarity = calculateProfileSimilarity(user1Data, user2Data);

  // 2. 行为相似度 (40%)
  const behaviorSimilarity = calculateBehaviorSimilarity(user1Data, user2Data);

  // 3. 综合相似度 (30%)
  const comprehensiveSimilarity = calculateComprehensiveSimilarity(user1Data, user2Data);

  // 总分
  const matchScore = 
    profileSimilarity * 0.3 + 
    behaviorSimilarity * 0.4 + 
    comprehensiveSimilarity * 0.3;

  // 生成匹配原因
  const matchReason = generateMatchReason(user1Data, user2Data, {
    profileSimilarity,
    behaviorSimilarity,
    comprehensiveSimilarity
  });

  return {
    profileSimilarity,
    behaviorSimilarity,
    comprehensiveSimilarity,
    topicTypeSimilarity: profileSimilarity,
    categorySimilarity: calculateCategorySimilarity(user1Data, user2Data),
    interestSimilarity: behaviorSimilarity,
    activitySimilarity: comprehensiveSimilarity,
    socialCircleSimilarity: calculateSocialCircleSimilarity(user1Data, user2Data),
    matchScore: Math.round(matchScore),
    matchReason
  };
}

/**
 * 获取用户数据
 */
async function getUserData(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      topics: {
        select: {
          type: true,
          category: true,
          tags: true,
          createdAt: true
        }
      },
      comments: {
        select: {
          content: true,
          createdAt: true,
          topic: {
            select: {
              category: true,
              tags: true
            }
          }
        }
      },
      likes: {
        select: {
          topic: {
            select: {
              category: true,
              tags: true
            }
          }
        }
      },
      following: {
        select: {
          followingId: true
        }
      }
    }
  });

  return user;
}

/**
 * 计算主页相似度
 */
function calculateProfileSimilarity(user1, user2) {
  // 话题类型分布相似度
  const user1Types = user1.topics.map(t => t.type);
  const user2Types = user2.topics.map(t => t.type);
  const typeScore = calculateArraySimilarity(user1Types, user2Types);

  // 话题分类相似度
  const user1Categories = user1.topics.map(t => t.category);
  const user2Categories = user2.topics.map(t => t.category);
  const categoryScore = calculateArraySimilarity(user1Categories, user2Categories);

  return (typeScore + categoryScore) / 2;
}

/**
 * 计算行为相似度
 */
function calculateBehaviorSimilarity(user1, user2) {
  // 评论关键词相似度
  const user1Keywords = extractKeywords(user1.comments.map(c => c.content));
  const user2Keywords = extractKeywords(user2.comments.map(c => c.content));
  const keywordScore = calculateArraySimilarity(user1Keywords, user2Keywords);

  // 兴趣标签相似度
  const user1Interests = extractInterestTags(user1);
  const user2Interests = extractInterestTags(user2);
  const interestScore = calculateArraySimilarity(user1Interests, user2Interests);

  return (keywordScore + interestScore) / 2;
}

/**
 * 计算综合相似度
 */
function calculateComprehensiveSimilarity(user1, user2) {
  // 注册时间接近度
  const timeDiff = Math.abs(
    new Date(user1.createdAt).getTime() - new Date(user2.createdAt).getTime()
  );
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  const timeScore = Math.max(0, 100 - daysDiff / 3); // 每3天减1分

  // 活跃时段相似度
  const activityScore = calculateActivitySimilarity(user1, user2);

  // 社交圈相似度
  const socialScore = calculateSocialCircleSimilarity(user1, user2);

  return (timeScore + activityScore + socialScore) / 3;
}

/**
 * 计算分类相似度
 */
function calculateCategorySimilarity(user1, user2) {
  const user1Categories = user1.topics.map(t => t.category);
  const user2Categories = user2.topics.map(t => t.category);
  return calculateArraySimilarity(user1Categories, user2Categories);
}

/**
 * 计算社交圈相似度
 */
function calculateSocialCircleSimilarity(user1, user2) {
  const user1Following = user1.following.map(f => f.followingId);
  const user2Following = user2.following.map(f => f.followingId);
  return calculateArraySimilarity(user1Following, user2Following);
}

/**
 * 计算活跃时段相似度
 */
function calculateActivitySimilarity(user1, user2) {
  const user1Hours = user1.topics.map(t => new Date(t.createdAt).getHours());
  const user2Hours = user2.topics.map(t => new Date(t.createdAt).getHours());
  return calculateArraySimilarity(user1Hours, user2Hours);
}

/**
 * 计算数组相似度（Jaccard系数）
 */
function calculateArraySimilarity(arr1, arr2) {
  if (arr1.length === 0 || arr2.length === 0) return 0;
  
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return (intersection.size / union.size) * 100;
}

/**
 * 提取关键词
 */
function extractKeywords(texts) {
  // 简单的关键词提取（实际应使用NLP库）
  const allText = texts.join(' ');
  const words = allText.split(/\s+/).filter(w => w.length > 1);
  return [...new Set(words)].slice(0, 50);
}

/**
 * 提取兴趣标签
 */
function extractInterestTags(user) {
  const tags = [];
  
  // 从话题标签中提取
  user.topics.forEach(topic => {
    if (topic.tags && Array.isArray(topic.tags)) {
      tags.push(...topic.tags);
    }
  });
  
  // 从点赞的话题中提取
  user.likes.forEach(like => {
    if (like.topic.tags && Array.isArray(like.topic.tags)) {
      tags.push(...like.topic.tags);
    }
  });
  
  return [...new Set(tags)];
}

/**
 * 生成匹配原因
 */
function generateMatchReason(user1, user2, scores) {
  const reasons = [];
  
  if (scores.profileSimilarity > 70) {
    reasons.push('你们发布的话题类型非常相似');
  }
  
  if (scores.behaviorSimilarity > 70) {
    reasons.push('你们的兴趣爱好高度重合');
  }
  
  if (scores.comprehensiveSimilarity > 70) {
    reasons.push('你们的活跃时段和社交圈很接近');
  }
  
  // 共同话题分类
  const commonCategories = user1.topics
    .map(t => t.category)
    .filter(c => user2.topics.some(t2 => t2.category === c));
  
  if (commonCategories.length > 0) {
    reasons.push(`都关注${commonCategories[0]}等话题`);
  }
  
  // 互补类型
  const user1HasSupply = user1.topics.some(t => t.type === 'supply');
  const user2HasDemand = user2.topics.some(t => t.type === 'demand');
  
  if (user1HasSupply && user2HasDemand) {
    reasons.push('你们的话题类型互补，可能有合作机会');
  }
  
  if (reasons.length === 0) {
    reasons.push('系统推荐的潜在匹配用户');
  }
  
  return reasons;
}

/**
 * 计算共同点
 */
function calculateCommonPoints(user1, user2) {
  // 共同话题数（相同分类）
  const user1Categories = user1.topics.map(t => t.category);
  const user2Categories = user2.topics.map(t => t.category);
  const commonTopics = user1Categories.filter(c => user2Categories.includes(c)).length;
  
  // 共同兴趣
  const user1Interests = extractInterestTags(user1);
  const user2Interests = extractInterestTags(user2);
  const commonInterests = user1Interests.filter(i => user2Interests.includes(i)).slice(0, 5);
  
  // 共同关注
  const user1Following = user1.following.map(f => f.followingId);
  const user2Following = user2.following.map(f => f.followingId);
  const commonFollowers = user1Following.filter(id => user2Following.includes(id)).length;
  
  return {
    commonTopics,
    commonInterests,
    commonFollowers
  };
}

/**
 * 获取匹配用户列表
 */
exports.getMatchedUsers = asyncHandler(async (req, res) => {
  const {
    type = 'comprehensive',
    page = 1,
    pageSize = 20,
    minScore = 50
  } = req.query;
  
  const currentUserId = req.user.id;
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);
  
  // 尝试从缓存获取
  const cacheKey = `matching:${currentUserId}:${type}:${page}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return res.json(successResponse(JSON.parse(cached)));
  }
  
  // 获取所有其他用户
  const allUsers = await prisma.user.findMany({
    where: {
      id: { not: currentUserId }
    },
    select: {
      id: true,
      nickname: true,
      avatar: true,
      bio: true,
      _count: {
        select: {
          topics: true,
          comments: true,
          likes: true
        }
      }
    }
  });
  
  // 计算每个用户的匹配度
  const matchedUsers = [];
  
  for (const user of allUsers) {
    const similarity = await calculateSimilarity(currentUserId, user.id);
    
    if (similarity.matchScore >= parseInt(minScore)) {
      const commonPoints = await calculateCommonPoints(
        await getUserData(currentUserId),
        await getUserData(user.id)
      );
      
      matchedUsers.push({
        userId: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        bio: user.bio || '',
        similarity: {
          profileSimilarity: similarity.profileSimilarity,
          behaviorSimilarity: similarity.behaviorSimilarity,
          comprehensiveSimilarity: similarity.comprehensiveSimilarity,
          topicTypeSimilarity: similarity.topicTypeSimilarity,
          categorySimilarity: similarity.categorySimilarity,
          interestSimilarity: similarity.interestSimilarity,
          activitySimilarity: similarity.activitySimilarity,
          socialCircleSimilarity: similarity.socialCircleSimilarity
        },
        matchScore: similarity.matchScore,
        matchReason: similarity.matchReason,
        ...commonPoints,
        complementaryTypes: [],
        stats: {
          topicsCount: user._count.topics,
          commentsCount: user._count.comments,
          likesCount: user._count.likes
        }
      });
    }
  }
  
  // 根据类型排序
  matchedUsers.sort((a, b) => {
    switch (type) {
      case 'profile':
        return b.similarity.profileSimilarity - a.similarity.profileSimilarity;
      case 'behavior':
        return b.similarity.behaviorSimilarity - a.similarity.behaviorSimilarity;
      case 'comprehensive':
      default:
        return b.matchScore - a.matchScore;
    }
  });
  
  // 分页
  const paginatedUsers = matchedUsers.slice(skip, skip + take);
  const total = matchedUsers.length;
  const hasMore = skip + take < total;
  
  // 计算平均分数
  const averageScore = matchedUsers.length > 0
    ? matchedUsers.reduce((sum, u) => sum + u.matchScore, 0) / matchedUsers.length
    : 0;
  
  const result = {
    matches: paginatedUsers,
    total,
    hasMore,
    currentPage: parseInt(page),
    averageScore
  };
  
  // 缓存10分钟
  await redis.setex(cacheKey, 600, JSON.stringify(result));
  
  res.json(successResponse(result));
});

/**
 * 获取与指定用户的相似度
 */
exports.getUserSimilarity = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  
  const targetUser = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: {
      id: true,
      nickname: true,
      avatar: true,
      bio: true
    }
  });
  
  if (!targetUser) {
    throw new AppError('用户不存在', 404);
  }
  
  const similarity = await calculateSimilarity(currentUserId, parseInt(userId));
  const commonPoints = await calculateCommonPoints(
    await getUserData(currentUserId),
    await getUserData(parseInt(userId))
  );
  
  const result = {
    userId: targetUser.id,
    nickname: targetUser.nickname,
    avatar: targetUser.avatar,
    bio: targetUser.bio || '',
    similarity: {
      profileSimilarity: similarity.profileSimilarity,
      behaviorSimilarity: similarity.behaviorSimilarity,
      comprehensiveSimilarity: similarity.comprehensiveSimilarity,
      topicTypeSimilarity: similarity.topicTypeSimilarity,
      categorySimilarity: similarity.categorySimilarity,
      interestSimilarity: similarity.interestSimilarity,
      activitySimilarity: similarity.activitySimilarity,
      socialCircleSimilarity: similarity.socialCircleSimilarity
    },
    matchScore: similarity.matchScore,
    matchReason: similarity.matchReason,
    ...commonPoints,
    complementaryTypes: [],
    stats: {
      topicsCount: 0,
      commentsCount: 0,
      likesCount: 0
    }
  };
  
  res.json(successResponse(result));
});

/**
 * 获取匹配建议
 */
exports.getMatchingSuggestions = asyncHandler(async (req, res) => {
  const suggestions = [
    {
      type: 'follow',
      title: '推荐关注',
      description: '这些用户可能对你有帮助',
      users: []
    },
    {
      type: 'collaborate',
      title: '合作伙伴',
      description: '你们的话题类型互补',
      users: []
    },
    {
      type: 'learn',
      title: '学习对象',
      description: '活跃度和贡献度高的用户',
      users: []
    }
  ];
  
  res.json(successResponse(suggestions));
});

/**
 * 刷新匹配结果
 */
exports.refreshMatching = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  
  // 清除该用户的所有匹配缓存
  const keys = await redis.keys(`matching:${currentUserId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  
  res.json(successResponse({ message: '匹配结果已刷新' }));
});

module.exports = exports;
