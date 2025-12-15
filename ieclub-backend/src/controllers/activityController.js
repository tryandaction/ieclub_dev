// ieclub-backend/src/controllers/activityController.js
// 活动控制器

const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 获取活动列表
 */
exports.getActivities = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, category, status = 'published' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const where = { status };
    if (category) where.category = category;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          startTime: true,
          endTime: true,
          maxParticipants: true,
          participantsCount: true,
          category: true,
          tags: true,
          images: true,
          status: true,
          createdAt: true,
          organizer: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          }
        }
      }),
      prisma.activity.count({ where })
    ]);

    const formattedActivities = activities.map(a => ({
      ...a,
      startTime: a.startTime ? a.startTime.toISOString() : null,
      endTime: a.endTime ? a.endTime.toISOString() : null,
      createdAt: a.createdAt ? a.createdAt.toISOString() : null,
      tags: a.tags ? JSON.parse(a.tags) : [],
      images: a.images ? JSON.parse(a.images) : []
    }));

    res.json(successResponse({
      list: formattedActivities,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      hasMore: skip + take < total
    }));
  } catch (error) {
    logger.error('getActivities error:', error);
    res.status(500).json(errorResponse('获取活动列表失败'));
  }
};

/**
 * 获取活动详情
 */
exports.getActivityById = async (req, res) => {
  console.log('[getActivityById] id:', req.params.id, 'user:', req.user?.id);
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    console.log('[getActivityById] querying activity...');

    const activity = await prisma.activity.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startTime: true,
        endTime: true,
        maxParticipants: true,
        participantsCount: true,
        category: true,
        tags: true,
        images: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        organizer: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true
          }
        }
      }
    });
    console.log('[getActivityById] activity found:', !!activity);

    if (!activity) {
      return res.status(404).json(errorResponse('活动不存在'));
    }

    console.log('[getActivityById] building result...');
    const result = {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      location: activity.location,
      startTime: activity.startTime ? activity.startTime.toISOString() : null,
      endTime: activity.endTime ? activity.endTime.toISOString() : null,
      maxParticipants: activity.maxParticipants,
      participantsCount: activity.participantsCount,
      category: activity.category,
      tags: activity.tags ? JSON.parse(activity.tags) : [],
      images: activity.images ? JSON.parse(activity.images) : [],
      status: activity.status,
      createdAt: activity.createdAt ? activity.createdAt.toISOString() : null,
      updatedAt: activity.updatedAt ? activity.updatedAt.toISOString() : null,
      organizer: activity.organizer,
      isParticipating: false
    };
    console.log('[getActivityById] result built');

    // 查询用户参与状态
    if (userId) {
      console.log('[getActivityById] checking participation...');
      const participation = await prisma.activityParticipant.findUnique({
        where: {
          userId_activityId: { userId, activityId: id }
        }
      });
      result.isParticipating = !!participation;
      console.log('[getActivityById] isParticipating:', result.isParticipating);
    }

    console.log('[getActivityById] sending response...');
    res.json(successResponse(result));
  } catch (error) {
    console.log('[getActivityById] ERROR:', error.message, error.stack);
    res.status(500).json(errorResponse('获取活动详情失败'));
  }
};

/**
 * 创建活动
 */
exports.createActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, location, startTime, endTime, maxParticipants, category, tags, images } = req.body;

    if (!title || !description || !location || !startTime || !category) {
      return res.status(400).json(errorResponse('请填写必要字段'));
    }

    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        location,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        maxParticipants: maxParticipants || 0,
        category,
        tags: tags ? JSON.stringify(tags) : null,
        images: images ? JSON.stringify(images) : null,
        organizerId: userId,
        status: 'published'
      },
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    });

    res.status(201).json(successResponse(activity, '创建成功'));
  } catch (error) {
    logger.error('createActivity error:', error);
    res.status(500).json(errorResponse('创建活动失败'));
  }
};

/**
 * 报名参加活动
 */
exports.joinActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    if (!req.user || !req.user.id) {
      return res.status(401).json(errorResponse('请先登录'));
    }
    const userId = req.user.id;

    // 检查活动是否存在
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      return res.status(404).json(errorResponse('活动不存在'));
    }

    // 检查是否已报名
    const existing = await prisma.activityParticipant.findUnique({
      where: {
        userId_activityId: { userId, activityId }
      }
    });

    if (existing) {
      return res.status(400).json(errorResponse('您已报名该活动'));
    }

    // 检查名额
    if (activity.maxParticipants > 0 && activity.participantsCount >= activity.maxParticipants) {
      return res.status(400).json(errorResponse('活动名额已满'));
    }

    // 创建报名记录
    await prisma.$transaction([
      prisma.activityParticipant.create({
        data: {
          activityId,
          userId,
          status: 'registered'
        }
      }),
      prisma.activity.update({
        where: { id: activityId },
        data: { participantsCount: { increment: 1 } }
      })
    ]);

    res.json(successResponse({ message: '报名成功' }));
  } catch (error) {
    logger.error('joinActivity error:', error);
    res.status(500).json(errorResponse('报名失败'));
  }
};

/**
 * 取消报名
 */
