// ieclub-backend/src/services/activityService.js
// 活动服务层 - 处理活动报名和参与逻辑

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const creditService = require('./creditService');

class ActivityService {
  /**
   * 创建活动
   */
  async createActivity(userId, data) {
    const {
      title,
      description,
      location,
      startTime,
      endTime,
      maxParticipants,
      categoryId,
      tags,
      images,
      requirements
    } = data;

    // 验证时间
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      throw new AppError('结束时间必须晚于开始时间', 400);
    }

    if (start < new Date()) {
      throw new AppError('开始时间不能早于当前时间', 400);
    }

    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        location,
        startTime: start,
        endTime: end,
        maxParticipants: maxParticipants || 0,
        categoryId,
        tags: tags ? JSON.stringify(tags) : null,
        images: images ? JSON.stringify(images) : null,
        requirements: requirements ? JSON.stringify(requirements) : null,
        organizerId: userId,
        status: 'published'
      },
      include: {
        organizer: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    logger.info(`用户 ${userId} 创建活动: ${activity.id}`);

    return this.formatActivity(activity);
  }

  /**
   * 获取活动列表
   */
  async getActivities(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      status = 'published',
      categoryId,
      keyword,
      upcoming = false, // 只显示即将开始的活动
      past = false // 只显示已结束的活动
    } = options;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = { status };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } }
      ];
    }

    // 时间筛选
    const now = new Date();
    if (upcoming) {
      where.startTime = { gte: now };
    } else if (past) {
      where.endTime = { lt: now };
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take,
        orderBy: upcoming || !past ? 
          [{ startTime: 'asc' }] : 
          [{ endTime: 'desc' }],
        include: {
          organizer: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              participants: true
            }
          }
        }
      }),
      prisma.activity.count({ where })
    ]);

    return {
      activities: activities.map(activity => this.formatActivity(activity)),
      total,
      hasMore: skip + take < total,
      currentPage: page
    };
  }

  /**
   * 获取活动详情
   */
  async getActivityById(activityId, userId) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        organizer: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        participants: userId ? {
          where: { userId },
          select: { 
            id: true,
            status: true,
            joinedAt: true
          }
        } : false,
        _count: {
          select: {
            participants: true
          }
        }
      }
    });

    if (!activity) {
      throw new AppError('活动不存在', 404);
    }

    const formattedActivity = this.formatActivity(activity);

    // 添加用户参与状态
    if (userId && activity.participants && activity.participants.length > 0) {
      const participation = activity.participants[0];
      formattedActivity.isParticipating = true;
      formattedActivity.participationStatus = participation.status;
      formattedActivity.joinedAt = participation.joinedAt.toISOString();
    } else {
      formattedActivity.isParticipating = false;
    }

    return formattedActivity;
  }

  /**
   * 更新活动
   */
  async updateActivity(activityId, userId, data) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      throw new AppError('活动不存在', 404);
    }

    if (activity.organizerId !== userId) {
      throw new AppError('无权修改此活动', 403);
    }

    const {
      title,
      description,
      location,
      startTime,
      endTime,
      maxParticipants,
      categoryId,
      tags,
      images,
      requirements,
      status
    } = data;

    // 验证时间
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (start >= end) {
        throw new AppError('结束时间必须晚于开始时间', 400);
      }
    }

    const updatedActivity = await prisma.activity.update({
      where: { id: activityId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(location && { location }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(maxParticipants !== undefined && { maxParticipants }),
        ...(categoryId && { categoryId }),
        ...(tags && { tags: JSON.stringify(tags) }),
        ...(images && { images: JSON.stringify(images) }),
        ...(requirements && { requirements: JSON.stringify(requirements) }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      include: {
        organizer: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    logger.info(`用户 ${userId} 更新活动: ${activityId}`);

    return this.formatActivity(updatedActivity);
  }

  /**
   * 删除活动
   */
  async deleteActivity(activityId, userId, isAdmin = false) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      throw new AppError('活动不存在', 404);
    }

    if (activity.organizerId !== userId && !isAdmin) {
      throw new AppError('无权删除此活动', 403);
    }

    await prisma.activity.delete({
      where: { id: activityId }
    });

    logger.info(`活动 ${activityId} 已删除 (操作者: ${userId})`);

    return { message: '删除成功' };
  }

  /**
   * 报名参加活动
   */
  async joinActivity(activityId, userId, data = {}) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        _count: {
          select: {
            participants: {
              where: { status: 'approved' }
            }
          }
        }
      }
    });

    if (!activity) {
      throw new AppError('活动不存在', 404);
    }

    if (activity.status !== 'published') {
      throw new AppError('活动未发布或已取消', 400);
    }

    // 检查活动是否已开始
    if (new Date() > activity.startTime) {
      throw new AppError('活动已开始，无法报名', 400);
    }

    // 检查是否已满员
    if (activity.maxParticipants > 0 && 
        activity._count.participants >= activity.maxParticipants) {
      throw new AppError('活动名额已满', 400);
    }

    // 检查是否已报名
    const existingParticipation = await prisma.activityParticipant.findUnique({
      where: {
        activityId_userId: {
          activityId,
          userId
        }
      }
    });

    if (existingParticipation) {
      throw new AppError('已经报名过该活动', 400);
    }

    // 创建参与记录
    const participation = await prisma.activityParticipant.create({
      data: {
        activityId,
        userId,
        status: 'approved', // 默认直接通过，如需审核可改为 'pending'
        note: data.note || null
      }
    });

    // 增加活动参与人数
    await prisma.activity.update({
      where: { id: activityId },
      data: { participantsCount: { increment: 1 } }
    });

    // 添加积分奖励
    await creditService.addCredits(userId, 'activity_join', {
      relatedType: 'activity',
      relatedId: activityId
    });

    logger.info(`用户 ${userId} 报名活动: ${activityId}`);

    return {
      message: '报名成功',
      participation: {
        id: participation.id,
        status: participation.status,
        joinedAt: participation.joinedAt.toISOString()
      }
    };
  }

  /**
   * 取消报名
   */
  async leaveActivity(activityId, userId) {
    const participation = await prisma.activityParticipant.findUnique({
      where: {
        activityId_userId: {
          activityId,
          userId
        }
      }
    });

    if (!participation) {
      throw new AppError('未报名该活动', 400);
    }

    // 检查活动是否已开始
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { startTime: true }
    });

    if (new Date() > activity.startTime) {
      throw new AppError('活动已开始，无法取消报名', 400);
    }

    // 删除参与记录
    await prisma.activityParticipant.delete({
      where: { id: participation.id }
    });

    // 减少活动参与人数
    await prisma.activity.update({
      where: { id: activityId },
      data: { participantsCount: { decrement: 1 } }
    });

    logger.info(`用户 ${userId} 取消报名活动: ${activityId}`);

    return { message: '取消报名成功' };
  }

  /**
   * 获取活动参与者列表
   */
  async getParticipants(activityId, options = {}) {
    const {
      page = 1,
      pageSize = 20,
      status = 'approved'
    } = options;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = { activityId };
    if (status) {
      where.status = status;
    }

    const [participants, total] = await Promise.all([
      prisma.activityParticipant.findMany({
        where,
        skip,
        take,
        orderBy: [{ joinedAt: 'desc' }],
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              level: true
            }
          }
        }
      }),
      prisma.activityParticipant.count({ where })
    ]);

    return {
      participants: participants.map(p => ({
        id: p.id,
        user: p.user,
        status: p.status,
        note: p.note,
        joinedAt: p.joinedAt.toISOString()
      })),
      total,
      hasMore: skip + take < total,
      currentPage: page
    };
  }

  /**
   * 签到
   */
  async checkIn(activityId, userId, token = null) {
    // 如果提供了 token，先验证
    if (token) {
      const verification = await this.verifyCheckInToken(activityId, token);
      if (!verification.valid) {
        throw new AppError('签到令牌无效或已过期', 400);
      }
    }

    const participation = await prisma.activityParticipant.findUnique({
      where: {
        activityId_userId: {
          activityId,
          userId
        }
      }
    });

    if (!participation) {
      throw new AppError('未报名该活动', 400);
    }

    if (participation.checkedIn) {
      throw new AppError('已经签到过了', 400);
    }

    // 检查活动时间
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { startTime: true, endTime: true }
    });

    const now = new Date();
    if (now < activity.startTime) {
      throw new AppError('活动尚未开始', 400);
    }

    if (now > activity.endTime) {
      throw new AppError('活动已结束', 400);
    }

    // 签到
    await prisma.activityParticipant.update({
      where: { id: participation.id },
      data: {
        checkedIn: true,
        checkedInAt: now
      }
    });

    // 添加签到积分奖励
    await creditService.addCredits(userId, 'activity_checkin', {
      relatedType: 'activity',
      relatedId: activityId
    });

    logger.info(`用户 ${userId} 在活动 ${activityId} 签到`);

    return { 
      message: '签到成功',
      checkedInAt: now.toISOString()
    };
  }

  /**
   * 生成签到二维码
   */
  async generateCheckInQRCode(activityId, userId) {
    const crypto = require('crypto');
    const QRCode = require('qrcode');

    // 验证用户是否是活动组织者
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { organizerId: true, title: true }
    });

    if (!activity) {
      throw new AppError('活动不存在', 404);
    }

    if (activity.organizerId !== userId) {
      throw new AppError('只有活动组织者可以生成签到二维码', 403);
    }

    // 生成唯一令牌
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时有效

    // 存储到 Redis
    const redis = require('../config/redis');
    const tokenKey = `activity:checkin:${activityId}:${token}`;
    await redis.setex(tokenKey, 24 * 60 * 60, JSON.stringify({
      activityId,
      createdBy: userId,
      createdAt: new Date().toISOString()
    }));

    // 生成二维码数据（包含活动ID和令牌）
    const qrData = JSON.stringify({
      type: 'activity_checkin',
      activityId,
      token,
      expiresAt: expiresAt.toISOString()
    });

    // 生成二维码图片（Base64）
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    logger.info(`成功为活动 ${activityId} 生成签到二维码，令牌: ${token.substring(0, 8)}...`);

    return {
      token,
      qrCodeDataURL,
      expiresAt: expiresAt.toISOString(),
      activityTitle: activity.title
    };
  }

  /**
   * 验证签到令牌
   */
  async verifyCheckInToken(activityId, token) {
    const redis = require('../config/redis');
    const tokenKey = `activity:checkin:${activityId}:${token}`;
    
    const tokenData = await redis.get(tokenKey);
    
    if (!tokenData) {
      return {
        valid: false,
        message: '签到令牌无效或已过期'
      };
    }

    const data = JSON.parse(tokenData);
    
    return {
      valid: true,
      activityId: data.activityId,
      message: '令牌有效'
    };
  }

  /**
   * 获取签到统计
   */
  async getCheckInStats(activityId, userId) {
    // 验证用户是否是活动组织者
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { 
        organizerId: true,
        title: true,
        startTime: true,
        endTime: true
      }
    });

    if (!activity) {
      throw new AppError('活动不存在', 404);
    }

    if (activity.organizerId !== userId) {
      throw new AppError('只有活动组织者可以查看签到统计', 403);
    }

    // 获取统计数据
    const [totalParticipants, checkedInCount, participants] = await Promise.all([
      prisma.activityParticipant.count({
        where: { activityId }
      }),
      prisma.activityParticipant.count({
        where: { 
          activityId,
          checkedIn: true
        }
      }),
      prisma.activityParticipant.findMany({
        where: { activityId },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              email: true
            }
          }
        },
        orderBy: [
          { checkedIn: 'desc' }, // 已签到的排前面
          { createdAt: 'desc' }  // 然后按报名时间排序
        ]
      })
    ]);

    const checkInRate = totalParticipants > 0 
      ? ((checkedInCount / totalParticipants) * 100).toFixed(1)
      : 0;

    return {
      activityTitle: activity.title,
      startTime: activity.startTime.toISOString(),
      endTime: activity.endTime.toISOString(),
      totalParticipants,
      checkedInCount,
      notCheckedInCount: totalParticipants - checkedInCount,
      checkInRate: parseFloat(checkInRate),
      participants: participants.map(p => ({
        userId: p.user.id,
        nickname: p.user.nickname,
        avatar: p.user.avatar,
        email: p.user.email,
        joinedAt: p.joinedAt.toISOString(),
        checkedIn: p.checkedIn,
        checkedInAt: p.checkedInAt ? p.checkedInAt.toISOString() : null,
        status: p.status
      }))
    };
  }

  /**
   * 格式化活动数据
   */
  formatActivity(activity) {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      location: activity.location,
      startTime: activity.startTime.toISOString(),
      endTime: activity.endTime.toISOString(),
      maxParticipants: activity.maxParticipants,
      participantsCount: activity.participantsCount || (activity._count ? activity._count.participants : 0),
      tags: activity.tags ? JSON.parse(activity.tags) : [],
      images: activity.images ? JSON.parse(activity.images) : [],
      requirements: activity.requirements ? JSON.parse(activity.requirements) : [],
      organizer: activity.organizer ? {
        id: activity.organizer.id,
        nickname: activity.organizer.nickname,
        avatar: activity.organizer.avatar,
        bio: activity.organizer.bio
      } : null,
      category: activity.category ? {
        id: activity.category.id,
        name: activity.category.name
      } : null,
      status: activity.status,
      createdAt: activity.createdAt.toISOString(),
      updatedAt: activity.updatedAt.toISOString()
    };
  }
}

module.exports = new ActivityService();

