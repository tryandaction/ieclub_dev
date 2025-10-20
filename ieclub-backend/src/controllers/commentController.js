// ===== 2. commentController.js - 评论控制器 =====
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class CommentController {
  // 获取评论列表
  static async getComments(req, res, next) {
    try {
      const { topicId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: {
            topicId,
            status: 'published',
            parentId: null // 只获取顶级评论
          },
          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                avatar: true
              }
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    nickname: true,
                    avatar: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take
        }),
        prisma.comment.count({
          where: { topicId, status: 'published' }
        })
      ]);

      res.json({
        success: true,
        data: {
          comments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / take)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 创建评论
  static async createComment(req, res, next) {
    try {
      const userId = req.user.id;
      const { topicId, content, parentId, replyToUserId } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: '评论内容不能为空'
        });
      }

      // 创建评论
      const comment = await prisma.comment.create({
        data: {
          topicId,
          authorId: userId,
          content: content.trim(),
          parentId,
          rootId: parentId ? (await prisma.comment.findUnique({ where: { id: parentId } }))?.rootId || parentId : null,
          replyToUserId
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          }
        }
      });

      // 更新话题评论数
      await prisma.topic.update({
        where: { id: topicId },
        data: { commentsCount: { increment: 1 } }
      });

      // TODO: 发送通知给话题作者和被回复者

      res.status(201).json({
        success: true,
        message: '评论成功',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  // 点赞评论
  static async likeComment(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const existingLike = await prisma.like.findUnique({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: 'comment',
            targetId: id
          }
        }
      });

      if (existingLike) {
        // 取消点赞
        await prisma.$transaction([
          prisma.like.delete({ where: { id: existingLike.id } }),
          prisma.comment.update({
            where: { id },
            data: { likesCount: { decrement: 1 } }
          })
        ]);

        return res.json({
          success: true,
          message: '已取消点赞',
          data: { isLiked: false }
        });
      } else {
        // 添加点赞
        await prisma.$transaction([
          prisma.like.create({
            data: { userId, targetType: 'comment', targetId: id }
          }),
          prisma.comment.update({
            where: { id },
            data: { likesCount: { increment: 1 } }
          })
        ]);

        return res.json({
          success: true,
          message: '点赞成功',
          data: { isLiked: true }
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // 删除评论
  static async deleteComment(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const comment = await prisma.comment.findUnique({
        where: { id }
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: '评论不存在'
        });
      }

      if (comment.authorId !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权限删除此评论'
        });
      }

      // 软删除
      await prisma.comment.update({
        where: { id },
        data: { status: 'deleted' }
      });

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CommentController;