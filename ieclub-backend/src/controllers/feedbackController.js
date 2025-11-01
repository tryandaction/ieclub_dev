// src/controllers/feedbackController.js
// 用户反馈控制器

const { PrismaClient } = require('@prisma/client');
const response = require('../utils/response');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const WechatService = require('../services/wechatService');
const prisma = require('../config/database');

class FeedbackController {
  /**
   * 提交反馈
   * POST /api/v1/feedback
   */
  static async createFeedback(req, res) {
    try {
      const userId = req.userId;
      const {
        type, // 反馈类型: bug, feature, improvement, other
        title,
        content,
        contact, // 联系方式（可选）
        images, // 截图（可选）
        platform, // 平台: web, miniprogram
        version, // 版本号
        deviceInfo, // 设备信息
      } = req.body;

      // 验证必填字段
      if (!type || !title || !content) {
        throw new AppError('VALIDATION_REQUIRED_FIELD', '反馈类型、标题和内容为必填项');
      }

      // 验证反馈类型
      const validTypes = ['bug', 'feature', 'improvement', 'other'];
      if (!validTypes.includes(type)) {
        throw new AppError('VALIDATION_INVALID_FORMAT', '无效的反馈类型');
      }

      // 验证字段长度
      if (title.length < 5 || title.length > 100) {
        throw new AppError('VALIDATION_INVALID_FORMAT', '标题长度必须在5-100字符之间');
      }

      if (content.length < 10 || content.length > 2000) {
        throw new AppError('VALIDATION_INVALID_FORMAT', '内容长度必须在10-2000字符之间');
      }

      // 内容安全检测
      try {
        const titleCheck = await WechatService.msgSecCheck(title);
        if (!titleCheck.pass) {
          throw new AppError('VALIDATION_INVALID_FORMAT', '标题包含敏感内容，请修改后重试');
        }

        const contentCheck = await WechatService.msgSecCheck(content);
        if (!contentCheck.pass) {
          throw new AppError('VALIDATION_INVALID_FORMAT', '内容包含敏感内容，请修改后重试');
        }
      } catch (error) {
        logger.warn('内容安全检测失败，跳过检测:', error.message);
      }

      // 限制用户提交频率（每天最多10条反馈）
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayFeedbackCount = await prisma.feedback.count({
        where: {
          userId,
          createdAt: {
            gte: todayStart,
          },
        },
      });

      if (todayFeedbackCount >= 10) {
        throw new AppError('BUSINESS_LIMIT_EXCEEDED', '今日反馈次数已达上限（10条）');
      }

      // 创建反馈
      const feedback = await prisma.feedback.create({
        data: {
          userId,
          type,
          title: title.trim(),
          content: content.trim(),
          contact: contact?.trim(),
          images: images || [],
          platform: platform || 'web',
          version: version || '1.0.0',
          deviceInfo: deviceInfo || {},
          status: 'pending', // pending, processing, resolved, closed
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              email: true,
            },
          },
        },
      });

      logger.info('用户提交反馈:', {
        feedbackId: feedback.id,
        userId,
        type,
        title,
      });

