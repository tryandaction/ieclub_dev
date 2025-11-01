// ieclub-backend/src/services/commentService.js
// 评论服务层 - 处理评论的增删改查和点赞

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');

class CommentService {
  /**
   * 创建评论
   */
  async createComment(userId, data) {
    const { topicId, content, images, parentId } = data;

    // 验证帖子是否存在
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, authorId: true, publishedAt: true }
    });

    if (!topic || !topic.publishedAt) {
      throw new AppError('帖子不存在', 404);
    }

    // 如果是回复评论，验证父评论
    let rootId = null;
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, rootId: true, topicId: true }
      });

      if (!parentComment) {
        throw new AppError('父评论不存在', 404);
      }

      if (parentComment.topicId !== topicId) {
        throw new AppError('评论不属于该帖子', 400);
      }

      // 设置根评论ID
      rootId = parentComment.rootId || parentId;

      // 更新父评论的回复数
      await prisma.comment.update({
        where: { id: parentId },
        data: { repliesCount: { increment: 1 } }
      });
    }

    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        content,
        images: images ? JSON.stringify(images) : null,
        topicId,
        userId,
        parentId,
        rootId
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            level: true
          }
        },
        parent: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        }
      }
    });

    // 更新帖子评论数
    await prisma.topic.update({
      where: { id: topicId },
      data: { commentsCount: { increment: 1 } }
    });

    // 更新用户评论数
    await prisma.user.update({
      where: { id: userId },
      data: { commentsCount: { increment: 1 } }
    });

    // 发送通知
    const websocketService = require('./websocketService');
    if (parentId) {
      // 回复评论通知
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { userId: true }
      });
      if (parentComment && parentComment.userId !== userId) {
        const notification = await notificationService.createReplyNotification(
          parentComment.userId,
          userId,
          comment.id,
          topicId,
          content
        ).catch(err => {
          logger.error('发送回复通知失败:', err);
          return null;
        });
        
        // WebSocket 实时推送
        if (notification) {
          websocketService.sendNotification(parentComment.userId, notification);
        }
      }
    } else {
      // 评论帖子通知
      const topicData = await prisma.topic.findUnique({
        where: { id: topicId },
        select: { authorId: true, title: true }
      });
      if (topicData && topicData.authorId !== userId) {
        const notification = await notificationService.createCommentNotification(
          topicData.authorId,
          userId,
          'topic',
          topicId,
          topicData.title,
          content
        ).catch(err => {
          logger.error('发送评论通知失败:', err);
          return null;
        });
        
        // WebSocket 实时推送
        if (notification) {
          websocketService.sendNotification(topicData.authorId, notification);
        }
      }
    }

    logger.info(`用户 ${userId} 评论帖子: ${topicId}`);

    return this.formatComment(comment);
  }

  /**
   * 获取评论列表
   */
  async getComments(topicId, options = {}) {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'latest', // latest, hot
      parentId = null // null表示获取顶级评论
    } = options;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 构建查询条件
    const where = {
      topicId,
      parentId: parentId || null // 顶级评论的parentId为null
    };

    // 构建排序
    let orderBy = [];
    if (sortBy === 'hot') {
      orderBy = [
        { likesCount: 'desc' },
        { repliesCount: 'desc' },
        { createdAt: 'desc' }
      ];
    } else {
      orderBy = [{ createdAt: 'desc' }];
    }

    // 查询评论
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              level: true
            }
          },
          parent: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  nickname: true
                }
              }
            }
          },
          // 获取子评论（最多3条预览）
          replies: parentId === null ? {
            take: 3,
            orderBy: [{ createdAt: 'desc' }],
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                  level: true
                }
              },
              parent: {
                select: {
                  id: true,
                  user: {
                    select: {
                      id: true,
                      nickname: true
                    }
                  }
                }
              }
            }
          } : false
        }
      }),
      prisma.comment.count({ where })
    ]);

    return {
      comments: comments.map(comment => this.formatComment(comment)),
      total,
      hasMore: skip + take < total,
      currentPage: page
    };
  }

  /**
   * 获取评论的回复列表
   */
  async getReplies(commentId, options = {}) {
    const {
      page = 1,
      pageSize = 20
    } = options;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 查询回复
    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: { parentId: commentId },
        skip,
        take,
        orderBy: [{ createdAt: 'asc' }], // 回复按时间正序
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              level: true
            }
          },
          parent: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  nickname: true
                }
              }
            }
          }
        }
      }),
      prisma.comment.count({ where: { parentId: commentId } })
    ]);

    return {
      replies: replies.map(reply => this.formatComment(reply)),
      total,
      hasMore: skip + take < total,
      currentPage: page
    };
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId, userId, isAdmin = false) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        topic: {
          select: { id: true, authorId: true }
        }
      }
    });

    if (!comment) {
      throw new AppError('评论不存在', 404);
    }

    // 权限检查：评论作者、帖子作者或管理员可删除
    const canDelete = comment.userId === userId || 
                      comment.topic.authorId === userId || 
                      isAdmin;

    if (!canDelete) {
      throw new AppError('无权删除此评论', 403);
    }

    // 统计要删除的评论数（包括子评论）
    const deleteCount = await prisma.comment.count({
      where: {
        OR: [
          { id: commentId },
          { rootId: commentId },
          { parentId: commentId }
        ]
      }
    });

    // 删除评论及其所有子评论
    await prisma.$transaction([
      // 删除评论
      prisma.comment.deleteMany({
        where: {
          OR: [
            { id: commentId },
            { rootId: commentId },
            { parentId: commentId }
          ]
        }
      }),
      // 更新帖子评论数
      prisma.topic.update({
        where: { id: comment.topicId },
        data: { commentsCount: { decrement: deleteCount } }
      }),
      // 更新用户评论数
      prisma.user.update({
        where: { id: comment.userId },
        data: { commentsCount: { decrement: 1 } }
      })
    ]);

    // 如果有父评论，更新父评论的回复数
    if (comment.parentId) {
      await prisma.comment.update({
        where: { id: comment.parentId },
        data: { repliesCount: { decrement: 1 } }
      });
    }

    logger.info(`评论 ${commentId} 已删除 (操作者: ${userId})`);

    return { message: '删除成功' };
  }

  /**
   * 点赞/取消点赞评论
   */
  async toggleLikeComment(commentId, userId) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new AppError('评论不存在', 404);
    }

    // 检查是否已点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: 'comment',
          targetId: commentId
        }
      }
    });

    if (existingLike) {
      // 取消点赞
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id }
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: { likesCount: { decrement: 1 } }
        })
      ]);

      logger.info(`用户 ${userId} 取消点赞评论: ${commentId}`);
      return { isLiked: false, likesCount: comment.likesCount - 1 };
    } else {
      // 点赞
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            targetType: 'comment',
            targetId: commentId
          }
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: { likesCount: { increment: 1 } }
        })
      ]);

      logger.info(`用户 ${userId} 点赞评论: ${commentId}`);
      return { isLiked: true, likesCount: comment.likesCount + 1 };
    }
  }

  /**
   * 格式化评论数据
   */
  formatComment(comment) {
    return {
      id: comment.id,
      content: comment.content,
      images: comment.images ? JSON.parse(comment.images) : [],
      user: comment.user ? {
        id: comment.user.id,
        nickname: comment.user.nickname,
        avatar: comment.user.avatar,
        level: comment.user.level
      } : null,
      parentId: comment.parentId,
      rootId: comment.rootId,
      replyTo: comment.parent && comment.parent.user ? {
        id: comment.parent.user.id,
        nickname: comment.parent.user.nickname
      } : null,
      likesCount: comment.likesCount || 0,
      repliesCount: comment.repliesCount || 0,
      replies: comment.replies ? comment.replies.map(reply => this.formatComment(reply)) : [],
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString()
    };
  }
}

module.exports = new CommentService();

