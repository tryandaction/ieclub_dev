/**
 * 通知服务
 * 负责在各种操作时自动创建通知
 */
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const prisma = new PrismaClient();

class NotificationService {
  /**
   * 点赞话题时通知作者
   */
  static async notifyTopicLike(topicId, likerId) {
    try {
      const topic = await prisma.topic.findUnique({
        where: { id: topicId },
        select: {
          id: true,
          title: true,
          userId: true,
        },
      });

      if (!topic || topic.userId === likerId) {
        return; // 不给自己发通知
      }

      const liker = await prisma.user.findUnique({
        where: { id: likerId },
        select: { nickname: true },
      });

      await prisma.notification.create({
        data: {
          userId: topic.userId,
          type: 'like',
          title: '收到新的点赞',
          content: `${liker.nickname} 赞了你的话题《${topic.title}》`,
          actorId: likerId,
          targetType: 'topic',
          targetId: topicId,
          link: `/topic/${topicId}`,
        },
      });
    } catch (error) {
      logger.error('创建点赞通知失败:', error);
    }
  }

  /**
   * 评论话题时通知作者
   */
  static async notifyTopicComment(topicId, commentId, commenterId) {
    try {
      const [topic, comment, commenter] = await Promise.all([
        prisma.topic.findUnique({
          where: { id: topicId },
          select: {
            id: true,
            title: true,
            userId: true,
          },
        }),
        prisma.comment.findUnique({
          where: { id: commentId },
          select: { content: true },
        }),
        prisma.user.findUnique({
          where: { id: commenterId },
          select: { nickname: true },
        }),
      ]);

      if (!topic || topic.userId === commenterId) {
        return; // 不给自己发通知
      }

      // 截断评论内容
      const preview = comment.content.length > 50
        ? comment.content.substring(0, 50) + '...'
        : comment.content;

      await prisma.notification.create({
        data: {
          userId: topic.userId,
          type: 'comment',
          title: '收到新的评论',
          content: `${commenter.nickname} 评论了你的话题：${preview}`,
          actorId: commenterId,
          targetType: 'topic',
          targetId: topicId,
          link: `/topic/${topicId}#comment-${commentId}`,
        },
      });
    } catch (error) {
      logger.error('创建评论通知失败:', error);
    }
  }

  /**
   * 回复评论时通知被回复者
   */
  static async notifyCommentReply(parentCommentId, replyId, replierId) {
    try {
      const [parentComment, reply, replier] = await Promise.all([
        prisma.comment.findUnique({
          where: { id: parentCommentId },
          select: {
            id: true,
            userId: true,
            topicId: true,
            content: true,
          },
        }),
        prisma.comment.findUnique({
          where: { id: replyId },
          select: { content: true },
        }),
        prisma.user.findUnique({
          where: { id: replierId },
          select: { nickname: true },
        }),
      ]);

      if (!parentComment || parentComment.userId === replierId) {
        return; // 不给自己发通知
      }

      // 截断回复内容
      const preview = reply.content.length > 50
        ? reply.content.substring(0, 50) + '...'
        : reply.content;

      await prisma.notification.create({
        data: {
          userId: parentComment.userId,
          type: 'reply',
          title: '收到新的回复',
          content: `${replier.nickname} 回复了你的评论：${preview}`,
          actorId: replierId,
          targetType: 'comment',
          targetId: parentCommentId,
          link: `/topic/${parentComment.topicId}#comment-${replyId}`,
        },
      });
    } catch (error) {
      logger.error('创建回复通知失败:', error);
    }
  }

  /**
   * 关注用户时通知
   */
  static async notifyUserFollow(followingId, followerId) {
    try {
      if (followingId === followerId) {
        return; // 不能关注自己
      }

      const follower = await prisma.user.findUnique({
        where: { id: followerId },
        select: { nickname: true },
      });

      await prisma.notification.create({
        data: {
          userId: followingId,
          type: 'follow',
          title: '新的关注者',
          content: `${follower.nickname} 关注了你`,
          actorId: followerId,
          targetType: 'user',
          targetId: followerId,
          link: `/profile/${followerId}`,
        },
      });
    } catch (error) {
      logger.error('创建关注通知失败:', error);
    }
  }

  /**
   * 系统通知
   */
  static async notifySystem(userId, title, content, link = null) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'system',
          title,
          content,
          link,
          targetType: 'user',
          targetId: userId,
        },
      });
    } catch (error) {
      logger.error('创建系统通知失败:', error);
    }
  }

  /**
   * 批量系统通知（发送给所有用户）
   */
  static async broadcastSystemNotification(title, content, link = null) {
    try {
      const users = await prisma.user.findMany({
        where: { status: 'active' },
        select: { id: true },
      });

      const notifications = users.map(user => ({
        userId: user.id,
        type: 'system',
        title,
        content,
        link,
        targetType: 'user',
        targetId: user.id,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      return notifications.length;
    } catch (error) {
      logger.error('批量发送系统通知失败:', error);
      throw error;
    }
  }

  /**
   * 清理旧通知（定时任务）
   * 删除30天前的已读通知
   */
  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          isRead: true,
          readAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      logger.info(`清理了 ${result.count} 条旧通知`);
      return result.count;
    } catch (error) {
      logger.error('清理旧通知失败:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;

