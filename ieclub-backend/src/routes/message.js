/**
 * 私信路由
 */
const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

// 所有私信接口都需要登录
router.use(authenticate);

// 获取会话列表
router.get('/conversations', MessageController.getConversations);

// 获取/创建与某用户的会话
router.get('/conversation/:userId', MessageController.getOrCreateConversation);

// 获取会话消息
router.get('/conversation/:conversationId/messages', MessageController.getMessages);

// 发送私信
router.post('/send', MessageController.sendMessage);

// 获取未读私信数
router.get('/unread-count', MessageController.getUnreadCount);

// 删除消息
router.delete('/:messageId', MessageController.deleteMessage);

module.exports = router;
