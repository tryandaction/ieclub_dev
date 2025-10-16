// ==================== notificationController.js ====================
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
      const { page = 1, limit = 20, type, isRead } = req.query;
      const userId = req.userId;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = { userId };
      if (type) where.type = type;
      if (isRead !== undefined) where.isRead = isRead === 'true';

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.notification.count({ where }),
      ]);

      return response.paginated(res, notifications, {
        page: parseInt(page),
        limit: take,
        total,
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

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return response.success(res, { unreadCount });
    } catch (error) {
      logger.error('获取未读数量失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 标记单个通知为已读
   * PUT /api/v1/notifications/:id/read
   */
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        return response.notFound(res, '通知不存在');
      }

      await prisma.notification.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });

      return response.success(res, null, '标记成功');
    } catch (error) {
      logger.error('标记已读失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 标记所有通知为已读
   * PUT /api/v1/notifications/read-all
   */
  static async markAllAsRead(req, res) {
    try {
      const userId = req.userId;

      const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });

      return response.success(res, { count: result.count }, '全部标记成功');
    } catch (error) {
      logger.error('标记全部已读失败:', error);
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
        where: { id, userId },
      });

      if (!notification) {
        return response.notFound(res, '通知不存在');
      }

      await prisma.notification.delete({ where: { id } });

      return response.success(res, null, '删除成功');
    } catch (error) {
      logger.error('删除通知失败:', error);
      return response.serverError(res);
    }
  }
}

module.exports = NotificationController;