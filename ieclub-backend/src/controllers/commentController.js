// ===== 2. commentController.js - 评论控制器 =====
const commentService = require('../services/commentService');
const creditService = require('../services/creditService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

class CommentController {
  // 获取评论列表
  static async getComments(req, res) {
    return asyncHandler(async (req, res) => {
      const { topicId } = req.params;
      const { page = 1, pageSize = 20, sortBy } = req.query;

      const result = await commentService.getComments(topicId, {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        sortBy
      });

      res.json(success(result));
    })(req, res);
  }

  // 创建评论
  static async createComment(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.id;
      const { topicId, content, parentId, images } = req.body;

      const comment = await commentService.createComment(userId, {
        topicId,
        content,
        parentId,
        images
      });

      // 添加积分和经验值
      await creditService.addCredits(userId, 'comment_create', {
        relatedType: 'comment',
        relatedId: comment.id,
        metadata: { topicId },
      });

      // 检查是否是第一条评论，授予勋章
      const { PrismaClient } = require('@prisma/client');
      const prisma = require('../config/database');
      
      const userCommentsCount = await prisma.comment.count({
        where: { userId },
      });
      
      if (userCommentsCount === 1) {
        await creditService.awardBadge(userId, 'first_comment');
      }

      res.status(201).json(success(comment, '评论成功'));
    })(req, res);
  }

  // 点赞评论
  static async likeComment(req, res) {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await commentService.toggleLikeComment(id, userId);

      res.json(success(result, result.isLiked ? '点赞成功' : '已取消点赞'));
    })(req, res);
  }

  // 删除评论
  static async deleteComment(req, res) {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      await commentService.deleteComment(id, userId, isAdmin);

      res.json(success(null, '删除成功'));
    })(req, res);
  }

  // 获取评论的回复列表
  static async getReplies(req, res) {
    return asyncHandler(async (req, res) => {
      const { commentId } = req.params;
      const { page = 1, pageSize = 20 } = req.query;

      const result = await commentService.getReplies(commentId, {
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });

      res.json(success(result));
    })(req, res);
  }
}

module.exports = CommentController;