/**
 * 积分控制器
 */

const creditService = require('../services/creditService');
const { success, error } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * 获取用户积分信息
 */
exports.getUserCredits = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const levelInfo = await creditService.getUserLevelInfo(userId);

  return success(res, levelInfo, '获取积分信息成功');
});

/**
 * 获取积分历史记录
 */
exports.getCreditHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 20, offset = 0, action } = req.query;

  const history = await creditService.getCreditHistory(userId, {
    limit: parseInt(limit),
    offset: parseInt(offset),
    action,
  });

  return success(res, history, '获取积分历史成功');
});

/**
 * 每日签到
 */
exports.dailyCheckIn = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await creditService.dailyCheckIn(userId);

  if (result.success) {
    return success(res, result.data, result.message);
  } else {
    return error(res, result.message, 400);
  }
});

/**
 * 获取签到状态
 */
exports.getCheckInStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const status = await creditService.getCheckInStatus(userId);

  return success(res, status, '获取签到状态成功');
});

/**
 * 获取用户勋章
 */
exports.getUserBadges = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const targetUserId = userId || req.user.id;

  const badges = await creditService.getUserBadges(targetUserId);

  return success(res, { badges }, '获取勋章列表成功');
});

/**
 * 获取所有勋章
 */
exports.getAllBadges = asyncHandler(async (req, res) => {
  const badges = await creditService.getAllBadges();

  return success(res, { badges }, '获取勋章列表成功');
});

/**
 * 获取等级排行榜
 */
exports.getLevelLeaderboard = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  const { PrismaClient } = require('@prisma/client');
  const prisma = require('../config/database');

  const users = await prisma.user.findMany({
    where: {
      status: 'active',
    },
    select: {
      id: true,
      nickname: true,
      avatar: true,
      level: true,
      exp: true,
      credits: true,
    },
    orderBy: [
      { level: 'desc' },
      { exp: 'desc' },
    ],
    take: parseInt(limit),
  });

  return success(res, { users }, '获取排行榜成功');
});

/**
 * 获取积分排行榜
 */
exports.getCreditLeaderboard = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  const { PrismaClient } = require('@prisma/client');
  const prisma = require('../config/database');

  const users = await prisma.user.findMany({
    where: {
      status: 'active',
    },
    select: {
      id: true,
      nickname: true,
      avatar: true,
      level: true,
      exp: true,
      credits: true,
    },
    orderBy: { credits: 'desc' },
    take: parseInt(limit),
  });

  return success(res, { users }, '获取排行榜成功');
});

