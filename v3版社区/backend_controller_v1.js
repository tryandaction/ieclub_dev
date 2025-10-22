// ieclub-backend/src/controllers/communityController.js
// 社区模块控制器 - 第一版本

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/response');

/**
 * 获取用户列表
 */
exports.getUserList = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    pageSize = 20, 
    sortBy = 'register_time',
    keyword 
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  // 构建查询条件
  const where = keyword ? {
    OR: [
      { nickname: { contains: keyword } },
      { bio: { contains: keyword } }
    ]
  } : {};

  // 构建排序条件
  let orderBy = {};
  if (sortBy === 'register_time') {
    orderBy = { createdAt: 'desc' };
  } else if (sortBy === 'interaction') {
    // 按互动数排序（点赞+收藏）
    orderBy = [
      { likesCount: 'desc' },
      { favoritesCount: 'desc' }
    ];
  }

  // 查询用户
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        nickname: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            topics: true,
            comments: true,
            likes: true,
            favorites: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  // 格式化返回数据
  const formattedUsers = users.map(user => ({
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio || '',
    registerTime: user.createdAt.toISOString(),
    likesCount: user._count.likes,
    favoritesCount: user._count.favorites,
    interactionCount: user._count.likes + user._count.favorites,
    topicsCount: user._count.topics,
    commentsCount: user._count.comments
  }));

  res.json(successResponse({
    users: formattedUsers,
    total,
    hasMore: skip + take < total,
    currentPage: parseInt(page)
  }));
});

/**
 * 搜索用户
 */
exports.searchUsers = asyncHandler(async (req, res) => {
  const { keyword, page = 1, pageSize = 20 } = req.query;

  if (!keyword) {
    throw new AppError('请输入搜索关键词', 400);
  }

  // 复用getUserList逻辑
  req.query = { page, pageSize, keyword };
  return exports.getUserList(req, res);
});

/**
 * 获取用户详细信息
 */
exports.getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    include: {
      topics: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          _count: {
            select: { likes: true }
          }
        }
      },
      followers: {
        where: { followerId: currentUserId },
        select: { id: true }
      },
      _count: {
        select: {
          topics: true,
          comments: true,
          likes: true,
          favorites: true,
          followers: true,
          following: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  // 格式化返回数据
  const profile = {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio || '',
    registerTime: user.createdAt.toISOString(),
    likesCount: user._count.likes,
    favoritesCount: user._count.favorites,
    interactionCount: user._count.likes + user._count.favorites,
    topicsCount: user._count.topics,
    commentsCount: user._count.comments,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    isFollowing: user.followers.length > 0,
    recentTopics: user.topics.map(topic => ({
      id: topic.id,
      title: topic.title,
      createdAt: topic.createdAt.toISOString(),
      likesCount: topic._count.likes
    })),
    tags: user.tags || []
  };

  res.json(successResponse(profile));
});

/**
 * 关注用户
 */
exports.followUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id;
  const followingId = parseInt(userId);

  if (followerId === followingId) {
    throw new AppError('不能关注自己', 400);
  }

  // 检查用户是否存在
  const targetUser = await prisma.user.findUnique({
    where: { id: followingId }
  });

  if (!targetUser) {
    throw new AppError('用户不存在', 404);
  }

  // 检查是否已关注
  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId
      }
    }
  });

  if (existingFollow) {
    throw new AppError('已经关注过该用户', 400);
  }

  // 创建关注关系
  await prisma.follow.create({
    data: {
      followerId,
      followingId
    }
  });

  res.json(successResponse({ message: '关注成功' }));
});

/**
 * 取消关注
 */
exports.unfollowUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id;
  const followingId = parseInt(userId);

  // 删除关注关系
  const result = await prisma.follow.deleteMany({
    where: {
      followerId,
      followingId
    }
  });

  if (result.count === 0) {
    throw new AppError('未关注该用户', 400);
  }

  res.json(successResponse({ message: '取消关注成功' }));
});

// ==================== 第二版本：排行榜功能 ====================

const rankingController = require('./rankingController');

/**
 * 获取排行榜列表
 */
exports.getRankingList = rankingController.getRankingList;

/**
 * 获取用户排名详情
 */
exports.getUserRanking = rankingController.getUserRanking;

/**
 * 获取我的排名
 */
exports.getMyRanking = rankingController.getMyRanking;

/**
 * 获取排行榜奖励配置
 */
exports.getRewardConfig = rankingController.getRewardConfig;

// ==================== 第三版本：智能匹配功能 ====================

const matchingController = require('./matchingController');

/**
 * 获取智能匹配用户列表
 */
exports.getMatchedUsers = matchingController.getMatchedUsers;

/**
 * 获取与指定用户的相似度
 */
exports.getUserSimilarity = matchingController.getUserSimilarity;

/**
 * 获取匹配建议
 */
exports.getMatchingSuggestions = matchingController.getMatchingSuggestions;

/**
 * 刷新匹配结果
 */
exports.refreshMatching = matchingController.refreshMatching;
