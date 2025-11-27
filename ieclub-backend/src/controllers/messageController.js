/**
 * 私信控制器
 */
const { prisma } = require('../config/database');
const response = require('../utils/response');
const logger = require('../utils/logger');

class MessageController {
  /**
   * 获取会话列表
   * GET /api/v1/messages/conversations
   */
  static async getConversations(req, res) {
    try {
      const userId = req.userId;
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // 查询用户参与的所有会话
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { participant1Id: userId },
            { participant2Id: userId }
          ]
        },
        include: {
          participant1: {
            select: { id: true, nickname: true, avatar: true }
          },
          participant2: {
            select: { id: true, nickname: true, avatar: true }
          }
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: parseInt(limit)
      });

      // 处理数据，返回对方用户信息和未读数
      const result = conversations.map(conv => {
        const isP1 = conv.participant1Id === userId;
        const otherUser = isP1 ? conv.participant2 : conv.participant1;
        const unreadCount = isP1 ? conv.unread1 : conv.unread2;

        return {
          id: conv.id,
          otherUser,
          lastMessage: conv.lastMessageContent,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
          updatedAt: conv.updatedAt
        };
      });

      const total = await prisma.conversation.count({
        where: {
          OR: [
            { participant1Id: userId },
            { participant2Id: userId }
          ]
        }
      });

      return response.paginated(res, result, {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      });
    } catch (error) {
      logger.error('获取会话列表失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取与某用户的会话（或创建新会话）
   * GET /api/v1/messages/conversation/:userId
   */
  static async getOrCreateConversation(req, res) {
    try {
      const currentUserId = req.userId;
      const { userId: otherUserId } = req.params;

      if (currentUserId === otherUserId) {
        return response.error(res, '不能与自己对话', 400);
      }

      // 检查对方用户是否存在
      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
        select: { id: true, nickname: true, avatar: true }
      });

      if (!otherUser) {
        return response.notFound(res, '用户不存在');
      }

      // 确保 participant1Id < participant2Id 以保证唯一性
      const [p1, p2] = [currentUserId, otherUserId].sort();

      // 查找或创建会话
      let conversation = await prisma.conversation.findFirst({
        where: {
          participant1Id: p1,
          participant2Id: p2
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            participant1Id: p1,
            participant2Id: p2
          }
        });
      }

      return response.success(res, {
        conversationId: conversation.id,
        otherUser
      });
    } catch (error) {
      logger.error('获取会话失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取会话消息列表
   * GET /api/v1/messages/conversation/:conversationId/messages
   */
  static async getMessages(req, res) {
    try {
      const userId = req.userId;
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // 检查会话权限
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (!conversation) {
        return response.notFound(res, '会话不存在');
      }

      if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
        return response.forbidden(res, '无权查看此会话');
      }

      // 获取消息列表
      const messages = await prisma.message.findMany({
        where: {
          conversationId,
          isDeleted: false
        },
        include: {
          sender: {
            select: { id: true, nickname: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      });

      // 标记未读消息为已读
      const isP1 = conversation.participant1Id === userId;
      await prisma.$transaction([
        prisma.message.updateMany({
          where: {
            conversationId,
            receiverId: userId,
            isRead: false
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        }),
        prisma.conversation.update({
          where: { id: conversationId },
          data: isP1 ? { unread1: 0 } : { unread2: 0 }
        })
      ]);

      const total = await prisma.message.count({
        where: { conversationId, isDeleted: false }
      });

      return response.paginated(res, messages.reverse(), {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      });
    } catch (error) {
      logger.error('获取消息列表失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 发送私信
   * POST /api/v1/messages/send
   */
  static async sendMessage(req, res) {
    try {
      const senderId = req.userId;
      const { receiverId, content, type = 'text' } = req.body;

      if (!receiverId || !content) {
        return response.error(res, '缺少必要参数', 400);
      }

      if (senderId === receiverId) {
        return response.error(res, '不能给自己发消息', 400);
      }

      // 检查接收者是否存在
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId }
      });

      if (!receiver) {
        return response.notFound(res, '用户不存在');
      }

      // 确保会话存在
      const [p1, p2] = [senderId, receiverId].sort();
      
      let conversation = await prisma.conversation.findFirst({
        where: {
          participant1Id: p1,
          participant2Id: p2
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            participant1Id: p1,
            participant2Id: p2
          }
        });
      }

      // 创建消息
      const message = await prisma.message.create({
        data: {
          content,
          type,
          senderId,
          receiverId,
          conversationId: conversation.id
        },
        include: {
          sender: {
            select: { id: true, nickname: true, avatar: true }
          }
        }
      });

      // 更新会话信息
      const isP1Sender = conversation.participant1Id === senderId;
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageId: message.id,
          lastMessageContent: content.length > 200 ? content.slice(0, 200) : content,
          lastMessageAt: new Date(),
          // 增加接收方的未读计数
          ...(isP1Sender ? { unread2: { increment: 1 } } : { unread1: { increment: 1 } })
        }
      });

      // 发送通知
      await prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'message',
          title: '收到新私信',
          content: `${message.sender.nickname} 给你发来了一条私信`,
          actorId: senderId,
          targetType: 'message',
          targetId: message.id,
          link: `/messages/${conversation.id}`
        }
      }).catch(() => {});

      return response.created(res, message, '发送成功');
    } catch (error) {
      logger.error('发送消息失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 获取未读私信数
   * GET /api/v1/messages/unread-count
   */
  static async getUnreadCount(req, res) {
    try {
      const userId = req.userId;

      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { participant1Id: userId },
            { participant2Id: userId }
          ]
        },
        select: {
          participant1Id: true,
          unread1: true,
          unread2: true
        }
      });

      let totalUnread = 0;
      for (const conv of conversations) {
        totalUnread += conv.participant1Id === userId ? conv.unread1 : conv.unread2;
      }

      return response.success(res, { count: totalUnread });
    } catch (error) {
      logger.error('获取未读数失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 删除消息
   * DELETE /api/v1/messages/:messageId
   */
  static async deleteMessage(req, res) {
    try {
      const userId = req.userId;
      const { messageId } = req.params;

      const message = await prisma.message.findUnique({
        where: { id: messageId }
      });

      if (!message) {
        return response.notFound(res, '消息不存在');
      }

      if (message.senderId !== userId) {
        return response.forbidden(res, '只能删除自己发送的消息');
      }

      await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true }
      });

      return response.success(res, null, '删除成功');
    } catch (error) {
      logger.error('删除消息失败:', error);
      return response.serverError(res);
    }
  }
}

module.exports = MessageController;
