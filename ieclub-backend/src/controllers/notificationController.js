/**
 * 通知控制器
 */
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const prisma = new PrismaClient();

class NotificationController {
  /**
   * 获取通知列表
   * GET /api/notifications
   */
  static async getNotifications(req, res) {
    try {
      const { page = 1, limit = 20, type, unreadOnly = false } = req.query;
      const userId = req.user.id;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { userId };
      
      if (type) {
        where.type = type;
      }
      
      if (unreadOnly === 'true') {
        where.isRead = false;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          include: {
            actor: {
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

      return res.json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      logger.error('获取通知列表失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取通知列表失败',
      });
    }
  }

  /**
   * 获取未读通知数量
   * GET /api/notifications/unread-count
   */
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      logger.error('获取未读数量失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取未读数量失败',
      });
    }
  }

  /**
   * 标记单条通知为已读
   * PUT /api/notifications/:id/read
   */
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // 验证所有权
      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '通知不存在',
        });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权操作此通知',
        });
      }

      // 更新为已读
      const updated = await prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      logger.error('标记已读失败:', error);
      return res.status(500).json({
        success: false,
        message: '标记已读失败',
      });
    }
  }

  /**
   * 标记所有通知为已读
   * PUT /api/notifications/read-all
   */
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return res.json({
        success: true,
        data: {
          count: result.count,
        },
        message: `已标记 ${result.count} 条通知为已读`,
      });
    } catch (error) {
      logger.error('标记全部已读失败:', error);
      return res.status(500).json({
        success: false,
        message: '标记全部已读失败',
      });
    }
  }

  /**
   * 删除单条通知
   * DELETE /api/notifications/:id
   */
  static async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // 验证所有权
      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '通知不存在',
        });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权删除此通知',
        });
      }

      await prisma.notification.delete({
        where: { id },
      });

      return res.json({
        success: true,
        message: '删除成功',
      });
    } catch (error) {
      logger.error('删除通知失败:', error);
      return res.status(500).json({
        success: false,
        message: '删除通知失败',
      });
    }
  }

  /**
   * 清空所有已读通知
   * DELETE /api/notifications/clear-read
   */
  static async clearReadNotifications(req, res) {
    try {
      const userId = req.user.id;

      const result = await prisma.notification.deleteMany({
        where: {
          userId,
          isRead: true,
        },
      });

      return res.json({
        success: true,
        data: {
          count: result.count,
        },
        message: `已清空 ${result.count} 条已读通知`,
      });
    } catch (error) {
      logger.error('清空已读通知失败:', error);
      return res.status(500).json({
        success: false,
        message: '清空已读通知失败',
      });
    }
  }

  /**
   * 创建通知（内部方法）
   */
  static async createNotification(data) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          content: data.content,
          actorId: data.actorId,
          targetType: data.targetType,
          targetId: data.targetId,
          link: data.link,
        },
        include: {
          actor: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      });

      return notification;
    } catch (error) {
      logger.error('创建通知失败:', error);
      throw error;
    }
  }

  /**
   * 批量创建通知（内部方法）
   */
  static async createBatchNotifications(notifications) {
    try {
      await prisma.notification.createMany({
        data: notifications,
      });
    } catch (error) {
      logger.error('批量创建通知失败:', error);
      throw error;
    }
  }
}

module.exports = NotificationController;
