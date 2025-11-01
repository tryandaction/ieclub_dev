// src/services/notificationService.js
// 通知服务 - 处理所有通知相关的业务逻辑

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 通知类型枚举
 */
const NOTIFICATION_TYPES = {
  LIKE: 'like',               // 点赞通知
  COMMENT: 'comment',         // 评论通知
  REPLY: 'reply',             // 回复通知
  FOLLOW: 'follow',           // 关注通知
  MATCH: 'match',             // 匹配通知（活动达到人数）
  SYSTEM: 'system',           // 系统通知
  ACTIVITY: 'activity',       // 活动通知
  CREDIT: 'credit',           // 积分通知
  BADGE: 'badge',             // 勋章通知
};

/**
 * 目标类型枚举
 */
const TARGET_TYPES = {
  TOPIC: 'topic',
  COMMENT: 'comment',
  USER: 'user',
  ACTIVITY: 'activity',
  SYSTEM: 'system',
};

/**
 * 创建通知
 * @param {Object} data - 通知数据
 * @param {string} data.userId - 接收通知的用户ID
 * @param {string} data.type - 通知类型
 * @param {string} data.title - 通知标题
 * @param {string} data.content - 通知内容
 * @param {string} data.actorId - 触发通知的用户ID（可选）
 * @param {string} data.targetType - 目标类型
 * @param {string} data.targetId - 目标ID
 * @param {string} data.link - 跳转链接（可选）
 * @returns {Promise<Object>} 创建的通知
 */
async function createNotification(data) {
  const { 
    userId, 
    type, 
    title, 
    content, 
    actorId, 
    targetType, 
    targetId, 
    link 
  } = data;

  // 验证参数
  if (!userId || !type || !title || !content || !targetType || !targetId) {
    throw new Error('缺少必要的通知参数');
  }

  // 防止给自己发通知（除了系统通知）
  if (actorId && actorId === userId && type !== NOTIFICATION_TYPES.SYSTEM) {
    return null;
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        actorId: actorId || null,
        targetType,
        targetId,
        link: link || null,
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
    console.error('创建通知失败:', error);
    throw new Error('创建通知失败');
  }
}

/**
 * 批量创建通知
 * @param {Array} notificationList - 通知列表
 * @returns {Promise<Array>} 创建的通知列表
 */
async function createNotifications(notificationList) {
  try {
    const notifications = await prisma.notification.createMany({
      data: notificationList,
      skipDuplicates: true,
    });

    return notifications;
  } catch (error) {
    console.error('批量创建通知失败:', error);
    throw new Error('批量创建通知失败');
  }
}

/**
 * 获取用户的通知列表
 * @param {string} userId - 用户ID
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.limit - 每页数量
 * @param {boolean} options.unreadOnly - 仅未读
 * @param {string} options.type - 通知类型筛选
 * @returns {Promise<Object>} 通知列表和分页信息
 */
async function getUserNotifications(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null,
  } = options;

  const skip = (page - 1) * limit;

  // 构建查询条件
  const where = {
    userId,
    ...(unreadOnly && { isRead: false }),
    ...(type && { type }),
  };

  try {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
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
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  } catch (error) {
    console.error('获取通知列表失败:', error);
    throw new Error('获取通知列表失败');
  }
}

/**
 * 获取未读通知数量
 * @param {string} userId - 用户ID
 * @returns {Promise<number>} 未读通知数量
 */
async function getUnreadCount(userId) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error('获取未读数量失败:', error);
    throw new Error('获取未读数量失败');
  }
}

/**
 * 标记通知为已读
 * @param {string} notificationId - 通知ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 更新后的通知
 */
async function markAsRead(notificationId, userId) {
  try {
    // 验证通知是否属于该用户
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('通知不存在或无权限');
    }

    if (notification.isRead) {
      return notification;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
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

    return updated;
  } catch (error) {
    console.error('标记已读失败:', error);
    throw new Error(error.message || '标记已读失败');
  }
}

