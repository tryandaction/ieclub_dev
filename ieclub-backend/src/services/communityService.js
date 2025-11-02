// ieclub-backend/src/services/communityService.js
// 社区服务层 - 处理帖子、评论、点赞等业务逻辑（优化版）

const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');
const { cacheGet, cacheSet, cacheDel } = require('../utils/redis-enhanced');

// 缓存配置
const CACHE_TTL = {
  HOT_POSTS: 600,     // 热门帖子10分钟
  LATEST_POSTS: 120,  // 最新帖子2分钟
  POST_DETAIL: 300,   // 帖子详情5分钟
  RECOMMENDED: 300    // 推荐帖子5分钟
};

class CommunityService {
  /**
   * 创建帖子
   */
  async createPost(userId, data) {
    const { title, content, categoryId, tags, images } = data;

    // 验证分类是否存在
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      if (!category) {
        throw new AppError('分类不存在', 400);
      }
    }

    // 创建帖子
    const post = await prisma.topic.create({
      data: {
        title,
        content,
        categoryId,
        tags: tags ? JSON.stringify(tags) : null,
        images: images ? JSON.stringify(images) : null,
        authorId: userId,
        publishedAt: new Date()
      },
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
    });

    // 更新用户帖子数
    await prisma.user.update({
      where: { id: userId },
      data: { topicsCount: { increment: 1 } }
    });

    logger.info(`用户 ${userId} 创建帖子: ${post.id}`);

