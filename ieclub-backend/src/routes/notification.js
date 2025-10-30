/**
 * 通知路由
 */
const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// 所有通知路由都需要认证
router.use(authenticate);

// 获取通知列表
router.get('/', NotificationController.getNotifications);

// 获取未读数量
router.get('/unread-count', NotificationController.getUnreadCount);

// 标记所有为已读
router.put('/read-all', NotificationController.markAllAsRead);

// 清空已读通知
router.delete('/clear-read', NotificationController.clearReadNotifications);

// 标记单条为已读
router.put('/:id/read', NotificationController.markAsRead);

// 删除单条通知
router.delete('/:id', NotificationController.deleteNotification);

module.exports = router;