      return response.success(res, feedback, '反馈提交成功，感谢您的宝贵意见！', 201);
    } catch (error) {
      logger.error('提交反馈失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('SYSTEM_ERROR', '提交反馈失败，请稍后重试');
    }
  }

  /**
   * 获取我的反馈列表
   * GET /api/v1/feedback/my
   */
  static async getMyFeedback(req, res) {
    try {
      const userId = req.userId;
      const {
        page = 1,
        limit = 20,
        type,
        status,
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // 构建查询条件
      const where = { userId };

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      // 查询反馈列表
      const [feedbacks, total] = await Promise.all([
        prisma.feedback.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            reply: true, // 管理员回复
          },
        }),
        prisma.feedback.count({ where }),
      ]);

      return response.paginated(res, feedbacks, {
        page: parseInt(page),
        limit: take,
        total,
      });
    } catch (error) {
      logger.error('获取反馈列表失败:', error);
      throw new AppError('SYSTEM_ERROR', '获取反馈列表失败');
    }
  }

  /**
   * 获取反馈详情
   * GET /api/v1/feedback/:id
   */
  static async getFeedbackDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const feedback = await prisma.feedback.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          reply: {
            include: {
              admin: {
                select: {
                  id: true,
                  nickname: true,
                },
              },
            },
          },
        },
      });

      if (!feedback) {
        throw new AppError('RESOURCE_NOT_FOUND', '反馈不存在');
      }

      // 只能查看自己的反馈（非管理员）
      if (feedback.userId !== userId) {
        throw new AppError('AUTH_FORBIDDEN', '无权查看该反馈');
      }

      return response.success(res, feedback);
    } catch (error) {
      logger.error('获取反馈详情失败:', error);
      throw error;
    }
  }

  /**
   * 删除反馈
   * DELETE /api/v1/feedback/:id
   */
  static async deleteFeedback(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const feedback = await prisma.feedback.findUnique({
        where: { id },
      });

      if (!feedback) {
        throw new AppError('RESOURCE_NOT_FOUND', '反馈不存在');
      }

      // 只能删除自己的反馈
      if (feedback.userId !== userId) {
        throw new AppError('AUTH_FORBIDDEN', '无权删除该反馈');
      }

      // 已处理的反馈不能删除
      if (feedback.status !== 'pending') {
        throw new AppError('BUSINESS_INVALID_OPERATION', '该反馈已被处理，无法删除');
      }

      await prisma.feedback.delete({
        where: { id },
      });

      logger.info('用户删除反馈:', { feedbackId: id, userId });

      return response.success(res, null, '删除成功');
    } catch (error) {
      logger.error('删除反馈失败:', error);
      throw error;
    }
  }

  /**
   * 管理员获取所有反馈（需要管理员权限）
   * GET /api/v1/admin/feedback
   */
  static async getAllFeedback(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        platform,
        search,
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // 构建查询条件
      const where = {};

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      if (platform) {
        where.platform = platform;
      }

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { content: { contains: search } },
        ];
      }

      // 查询反馈列表
      const [feedbacks, total] = await Promise.all([
        prisma.feedback.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                email: true,
              },
            },
            reply: true,
          },
        }),
        prisma.feedback.count({ where }),
      ]);

      return response.paginated(res, feedbacks, {
        page: parseInt(page),
        limit: take,
        total,
      });
    } catch (error) {
      logger.error('获取所有反馈失败:', error);
      throw new AppError('SYSTEM_ERROR', '获取反馈列表失败');
    }
  }

  /**
   * 管理员回复反馈（需要管理员权限）
   * POST /api/v1/admin/feedback/:id/reply
   */
  static async replyFeedback(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.userId;
      const { content, status } = req.body;

      if (!content || content.trim().length < 5) {
        throw new AppError('VALIDATION_REQUIRED_FIELD', '回复内容至少5个字符');
      }

      const feedback = await prisma.feedback.findUnique({
        where: { id },
      });

      if (!feedback) {
        throw new AppError('RESOURCE_NOT_FOUND', '反馈不存在');
      }

      // 创建回复并更新状态
      const [reply, updatedFeedback] = await Promise.all([
        prisma.feedbackReply.create({
          data: {
            feedbackId: id,
            adminId,
            content: content.trim(),
          },
        }),
        prisma.feedback.update({
          where: { id },
          data: {
            status: status || 'processing',
            processedAt: new Date(),
          },
        }),
      ]);

      logger.info('管理员回复反馈:', {
        feedbackId: id,
        adminId,
        status,
      });

      return response.success(res, { reply, feedback: updatedFeedback }, '回复成功');
    } catch (error) {
      logger.error('回复反馈失败:', error);
      throw error;
    }
  }

  /**
   * 管理员更新反馈状态（需要管理员权限）
   * PATCH /api/v1/admin/feedback/:id/status
   */
  static async updateFeedbackStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'processing', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        throw new AppError('VALIDATION_INVALID_FORMAT', '无效的状态值');
      }

      const feedback = await prisma.feedback.update({
        where: { id },
        data: {
          status,
          processedAt: status !== 'pending' ? new Date() : null,
        },
      });

      logger.info('管理员更新反馈状态:', { feedbackId: id, status });

      return response.success(res, feedback, '状态更新成功');
    } catch (error) {
      logger.error('更新反馈状态失败:', error);
      throw error;
    }
  }
}

module.exports = FeedbackController;

