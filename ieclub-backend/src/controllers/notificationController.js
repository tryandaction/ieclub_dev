// src/controllers/notificationController.js
// 通知控制器 - 处理通知相关的HTTP请求

const notificationService = require('../services/notificationService');
const websocketService = require('../services/websocketService'); // WebSocket推送
const { successResponse, errorResponse } = require('../utils/response');

  /**
   * 获取通知列表
 * GET /api/notifications
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null,
    } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true' || unreadOnly === true,
      type,
    });

    res.json(successResponse(result, '获取通知列表成功'));
    } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json(errorResponse(error.message || '获取通知列表失败'));
    }
  }

  /**
   * 获取未读通知数量
 * GET /api/notifications/unread-count
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;

    const count = await notificationService.getUnreadCount(userId);

    res.json({
      code: 200,
      message: '获取未读数量成功',
      data: { count },
    });
    } catch (error) {
    console.error('获取未读数量失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取未读数量失败',
    });
    }
  }

  /**
   * 标记通知为已读
 * PUT /api/notifications/:id/read
   */
async function markAsRead(req, res) {
    try {
    const userId = req.user.id;
      const { id } = req.params;

    const notification = await notificationService.markAsRead(id, userId);

    res.json({
      code: 200,
      message: '标记已读成功',
      data: notification,
    });
    } catch (error) {
    console.error('标记已读失败:', error);
    res.status(error.message.includes('不存在') ? 404 : 500).json({
      code: error.message.includes('不存在') ? 404 : 500,
      message: error.message || '标记已读失败',
    });
    }
  }

  /**
 * 标记所有通知为已读
 * PUT /api/notifications/read-all
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;

    const count = await notificationService.markAllAsRead(userId);

    res.json({
      code: 200,
      message: '全部标记已读成功',
      data: { count },
    });
    } catch (error) {
    console.error('全部标记已读失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '全部标记已读失败',
    });
    }
  }

  /**
   * 删除通知
 * DELETE /api/notifications/:id
   */
async function deleteNotification(req, res) {
    try {
    const userId = req.user.id;
      const { id } = req.params;

    await notificationService.deleteNotification(id, userId);

    res.json({
      code: 200,
      message: '删除通知成功',
      data: null,
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(error.message.includes('不存在') ? 404 : 500).json({
      code: error.message.includes('不存在') ? 404 : 500,
      message: error.message || '删除通知失败',
    });
  }
}

/**
 * 批量删除通知
 * POST /api/notifications/batch-delete
 */
async function batchDeleteNotifications(req, res) {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要删除的通知ID列表',
      });
    }

    const count = await notificationService.deleteNotifications(notificationIds, userId);

    res.json({
      code: 200,
      message: '批量删除成功',
      data: { count },
    });
    } catch (error) {
    console.error('批量删除通知失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '批量删除通知失败',
    });
    }
  }

  /**
 * 清空已读通知
 * DELETE /api/notifications/clear-read
 */
async function clearReadNotifications(req, res) {
  try {
    const userId = req.user.id;

    const count = await notificationService.clearReadNotifications(userId);

    res.json({
      code: 200,
      message: '清空已读通知成功',
      data: { count },
    });
  } catch (error) {
    console.error('清空已读通知失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '清空已读通知失败',
    });
  }
}

/**
 * 创建系统通知（管理员专用）
 * POST /api/notifications/system
 */
async function createSystemNotification(req, res) {
  try {
    const { userId, title, content, link } = req.body;

    // 验证必要参数
    if (!title || !content) {
      return res.status(400).json({
        code: 400,
        message: '标题和内容不能为空',
      });
    }

    const notification = await notificationService.createSystemNotification(
      userId || null, // null表示发送给所有用户
        title,
        content,
      link
    );

    // 通过WebSocket实时推送
    if (userId) {
      websocketService.sendNotification(userId, notification);
    } else {
      // 全局推送
      websocketService.broadcast({
        type: 'notification',
        data: notification,
      });
    }

    res.json({
      code: 200,
      message: '系统通知创建成功',
      data: notification,
    });
  } catch (error) {
    console.error('创建系统通知失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '创建系统通知失败',
    });
  }
}

/**
 * 获取通知设置
 * GET /api/notifications/settings
 */
async function getNotificationSettings(req, res) {
  try {
    // const userId = req.user.id;

    // TODO: 从数据库读取用户的通知设置
    // 目前返回默认设置
    const settings = {
      like: true,           // 点赞通知
      comment: true,        // 评论通知
      reply: true,          // 回复通知
      follow: true,         // 关注通知
      activity: true,       // 活动通知
      system: true,         // 系统通知
      emailNotification: false,  // 邮件通知
      pushNotification: true,    // 推送通知
    };

    res.json({
      code: 200,
      message: '获取通知设置成功',
      data: settings,
    });
    } catch (error) {
    console.error('获取通知设置失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取通知设置失败',
    });
  }
}

/**
 * 更新通知设置
 * PUT /api/notifications/settings
 */
async function updateNotificationSettings(req, res) {
  try {
    // const userId = req.user.id;
    const settings = req.body;

    // TODO: 保存到数据库
    // 目前仅返回成功

    res.json({
      code: 200,
      message: '更新通知设置成功',
      data: settings,
    });
  } catch (error) {
    console.error('更新通知设置失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '更新通知设置失败',
    });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  batchDeleteNotifications,
  clearReadNotifications,
  createSystemNotification,
  getNotificationSettings,
  updateNotificationSettings,
};
