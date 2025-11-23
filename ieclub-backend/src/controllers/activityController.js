// ieclub-backend/src/controllers/activityController.js
// 活动控制器 - 使用服务层重构

const activityService = require('../services/activityService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

/**
 * 创建活动
 */
exports.createActivity = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const data = req.body;

  const activity = await activityService.createActivity(userId, data);

  res.status(201).json(success(activity, '创建成功'));
});

/**
 * 获取活动列表
 */
exports.getActivities = asyncHandler(async (req, res) => {
  const { page, pageSize, status, categoryId, keyword, upcoming, past } = req.query;

  const result = await activityService.getActivities({
    page: parseInt(page) || 1,
    pageSize: parseInt(pageSize) || 20,
    status,
    categoryId,
    keyword,
    upcoming: upcoming === 'true',
    past: past === 'true'
  });

  res.json(success(result));
});

/**
 * 获取活动详情
 */
exports.getActivityById = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const userId = req.user ? req.user.id : null;

  const activity = await activityService.getActivityById(activityId, userId);

  res.json(success(activity));
});

/**
 * 更新活动
 */
exports.updateActivity = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const userId = req.user.id;
  const data = req.body;

  const activity = await activityService.updateActivity(activityId, userId, data);

  res.json(success(activity, '更新成功'));
});

/**
 * 删除活动
 */
exports.deleteActivity = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  await activityService.deleteActivity(activityId, userId, isAdmin);

  res.json(success(null, '删除成功'));
});

/**
 * 报名参加活动
 */
exports.joinActivity = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const userId = req.user.id;
  const { note } = req.body;

  const result = await activityService.joinActivity(activityId, userId, { note });

  res.json(success(result, result.message));
});

/**
 * 取消报名
 */
exports.leaveActivity = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const userId = req.user.id;

  const result = await activityService.leaveActivity(activityId, userId);

  res.json(success(result, result.message));
});

/**
 * 获取活动参与者列表
 */
exports.getParticipants = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const { page, pageSize, status } = req.query;

  const result = await activityService.getParticipants(activityId, {
    page: parseInt(page) || 1,
    pageSize: parseInt(pageSize) || 20,
    status
  });

  res.json(success(result));
});

/**
 * 活动签到
 */
exports.checkIn = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const userId = req.user.id;
  const { token } = req.body; // 签到令牌（从二维码获取）

  const result = await activityService.checkIn(activityId, userId, token);

  res.json(success(result, result.message));
});

/**
 * 生成活动签到二维码
 */
exports.generateCheckInQRCode = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const userId = req.user.id;

  const result = await activityService.generateCheckInQRCode(activityId, userId);

  res.json(success(result, '生成签到二维码成功'));
});

/**
 * 验证签到令牌
 */
exports.verifyCheckInToken = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const { token } = req.body;

  const result = await activityService.verifyCheckInToken(activityId, token);

  res.json(success(result, '验证成功'));
});

/**
 * 获取活动签到统计
 */
exports.getCheckInStats = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const userId = req.user.id;

  const stats = await activityService.getCheckInStats(activityId, userId);

  res.json(success(stats, '获取签到统计成功'));
});

/**
 * 获取我的活动
 */
exports.getMyActivities = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { type = 'joined', page = 1, pageSize = 20 } = req.query; // joined 或 organized

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  const { PrismaClient } = require('@prisma/client');
  const prisma = require('../config/database');

  if (type === 'organized') {
    // 我组织的活动
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { organizerId: userId },
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }],
        include: {
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
      prisma.activity.count({ where: { organizerId: userId } })
    ]);

    res.json(success({
      activities: activities.map(a => activityService.formatActivity(a)),
      total,
      hasMore: skip + take < total,
      currentPage: parseInt(page)
    }));
  } else {
    // 我参加的活动
    const [participations, total] = await Promise.all([
      prisma.activityParticipant.findMany({
        where: { userId },
        skip,
        take,
        orderBy: [{ joinedAt: 'desc' }],
        include: {
          activity: {
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
          }
        }
      }),
      prisma.activityParticipant.count({ where: { userId } })
    ]);

    res.json(success({
      activities: participations.map(p => ({
        ...activityService.formatActivity(p.activity),
        participationStatus: p.status,
        joinedAt: p.joinedAt.toISOString(),
        checkedIn: p.checkedIn,
        checkedInAt: p.checkedInAt ? p.checkedInAt.toISOString() : null
      })),
      total,
      hasMore: skip + take < total,
      currentPage: parseInt(page)
    }));
  }
});