/**
 * 标记所有通知为已读
 * @param {string} userId - 用户ID
 * @returns {Promise<number>} 更新的通知数量
 */
async function markAllAsRead(userId) {
  try {
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

    return result.count;
  } catch (error) {
    console.error('全部标记已读失败:', error);
    throw new Error('全部标记已读失败');
  }
}

/**
 * 删除通知
 * @param {string} notificationId - 通知ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 删除结果
 */
async function deleteNotification(notificationId, userId) {
  try {
    // 验证通知是否属于该用户
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('通知不存在或无权限');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  } catch (error) {
    console.error('删除通知失败:', error);
    throw new Error(error.message || '删除通知失败');
  }
}

/**
 * 批量删除通知
 * @param {Array<string>} notificationIds - 通知ID列表
 * @param {string} userId - 用户ID
 * @returns {Promise<number>} 删除的通知数量
 */
async function deleteNotifications(notificationIds, userId) {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
    });

    return result.count;
  } catch (error) {
    console.error('批量删除通知失败:', error);
    throw new Error('批量删除通知失败');
  }
}

/**
 * 清空所有已读通知
 * @param {string} userId - 用户ID
 * @returns {Promise<number>} 删除的通知数量
 */
async function clearReadNotifications(userId) {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    return result.count;
  } catch (error) {
    console.error('清空已读通知失败:', error);
    throw new Error('清空已读通知失败');
  }
}

// ==================== 业务通知创建函数 ====================

/**
 * 创建点赞通知
 * @param {string} userId - 被点赞用户ID
 * @param {string} actorId - 点赞用户ID
 * @param {string} targetType - 目标类型（topic/comment）
 * @param {string} targetId - 目标ID
 * @param {string} targetTitle - 目标标题/内容
 * @returns {Promise<Object>} 创建的通知
 */
async function createLikeNotification(userId, actorId, targetType, targetId, targetTitle) {
  const typeText = targetType === 'topic' ? '话题' : '评论';
  const truncatedTitle = targetTitle.length > 20 ? targetTitle.substring(0, 20) + '...' : targetTitle;

  return await createNotification({
    userId,
    actorId,
    type: NOTIFICATION_TYPES.LIKE,
    title: '收到新的赞',
    content: `赞了你的${typeText}：${truncatedTitle}`,
    targetType,
    targetId,
    link: targetType === 'topic' ? `/topics/${targetId}` : null,
  });
}

/**
 * 创建评论通知
 * @param {string} userId - 被评论用户ID
 * @param {string} actorId - 评论用户ID
 * @param {string} targetType - 目标类型（topic）
 * @param {string} targetId - 话题ID
 * @param {string} targetTitle - 话题标题
 * @param {string} commentContent - 评论内容
 * @returns {Promise<Object>} 创建的通知
 */
async function createCommentNotification(userId, actorId, targetType, targetId, targetTitle, commentContent) {
  const truncatedTitle = targetTitle.length > 20 ? targetTitle.substring(0, 20) + '...' : targetTitle;
  const truncatedComment = commentContent.length > 30 ? commentContent.substring(0, 30) + '...' : commentContent;

  return await createNotification({
    userId,
    actorId,
    type: NOTIFICATION_TYPES.COMMENT,
    title: '收到新评论',
    content: `评论了你的话题"${truncatedTitle}"：${truncatedComment}`,
    targetType,
    targetId,
    link: `/topics/${targetId}`,
  });
}

/**
 * 创建回复通知
 * @param {string} userId - 被回复用户ID
 * @param {string} actorId - 回复用户ID
 * @param {string} commentId - 评论ID
 * @param {string} topicId - 话题ID
 * @param {string} replyContent - 回复内容
 * @returns {Promise<Object>} 创建的通知
 */
