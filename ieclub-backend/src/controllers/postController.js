// ieclub-backend/src/controllers/postController.js
// 帖子控制器 - 处理社区帖子相关请求

const communityService = require('../services/communityService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

/**
 * 创建帖子
 */
exports.createPost = asyncHandler(async (req, res) => {
  const { title, content, categoryId, tags, images } = req.body;
  const userId = req.user.id;

  const post = await communityService.createPost(userId, {
    title,
    content,
    categoryId,
    tags,
    images
  });

  res.status(201).json(success(post, '发布成功'));
});

/**
 * 获取帖子列表
 */
exports.getPosts = asyncHandler(async (req, res) => {
  const { page, pageSize, categoryId, sortBy, keyword } = req.query;

  const result = await communityService.getPosts({
    page: parseInt(page) || 1,
    pageSize: parseInt(pageSize) || 20,
    categoryId,
    sortBy,
    keyword
  });

  res.json(success(result));
});

/**
 * 获取用户的帖子
 */
exports.getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page, pageSize, sortBy } = req.query;

  const result = await communityService.getPosts({
    page: parseInt(page) || 1,
    pageSize: parseInt(pageSize) || 20,
    userId,
    sortBy
  });

  res.json(success(result));
});

/**
 * 获取帖子详情
 */
exports.getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user ? req.user.id : null;

  const post = await communityService.getPostById(postId, userId);

  res.json(success(post));
});

/**
 * 更新帖子
 */
exports.updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  const { title, content, categoryId, tags, images } = req.body;

  const post = await communityService.updatePost(postId, userId, {
    title,
    content,
    categoryId,
    tags,
    images
  });

  res.json(success(post, '更新成功'));
});

/**
 * 删除帖子
 */
exports.deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  await communityService.deletePost(postId, userId, isAdmin);

  res.json(success(null, '删除成功'));
});

/**
 * 点赞/取消点赞帖子
 */
exports.toggleLikePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  const result = await communityService.toggleLikePost(postId, userId);

  res.json(success(result, result.isLiked ? '点赞成功' : '已取消点赞'));
});

/**
 * 收藏/取消收藏帖子
 */
exports.toggleFavoritePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  const result = await communityService.toggleFavoritePost(postId, userId);

  res.json(success(result, result.isFavorited ? '收藏成功' : '已取消收藏'));
});

/**
 * 获取我的收藏
 */
exports.getMyFavorites = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, pageSize = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        topic: {
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
        }
      }
    }),
    prisma.favorite.count({ where: { userId } })
  ]);

  const posts = favorites.map(fav => communityService.formatPost(fav.topic));

  res.json(success({
    posts,
    total,
    hasMore: skip + take < total,
    currentPage: parseInt(page)
  }));
});

