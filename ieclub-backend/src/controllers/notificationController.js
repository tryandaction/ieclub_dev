// ==================== ieclub-backend/src/controllers/notificationController.js ====================
const { PrismaClient } = require('@prisma/client');
const response = require('../utils/response');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class NotificationController {
  /**
   * 获取通知列表
   * GET /api/v1/notifications
   */
  static async getNotifications(req, res) {
    try {
      const { page = 1, limit = 20, type } = req.query;
      const userId = req.userId;

      const skip = (page - 1) * limit;

      const where = { receiverId: userId };
      if (type) {
        where.type = type;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.notification.count({ where }),
      ]);

      // 标记为已送达
      await prisma.notification.updateMany({
        where: {
          receiverId: userId,
          status: 'pending',
        },
        data: { status: 'delivered' },
      });

      return response.success(res, {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('获取通知列表失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取未读通知数量
   * GET /api/v1/notifications/unread-count
   */
  static async getUnreadCount(req, res) {
    try {
      const userId = req.userId;

      const count = await prisma.notification.count({
        where: {
          receiverId: userId,
          isRead: false,
        },
      });

      return response.success(res, { count });
    } catch (error) {
      logger.error('获取未读数量失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 标记通知为已读
   * PUT /api/v1/notifications/:id/read
   */
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const notification = await prisma.notification.findFirst({
        where: {
          id,
          receiverId: userId,
        },
      });

      if (!notification) {
        return response.notFound(res, '通知不存在');
      }

      await prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return response.success(res, null, '已标记为已读');
    } catch (error) {
      logger.error('标记已读失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 全部标记为已读
   * PUT /api/v1/notifications/read-all
   */
  static async markAllAsRead(req, res) {
    try {
      const userId = req.userId;

      await prisma.notification.updateMany({
        where: {
          receiverId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return response.success(res, null, '已全部标记为已读');
    } catch (error) {
      logger.error('全部标记已读失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 删除通知
   * DELETE /api/v1/notifications/:id
   */
  static async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const notification = await prisma.notification.findFirst({
        where: {
          id,
          receiverId: userId,
        },
      });

      if (!notification) {
        return response.notFound(res, '通知不存在');
      }

      await prisma.notification.delete({
        where: { id },
      });

      return response.success(res, null, '删除成功');
    } catch (error) {
      logger.error('删除通知失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 创建系统通知（管理员使用）
   * POST /api/v1/notifications/system
   */
  static async createSystemNotification(req, res) {
    try {
      const { title, content, targetUsers } = req.body;

      if (!title || !content) {
        return response.error(res, '标题和内容不能为空');
      }

      // 如果targetUsers为空，发送给所有用户
      let userIds = targetUsers;
      if (!userIds || userIds.length === 0) {
        const users = await prisma.user.findMany({
          select: { id: true },
        });
        userIds = users.map((u) => u.id);
      }

      // 批量创建通知
      const notifications = userIds.map((userId) => ({
        type: 'system',
        receiverId: userId,
        title,
        content,
        status: 'pending',
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      logger.info('系统通知创建成功:', { title, count: userIds.length });

      return response.success(res, null, `已发送给 ${userIds.length} 位用户`);
    } catch (error) {
      logger.error('创建系统通知失败:', error);
      return response.serverError(res);
    }
  }
}

module.exports = NotificationController;