async function createReplyNotification(userId, actorId, commentId, topicId, replyContent) {
  const truncatedReply = replyContent.length > 30 ? replyContent.substring(0, 30) + '...' : replyContent;

  return await createNotification({
    userId,
    actorId,
    type: NOTIFICATION_TYPES.REPLY,
    title: '收到新回复',
    content: `回复了你的评论：${truncatedReply}`,
    targetType: TARGET_TYPES.COMMENT,
    targetId: commentId,
    link: `/topics/${topicId}#comment-${commentId}`,
  });
}

/**
 * 创建关注通知
 * @param {string} userId - 被关注用户ID
 * @param {string} actorId - 关注用户ID
 * @returns {Promise<Object>} 创建的通知
 */
async function createFollowNotification(userId, actorId) {
  return await createNotification({
    userId,
    actorId,
    type: NOTIFICATION_TYPES.FOLLOW,
    title: '新的粉丝',
    content: '关注了你',
    targetType: TARGET_TYPES.USER,
    targetId: actorId,
    link: `/users/${actorId}`,
  });
}

/**
 * 创建活动通知
 * @param {string} userId - 用户ID
 * @param {string} activityId - 活动ID
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<Object>} 创建的通知
 */
async function createActivityNotification(userId, activityId, title, content) {
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.ACTIVITY,
    title,
    content,
    targetType: TARGET_TYPES.ACTIVITY,
    targetId: activityId,
    link: `/activities/${activityId}`,
  });
}

/**
 * 创建系统通知
 * @param {string} userId - 用户ID（为null时发送给所有用户）
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @param {string} link - 跳转链接（可选）
 * @returns {Promise<Object>} 创建的通知
 */
async function createSystemNotification(userId, title, content, link = null) {
  if (!userId) {
    // 发送给所有用户
    const users = await prisma.user.findMany({
      where: { status: 'active' },
      select: { id: true },
    });

    const notifications = users.map(user => ({
      userId: user.id,
      type: NOTIFICATION_TYPES.SYSTEM,
      title,
      content,
      targetType: TARGET_TYPES.SYSTEM,
      targetId: 'system',
      link,
    }));

    return await createNotifications(notifications);
  }

  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.SYSTEM,
    title,
    content,
    targetType: TARGET_TYPES.SYSTEM,
    targetId: 'system',
    link,
  });
}

/**
 * 创建积分通知
 * @param {string} userId - 用户ID
 * @param {number} credits - 积分变化
 * @param {string} reason - 原因
 * @returns {Promise<Object>} 创建的通知
 */
async function createCreditNotification(userId, credits, reason) {
  const prefix = credits > 0 ? '获得' : '消耗';
  
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.CREDIT,
    title: '积分变化',
    content: `${prefix} ${Math.abs(credits)} 积分，原因：${reason}`,
    targetType: TARGET_TYPES.SYSTEM,
    targetId: 'credit',
    link: '/profile/credits',
  });
}

/**
 * 创建勋章通知
 * @param {string} userId - 用户ID
 * @param {string} badgeName - 勋章名称
 * @returns {Promise<Object>} 创建的通知
 */
async function createBadgeNotification(userId, badgeName) {
  return await createNotification({
    userId,
    type: NOTIFICATION_TYPES.BADGE,
    title: '获得新勋章',
    content: `恭喜你获得了"${badgeName}"勋章！`,
    targetType: TARGET_TYPES.SYSTEM,
    targetId: 'badge',
    link: '/profile/badges',
  });
}

module.exports = {
  NOTIFICATION_TYPES,
  TARGET_TYPES,
  
  // 基础 CRUD
  createNotification,
  createNotifications,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteNotifications,
  clearReadNotifications,
  
  // 业务通知
  createLikeNotification,
  createCommentNotification,
  createReplyNotification,
  createFollowNotification,
  createActivityNotification,
  createSystemNotification,
  createCreditNotification,
  createBadgeNotification,
};