exports.leaveActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user.id;

    logger.info('leaveActivity:', { activityId, userId });

    // 检查是否已报名
    const existing = await prisma.activityParticipant.findUnique({
      where: {
        userId_activityId: { userId, activityId }
      }
    });

    if (!existing) {
      return res.status(400).json(errorResponse('您未报名该活动'));
    }

    // 删除报名记录
    await prisma.$transaction([
      prisma.activityParticipant.delete({
        where: {
          userId_activityId: { userId, activityId }
        }
      }),
      prisma.activity.update({
        where: { id: activityId },
        data: { participantsCount: { decrement: 1 } }
      })
    ]);

    res.json(successResponse({ message: '取消报名成功' }));
  } catch (error) {
    logger.error('leaveActivity error:', error);
    res.status(500).json(errorResponse('取消报名失败'));
  }
};

/**
 * 更新活动
 */
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const data = req.body;

    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return res.status(404).json(errorResponse('活动不存在'));
    }

    if (activity.organizerId !== userId) {
      return res.status(403).json(errorResponse('无权限修改此活动'));
    }

    const updateData = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.location) updateData.location = data.location;
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    if (data.maxParticipants !== undefined) updateData.maxParticipants = data.maxParticipants;
    if (data.category) updateData.category = data.category;
    if (data.tags) updateData.tags = JSON.stringify(data.tags);
    if (data.images) updateData.images = JSON.stringify(data.images);

    const updated = await prisma.activity.update({
      where: { id },
      data: updateData
    });

    res.json(successResponse(updated, '更新成功'));
  } catch (error) {
    logger.error('updateActivity error:', error);
    res.status(500).json(errorResponse('更新活动失败'));
  }
};

/**
 * 删除活动
 */
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return res.status(404).json(errorResponse('活动不存在'));
    }

    if (activity.organizerId !== userId) {
      return res.status(403).json(errorResponse('无权限删除此活动'));
    }

    await prisma.activity.update({
      where: { id },
      data: { status: 'deleted' }
    });

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    logger.error('deleteActivity error:', error);
    res.status(500).json(errorResponse('删除活动失败'));
  }
};

/**
 * 获取我的活动
 */
exports.getMyActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'joined', page = 1, pageSize = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    let activities, total;

    if (type === 'organized') {
      [activities, total] = await Promise.all([
        prisma.activity.findMany({
          where: { organizerId: userId, status: { not: 'deleted' } },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            startTime: true,
            participantsCount: true,
            status: true
          }
        }),
        prisma.activity.count({ where: { organizerId: userId, status: { not: 'deleted' } } })
      ]);
    } else {
      const participations = await prisma.activityParticipant.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { joinedAt: 'desc' },
        include: {
          activity: {
            select: {
              id: true,
              title: true,
              startTime: true,
              participantsCount: true,
              status: true
            }
          }
        }
      });
      activities = participations.map(p => p.activity);
      total = await prisma.activityParticipant.count({ where: { userId } });
    }

    const formattedActivities = activities.map(a => ({
      ...a,
      startTime: a.startTime ? a.startTime.toISOString() : null
    }));

    res.json(successResponse({
      list: formattedActivities,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }));
  } catch (error) {
    logger.error('getMyActivities error:', error);
    res.status(500).json(errorResponse('获取我的活动失败'));
  }
};

/**
 * 签到 (简化版)
 */
exports.checkIn = async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user.id;

    const participation = await prisma.activityParticipant.findUnique({
      where: {
        userId_activityId: { userId, activityId }
      }
    });

    if (!participation) {
      return res.status(400).json(errorResponse('您未报名该活动'));
    }

    if (participation.checkedIn) {
      return res.status(400).json(errorResponse('您已签到'));
    }

    await prisma.activityParticipant.update({
      where: {
        userId_activityId: { userId, activityId }
      },
      data: {
        checkedIn: true,
        checkedInAt: new Date()
      }
    });

    res.json(successResponse({ message: '签到成功' }));
  } catch (error) {
    logger.error('checkIn error:', error);
    res.status(500).json(errorResponse('签到失败'));
  }
};

/**
 * 获取参与者列表
 */
exports.getParticipants = async (req, res) => {
  try {
    const { activityId } = req.params;

    const participants = await prisma.activityParticipant.findMany({
      where: { activityId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    res.json(successResponse(participants.map(p => ({
      ...p.user,
      joinedAt: p.joinedAt ? p.joinedAt.toISOString() : null,
      checkedIn: p.checkedIn
    }))));
  } catch (error) {
    logger.error('getParticipants error:', error);
    res.status(500).json(errorResponse('获取参与者列表失败'));
  }
};

/**
 * 生成签到二维码 (简化版)
 */
exports.generateCheckInQRCode = async (req, res) => {
  try {
    const { activityId } = req.params;
    const token = `checkin_${activityId}_${Date.now()}`;
    res.json(successResponse({ token, expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() }));
  } catch (error) {
    logger.error('generateCheckInQRCode error:', error);
    res.status(500).json(errorResponse('生成二维码失败'));
  }
};

/**
 * 验证签到token (简化版)
 */
exports.verifyCheckInToken = async (req, res) => {
  try {
    res.json(successResponse({ valid: true }));
  } catch (error) {
    res.status(500).json(errorResponse('验证失败'));
  }
};

/**
 * 获取签到统计
 */
exports.getCheckInStats = async (req, res) => {
  try {
    const { activityId } = req.params;

    const [total, checkedIn] = await Promise.all([
      prisma.activityParticipant.count({ where: { activityId } }),
      prisma.activityParticipant.count({ where: { activityId, checkedIn: true } })
    ]);

    res.json(successResponse({
      total,
      checkedIn,
      checkInRate: total > 0 ? ((checkedIn / total) * 100).toFixed(1) : 0
    }));
  } catch (error) {
    logger.error('getCheckInStats error:', error);
    res.status(500).json(errorResponse('获取签到统计失败'));
  }
};
