// ieclub-backend/src/controllers/communityController.js
// 社区模块控制器 - 基于开发代码优化版本

const prisma = require('../config/database');
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
    AND: [
      { status: 'active' },
      {
        OR: [
          { nickname: { contains: keyword } },
          { bio: { contains: keyword } }
        ]
      }
    ]
  } : { status: 'active' };

  // 构建排序条件
  let orderBy = [];
  if (sortBy === 'register_time') {
    orderBy = [{ createdAt: 'desc' }];
  } else if (sortBy === 'interaction') {
    // 按互动数排序（点赞+收藏）
    orderBy = [
      { likesCount: 'desc' },
      { fansCount: 'desc' }
    ];
  }

  // 获取当前登录用户ID
  const currentUserId = req.user?.id;

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
        likesCount: true,
        fansCount: true,
        topicsCount: true,
        commentsCount: true,
        followers: currentUserId ? {
          where: { followerId: currentUserId },
          select: { id: true }
        } : false
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
    likesCount: user.likesCount,
    favoritesCount: 0,
    interactionCount: user.likesCount + user.fansCount,
    topicsCount: user.topicsCount,
    commentsCount: user.commentsCount,
    isFollowing: currentUserId ? (user.followers?.length > 0) : false
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
    where: { id: userId },
    include: {
      topics: {
        take: 5,
        where: { publishedAt: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          likesCount: true
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
          followers: true,
          follows: true
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
    likesCount: user.likesCount,
    favoritesCount: 0, // 暂时设为0，需要根据实际需求调整
    interactionCount: user.likesCount + user.fansCount,
    topicsCount: user._count.topics,
    commentsCount: user._count.comments,
    followersCount: user._count.followers,
    followingCount: user._count.follows,
    isFollowing: user.followers.length > 0,
    recentTopics: user.topics.map(topic => ({
      id: topic.id,
      title: topic.title,
      createdAt: topic.createdAt.toISOString(),
      likesCount: topic.likesCount
    })),
    tags: [] // 暂时设为空数组，需要根据实际需求调整
  };

  res.json(successResponse(profile));
});

/**
 * 关注用户
 */
exports.followUser = asyncHandler(async (req, res) => {
  console.log('🔍 [followUser] 开始处理关注请求');
  console.log('🔍 [followUser] req.params:', req.params);
  console.log('🔍 [followUser] req.user:', req.user?.id);
  
  const { userId } = req.params;
  const followerId = req.user.id;
  const followingId = userId;
  
  console.log('🔍 [followUser] followerId:', followerId, 'followingId:', followingId);

  if (followerId === followingId) {
    throw new AppError('不能关注自己', 400, 'VALIDATION_INVALID_FORMAT');
  }

  // 检查用户是否存在
  const targetUser = await prisma.user.findUnique({
    where: { id: followingId, status: 'active' }
  });

  if (!targetUser) {
    throw new AppError('用户不存在', 404, 'RESOURCE_NOT_FOUND');
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
  const followingId = userId;

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