    return this.formatPost(post);
  }

  /**
   * 获取帖子列表（优化版 - 添加缓存）
   */
  async getPosts(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      categoryId,
      sortBy = 'latest', // latest, hot, recommended
      keyword,
      userId // 特定用户的帖子
    } = options;

    // 生成缓存键
    const cacheKey = `posts:list:${JSON.stringify({
      page, pageSize, categoryId, sortBy, keyword, userId
    })}`;

    // 根据sortBy选择缓存时间
    let cacheTTL = CACHE_TTL.LATEST_POSTS;
    if (sortBy === 'hot') {
      cacheTTL = CACHE_TTL.HOT_POSTS;
    } else if (sortBy === 'recommended') {
      cacheTTL = CACHE_TTL.RECOMMENDED;
    }

    // 尝试从缓存获取
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.debug('帖子列表命中缓存', { sortBy, page, categoryId });
      return cached;
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 构建查询条件
    const where = {
      publishedAt: { not: null }
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (userId) {
      where.authorId = userId;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } }
      ];
    }

    // 构建排序
    let orderBy = [];
    switch (sortBy) {
      case 'hot':
        orderBy = [
          { likesCount: 'desc' },
          { commentsCount: 'desc' },
          { viewsCount: 'desc' }
        ];
        break;
      case 'recommended':
        // 综合排序：最近发布且有一定互动
        orderBy = [
          { likesCount: 'desc' },
          { createdAt: 'desc' }
        ];
        break;
      case 'latest':
      default:
        orderBy = [{ createdAt: 'desc' }];
    }

    // 优化：使用 select 代替 include
    const [posts, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
          images: true,
          likesCount: true,
          commentsCount: true,
          viewsCount: true,
          bookmarksCount: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
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

    const result = {
      posts: posts.map(post => this.formatPost(post)),
      total,
      hasMore: skip + take < total,
      currentPage: page
    };

    // 缓存结果
    await cacheSet(cacheKey, result, cacheTTL);

    return result;
  }

  /**
   * 获取帖子详情
   */
  async getPostById(postId, userId) {
    const post = await prisma.topic.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            level: true,
            bio: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        likes: userId ? {
          where: { userId },
          select: { id: true }
        } : false,
        favorites: userId ? {
          where: { userId },
          select: { id: true }
        } : false
      }
    });

    if (!post || !post.publishedAt) {
      throw new AppError('帖子不存在', 404);
    }

    // 增加浏览量
    await prisma.topic.update({
      where: { id: postId },
      data: { viewsCount: { increment: 1 } }
    });

    const formattedPost = this.formatPost(post);
    
    // 添加用户交互状态
    if (userId) {
      formattedPost.isLiked = post.likes && post.likes.length > 0;
      formattedPost.isFavorited = post.favorites && post.favorites.length > 0;
    }

    return formattedPost;
  }

  /**
   * 更新帖子
   */
  async updatePost(postId, userId, data) {
    const post = await prisma.topic.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new AppError('帖子不存在', 404);
    }

    if (post.authorId !== userId) {
      throw new AppError('无权修改此帖子', 403);
    }

    const { title, content, categoryId, tags, images } = data;

    const updatedPost = await prisma.topic.update({
      where: { id: postId },
      data: {
        title: title || post.title,
        content: content || post.content,
        categoryId: categoryId || post.categoryId,
        tags: tags ? JSON.stringify(tags) : post.tags,
        images: images ? JSON.stringify(images) : post.images,
        updatedAt: new Date()
      },
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
    });

    logger.info(`用户 ${userId} 更新帖子: ${postId}`);

    return this.formatPost(updatedPost);
  }

  /**
   * 删除帖子
   */
  async deletePost(postId, userId, isAdmin = false) {
    const post = await prisma.topic.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new AppError('帖子不存在', 404);
    }

    if (post.authorId !== userId && !isAdmin) {
      throw new AppError('无权删除此帖子', 403);
    }

    // 删除帖子（级联删除评论和点赞）
    await prisma.topic.delete({
      where: { id: postId }
    });

    // 更新用户帖子数
    await prisma.user.update({
      where: { id: post.authorId },
      data: { topicsCount: { decrement: 1 } }
    });

    logger.info(`帖子 ${postId} 已删除 (操作者: ${userId})`);

    return { message: '删除成功' };
  }

  /**
   * 点赞/取消点赞帖子
   */
  async toggleLikePost(postId, userId) {
    const post = await prisma.topic.findUnique({
      where: { id: postId }
    });

    if (!post || !post.publishedAt) {
      throw new AppError('帖子不存在', 404);
    }

    // 检查是否已点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: 'topic',
          targetId: postId
        }
      }
    });

    if (existingLike) {
      // 取消点赞
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id }
        }),
        prisma.topic.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } }
        }),
        prisma.user.update({
          where: { id: post.authorId },
          data: { likesCount: { decrement: 1 } }
        })
      ]);

      logger.info(`用户 ${userId} 取消点赞帖子: ${postId}`);
      return { isLiked: false, likesCount: post.likesCount - 1 };
    } else {
      // 点赞
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            targetType: 'topic',
            targetId: postId
          }
        }),
        prisma.topic.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } }
        }),
        prisma.user.update({
          where: { id: post.authorId },
          data: { likesCount: { increment: 1 } }
        })
      ]);

      // 发送点赞通知
      if (post.authorId !== userId) {
        await notificationService.notifyLike(
          post.authorId,
          userId,
          'topic',
          postId,
          post.title
        ).catch(err => logger.error('发送点赞通知失败:', err));
      }

      logger.info(`用户 ${userId} 点赞帖子: ${postId}`);
      return { isLiked: true, likesCount: post.likesCount + 1 };
    }
  }

  /**
   * 收藏/取消收藏帖子
   */
  async toggleFavoritePost(postId, userId) {
    const post = await prisma.topic.findUnique({
      where: { id: postId }
    });

    if (!post || !post.publishedAt) {
      throw new AppError('帖子不存在', 404);
    }

    // 检查是否已收藏
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_topicId: {
          userId,
          topicId: postId
        }
      }
    });

    if (existingFavorite) {
      // 取消收藏
      await prisma.$transaction([
        prisma.favorite.delete({
          where: { id: existingFavorite.id }
        }),
        prisma.topic.update({
          where: { id: postId },
          data: { favoritesCount: { decrement: 1 } }
        })
      ]);

      logger.info(`用户 ${userId} 取消收藏帖子: ${postId}`);
      return { isFavorited: false, favoritesCount: post.favoritesCount - 1 };
    } else {
      // 收藏
      await prisma.$transaction([
        prisma.favorite.create({
          data: {
            userId,
            topicId: postId
          }
        }),
        prisma.topic.update({
          where: { id: postId },
          data: { favoritesCount: { increment: 1 } }
        })
      ]);

      logger.info(`用户 ${userId} 收藏帖子: ${postId}`);
      return { isFavorited: true, favoritesCount: post.favoritesCount + 1 };
    }
  }

  /**
   * 格式化帖子数据
   */
  formatPost(post) {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      tags: post.tags ? JSON.parse(post.tags) : [],
      images: post.images ? JSON.parse(post.images) : [],
      author: post.author ? {
        id: post.author.id,
        nickname: post.author.nickname,
        avatar: post.author.avatar,
        level: post.author.level,
        bio: post.author.bio
      } : null,
      category: post.category ? {
        id: post.category.id,
        name: post.category.name
      } : null,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      favoritesCount: post.favoritesCount || 0,
      viewsCount: post.viewsCount || 0,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null
    };
  }
}

module.exports = new CommunityService();

