// src/routes/notificationRoutes.js
// 通知相关的路由

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { hasPermission } = require('../middleware/permission');

// 所有通知路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    获取通知列表
 * @query   page, limit, unreadOnly, type
 * @access  Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    获取未读通知数量
 * @access  Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    标记所有通知为已读
 * @access  Private
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/clear-read
 * @desc    清空所有已读通知
 * @access  Private
 */
router.delete('/clear-read', notificationController.clearReadNotifications);

/**
 * @route   POST /api/notifications/batch-delete
 * @desc    批量删除通知
 * @body    { notificationIds: string[] }
 * @access  Private
 */
router.post('/batch-delete', notificationController.batchDeleteNotifications);

/**
 * @route   GET /api/notifications/settings
 * @desc    获取通知设置
 * @access  Private
 */
router.get('/settings', notificationController.getNotificationSettings);

/**
 * @route   PUT /api/notifications/settings
 * @desc    更新通知设置
 * @body    通知设置对象
 * @access  Private
 */
router.put('/settings', notificationController.updateNotificationSettings);

/**
 * @route   POST /api/notifications/system
 * @desc    创建系统通知（管理员专用）
 * @body    { userId, title, content, link }
 * @access  Private + Admin
 */
router.post(
  '/system',
  hasPermission('admin.notification.create'),
  notificationController.createSystemNotification
);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    标记通知为已读
 * @access  Private
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    删除通知
 * @access  Private
 */
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

