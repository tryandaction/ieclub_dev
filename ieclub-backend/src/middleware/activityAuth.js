// ieclub-backend/src/middleware/activityAuth.js
// 活动权限验证中间件

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * 验证用户是否是活动组织者
 */
const isActivityOrganizer = async (req, res, next) => {
  try {
    const { id: activityId } = req.params;
    const userId = req.user.id;

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { 
        organizerId: true,
        title: true
      }
    });

    if (!activity) {
      throw new AppError('活动不存在', 404);
    }

    if (activity.organizerId !== userId) {
      logger.warn(`用户 ${userId} 尝试访问活动 ${activityId} 的组织者功能`);
      throw new AppError('只有活动组织者可以执行此操作', 403);
    }

    // 将活动信息附加到请求对象
    req.activity = activity;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 验证用户是否已报名活动
 */
const isActivityParticipant = async (req, res, next) => {
  try {
    const { id: activityId } = req.params;
    const userId = req.user.id;

    const participation = await prisma.activityParticipant.findUnique({
      where: {
        userId_activityId: {
          userId,
          activityId
        }
      },
      select: {
        id: true,
        status: true,
        checkedIn: true,
        checkedInAt: true
      }
    });

    if (!participation) {
      throw new AppError('您尚未报名此活动', 403);
    }

    if (participation.status !== 'approved') {
      throw new AppError('您的报名尚未通过审核', 403);
    }

    // 将参与信息附加到请求对象
    req.participation = participation;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 验证用户是组织者或参与者
 */
const isOrganizerOrParticipant = async (req, res, next) => {
  try {
    const { id: activityId } = req.params;
    const userId = req.user.id;

    const [activity, participation] = await Promise.all([
      prisma.activity.findUnique({
        where: { id: activityId },
        select: { organizerId: true, title: true }
      }),
      prisma.activityParticipant.findUnique({
        where: {
          userId_activityId: {
            userId,
            activityId
          }
        },
        select: { id: true, status: true }
      })
    ]);

    if (!activity) {
      throw new AppError('活动不存在', 404);
    }

    const isOrganizer = activity.organizerId === userId;
    const isParticipant = participation && participation.status === 'approved';

    if (!isOrganizer && !isParticipant) {
      throw new AppError('您没有权限访问此活动', 403);
    }

    // 附加信息到请求对象
    req.activity = activity;
    req.isOrganizer = isOrganizer;
    req.participation = participation;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 验证活动是否正在进行
 */
const isActivityOngoing = async (req, res, next) => {
  try {
    const { id: activityId } = req.params;

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        status: true
      }
    });

    if (!activity) {
      throw new AppError('活动不存在', 404);
    }

    if (activity.status !== 'published') {
      throw new AppError('活动未发布', 400);
    }

    const now = new Date();
    const startTime = new Date(activity.startTime);
    const endTime = new Date(activity.endTime);

    if (now < startTime) {
      throw new AppError('活动尚未开始', 400);
    }

    if (now > endTime) {
      throw new AppError('活动已结束', 400);
    }

    // 附加活动信息
    req.activity = activity;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 验证活动是否可以报名
 */
const canJoinActivity = async (req, res, next) => {
  try {
    const { id: activityId } = req.params;
    const userId = req.user.id;

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        id: true,
        title: true,
        startTime: true,
        maxParticipants: true,
        participantsCount: true,
        status: true
      }
    });

    if (!activity) {
      throw new AppError('活动不存在', 404);
    }

    if (activity.status !== 'published') {
      throw new AppError('活动未发布', 400);
    }

    // 检查活动是否已开始
    const now = new Date();
    const startTime = new Date(activity.startTime);
    if (now >= startTime) {
      throw new AppError('活动已开始，无法报名', 400);
    }

    // 检查是否已满员
    if (activity.maxParticipants > 0 && 
        activity.participantsCount >= activity.maxParticipants) {
      throw new AppError('活动已满员', 400);
    }

    // 检查是否已报名
    const existingParticipation = await prisma.activityParticipant.findUnique({
      where: {
        userId_activityId: {
          userId,
          activityId
        }
      }
    });

    if (existingParticipation) {
      throw new AppError('您已报名此活动', 400);
    }

    req.activity = activity;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 检查用户是否未签到
 */
const hasNotCheckedIn = async (req, res, next) => {
  try {
    const { id: activityId } = req.params;
    const userId = req.user.id;

    const participation = await prisma.activityParticipant.findUnique({
      where: {
        userId_activityId: {
          userId,
          activityId
        }
      },
      select: {
        id: true,
        checkedIn: true,
        checkedInAt: true
      }
    });

    if (!participation) {
      throw new AppError('您尚未报名此活动', 403);
    }

    if (participation.checkedIn) {
      throw new AppError('您已签到过了', 400);
    }

    req.participation = participation;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isActivityOrganizer,
  isActivityParticipant,
  isOrganizerOrParticipant,
  isActivityOngoing,
  canJoinActivity,
  hasNotCheckedIn
};

