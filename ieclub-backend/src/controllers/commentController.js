// src/controllers/commentController.js
// 评论控制器 - 完整实现

const { PrismaClient } = require('@prisma/client');
const response = require('../utils/response');
const logger = require('../utils/logger');
const WechatService = require('../services/wechatService');
const { CacheManager } = require('../utils/redis');
const config = require('../config');

const prisma = new PrismaClient();

class CommentController {
  /**
   * 获取评论列表（支持嵌套回复）
   * GET /api/v1/topics/:topicId/comments
   */
  static async getComments(req, res) {
    try {
      const { topicId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'hot', // hot: 热门, new: 最新
      } = req.query;

      const userId = req.userId; // 可能为空（未登录）

      // 检查话题是否存在
      const topic = await prisma.topic.findUnique({
        where: { id: topicId },
        select: { id: true, status: true },
      });

      if (!topic || topic.status !== 'published') {
        return response.notFound(res, '话题不存在');
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // 构建排序
      let orderBy = {};
      if (sortBy === 'hot') {
        orderBy = { likesCount: 'desc' };
      } else {
        orderBy = { createdAt: 'desc' };
      }

      // 查询根评论（没有父评论的评论）
      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: {
            topicId,
            parentId: null,
            status: 'published',
          },
          orderBy,
          skip,
          take,
          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                level: true,
                isCertified: true,
              },
            },
            // 包含前3条回复
            replies: {
              take: 3,
              orderBy: { createdAt: 'asc' },
              include: {
                author: {
                  select: {
                    id: true,
                    nickname: true,
                    avatar: true,
                  },
                },
                parent: {
                  select: {
                    id: true,
                    author: {
                      select: { id: true, nickname: true },
                    },
                  },
                },
              },
            },
          },
        }),
        prisma.comment.count({
          where: {
            topicId,
            parentId: null,
            status: 'published',
          },
        }),
      ]);

      // 如果用户已登录，检查点赞状态
      if (userId) {
        const commentIds = comments.map((c) => c.id);
        const userLikes = await prisma.like.findMany({
          where: {
            userId,
            targetType: 'comment',
            targetId: { in: commentIds },
          },
          select: { targetId: true },
        });

        const likedSet = new Set(userLikes.map((l) => l.targetId));

        comments.forEach((comment) => {
          comment.isLiked = likedSet.has(comment.id);
          // 回复也需要检查
          if (comment.replies) {
            const replyIds = comment.replies.map((r) => r.id);
            comment.replies.forEach((reply) => {
              reply.isLiked = likedSet.has(reply.id);
            });
          }
        });
      }

      return response.paginated(res, comments, {
        page: parseInt(page),
        limit: take,
        total,
      });
    } catch (error) {
      logger.error('获取评论列表失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取评论的所有回复（分页）
   * GET /api/v1/comments/:id/replies
   */
  static async getReplies(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const userId = req.userId;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [replies, total] = await Promise.all([
        prisma.comment.findMany({
          where: {
            parentId: id,
            status: 'published',
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take,
          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
            parent: {
              select: {
                id: true,
                author: {
                  select: { id: true, nickname: true },
                },
              },
            },
          },
        }),
        prisma.comment.count({
          where: { parentId: id, status: 'published' },
        }),
      ]);

      // 检查点赞状态
      if (userId) {
        const replyIds = replies.map((r) => r.id);
        const userLikes = await prisma.like.findMany({
          where: {
            userId,
            targetType: 'comment',
            targetId: { in: replyIds },
          },
          select: { targetId: true },
        });

        const likedSet = new Set(userLikes.map((l) => l.targetId));
        replies.forEach((reply) => {
          reply.isLiked = likedSet.has(reply.id);
        });
      }

      return response.paginated(res, replies, {
        page: parseInt(page),
        limit: take,
        total,
      });
    } catch (error) {
      logger.error('获取回复失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 创建评论
   * POST /api/v1/topics/:topicId/comments
   */
  static async createComment(req, res) {
    try {
      const { topicId } = req.params;
      const { content, parentId, images } = req.body;
      const userId = req.userId;

      // 验证必填字段
      if (!content || content.trim().length === 0) {
        return response.error(res, '评论内容不能为空');
      }

      // 验证长度
      if (content.length < config.business.comment.minLength) {
        return response.error(
          res,
          `评论至少 ${config.business.comment.minLength} 个字符`
        );
      }

      if (content.length > config.business.comment.maxLength) {
        return response.error(
          res,
          `评论最多 ${config.business.comment.maxLength} 个字符`
        );
      }

      // 检查话题是否存在
      const topic = await prisma.topic.findUnique({
        where: { id: topicId },
        select: { id: true, status: true, authorId: true },
      });

      if (!topic || topic.status !== 'published') {
        return response.notFound(res, '话题不存在或已关闭');
      }

      // 如果是回复，检查父评论是否存在
      let rootId = null;
      if (parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: parentId },
          select: { id: true, topicId: true, rootId: true },
        });

        if (!parentComment) {
          return response.notFound(res, '父评论不存在');
        }

        if (parentComment.topicId !== topicId) {
          return response.error(res, '评论不属于该话题');
        }

        // 确定根评论 ID
        rootId = parentComment.rootId || parentComment.id;
      }

      // 内容安全检测
      const securityCheck = await WechatService.msgSecCheck(content);
      if (!securityCheck.pass) {
        return response.error(res, '评论包含敏感内容，请修改后重试', 400);
      }

      // 创建评论
      const comment = await prisma.comment.create({
        data: {
          topicId,
          authorId: userId,
          parentId: parentId || null,
          rootId,
          content,
          images: images || null,
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              level: true,
            },
          },
          parent: parentId
            ? {
                select: {
                  id: true,
                  author: {
                    select: { id: true, nickname: true },
                  },
                },
              }
            : undefined,
        },
      });

      // 更新话题评论数
      await prisma.topic.update({
        where: { id: topicId },
        data: {
          commentsCount: { increment: 1 },
          lastActiveAt: new Date(),
        },
      });

      // 如果是回复，更新父评论的回复数
      if (parentId) {
        await prisma.comment.update({
          where: { id: parentId },
          data: { repliesCount: { increment: 1 } },
        });
      }

      // 更新用户评论数和积分
      await prisma.user.update({
        where: { id: userId },
        data: {
          commentsCount: { increment: 1 },
          credits: { increment: config.business.credits.commentCreate },
          exp: { increment: config.business.credits.commentCreate },
        },
      });

      // 记录用户行为
      await prisma.userAction
        .create({
          data: {
            userId,
            actionType: 'comment',
            targetType: 'topic',
            targetId: topicId,
          },
        })
        .catch(() => {});

      // 发送通知
      if (parentId) {
        // 回复通知
        const parentComment = await prisma.comment.findUnique({
          where: { id: parentId },
          select: { authorId: true },
        });

        if (parentComment && parentComment.authorId !== userId) {
          await prisma.notification
            .create({
              data: {
                userId: parentComment.authorId,
                type: 'reply',
                title: '收到新回复',
                content: `有人回复了你的评论`,
                actorId: userId,
                targetType: 'comment',
                targetId: comment.id,
                link: `/pages/topic-detail/index?id=${topicId}#comment-${comment.id}`,
              },
            })
            .catch(() => {});
        }
      } else if (topic.authorId !== userId) {
        // 评论通知（给话题作者）
        await prisma.notification
          .create({
            data: {
              userId: topic.authorId,
              type: 'comment',
              title: '收到新评论',
              content: `有人评论了你的话题`,
              actorId: userId,
              targetType: 'topic',
              targetId: topicId,
              link: `/pages/topic-detail/index?id=${topicId}#comment-${comment.id}`,
            },
          })
          .catch(() => {});
      }

      // 清除缓存
      await CacheManager.del(CacheManager.makeKey('topic', topicId));

      return response.created(res, comment, '评论成功');
    } catch (error) {
      logger.error('创建评论失败:', error);
      return response.serverError(res, '评论失败');
    }
  }

  /**
   * 更新评论
   * PUT /api/v1/comments/:id
   */
  static async updateComment(req, res) {
    try {
      const { id } = req.params;
      const { content, images } = req.body;
      const userId = req.userId;

      // 检查评论是否存在
      const comment = await prisma.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        return response.notFound(res, '评论不存在');
      }

      if (comment.authorId !== userId) {
        return response.forbidden(res, '无权修改此评论');
      }

      // 内容安全检测
      if (content) {
        const check = await WechatService.msgSecCheck(content);
        if (!check.pass) {
          return response.error(res, '评论包含敏感内容', 400);
        }
      }

      // 更新评论
      const updatedComment = await prisma.comment.update({
        where: { id },
        data: {
          ...(content && { content }),
          ...(images !== undefined && { images }),
        },
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      });

      return response.success(res, updatedComment, '更新成功');
    } catch (error) {
      logger.error('更新评论失败:', error);
      return response.serverError(res, '更新失败');
    }
  }

  /**
   * 删除评论
   * DELETE /api/v1/comments/:id
   */
  static async deleteComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const comment = await prisma.comment.findUnique({
        where: { id },
        select: {
          id: true,
          authorId: true,
          topicId: true,
          parentId: true,
          repliesCount: true,
        },
      });

      if (!comment) {
        return response.notFound(res, '评论不存在');
      }

      if (comment.authorId !== userId) {
        return response.forbidden(res, '无权删除此评论');
      }

      // 软删除
      await prisma.comment.update({
        where: { id },
        data: { status: 'deleted' },
      });

      // 更新话题评论数
      await prisma.topic.update({
        where: { id: comment.topicId },
        data: { commentsCount: { decrement: 1 } },
      });

      // 如果是回复，更新父评论回复数
      if (comment.parentId) {
        await prisma.comment.update({
          where: { id: comment.parentId },
          data: { repliesCount: { decrement: 1 } },
        });
      }

      // 更新用户评论数
      await prisma.user.update({
        where: { id: userId },
        data: { commentsCount: { decrement: 1 } },
      });

      return response.success(res, null, '删除成功');
    } catch (error) {
      logger.error('删除评论失败:', error);
      return response.serverError(res, '删除失败');
    }
  }

  /**
   * 点赞/取消点赞评论
   * POST /api/v1/comments/:id/like
   */
  static async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const comment = await prisma.comment.findUnique({
        where: { id },
        select: { id: true, status: true, likesCount: true, authorId: true },
      });

      if (!comment || comment.status !== 'published') {
        return response.notFound(res, '评论不存在');
      }

      const existingLike = await prisma.like.findFirst({
        where: {
          userId,
          targetType: 'comment',
          targetId: id,
        },
      });

      let isLiked = false;
      let likesCount = comment.likesCount;

      if (existingLike) {
        // 取消点赞
        await prisma.$transaction([
          prisma.like.delete({
            where: { id: existingLike.id },
          }),
          prisma.comment.update({
            where: { id },
            data: { likesCount: { decrement: 1 } },
          }),
        ]);
        likesCount -= 1;
      } else {
        // 点赞
        await prisma.$transaction([
          prisma.like.create({
            data: {
              userId,
              targetType: 'comment',
              targetId: id,
            },
          }),
          prisma.comment.update({
            where: { id },
            data: { likesCount: { increment: 1 } },
          }),
        ]);
        likesCount += 1;
        isLiked = true;

        // 通知评论作者
        if (comment.authorId !== userId) {
          await prisma.notification
            .create({
              data: {
                userId: comment.authorId,
                type: 'like',
                title: '收到新点赞',
                content: '有人点赞了你的评论',
                actorId: userId,
                targetType: 'comment',
                targetId: id,
              },
            })
            .catch(() => {});
        }
      }

      return response.success(
        res,
        {
          isLiked,
          likesCount,
        },
        isLiked ? '点赞成功' : '已取消点赞'
      );
    } catch (error) {
      logger.error('点赞操作失败:', error);
      return response.serverError(res);
    }
  }
}

module.exports = CommentController;