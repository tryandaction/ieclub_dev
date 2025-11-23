// ieclub-backend/src/controllers/statsControllerV2.js
// 数据统计控制器

const statsService = require('../services/statsService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

/**
 * 获取用户统计数据
 */
exports.getUserStats = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;

  const stats = await statsService.getUserStats(userId);

  res.json(success(stats));
});

/**
 * 获取平台整体统计
 */
exports.getPlatformStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getPlatformStats();

  res.json(success(stats));
});

/**
 * 获取内容趋势
 */
exports.getContentTrend = asyncHandler(async (req, res) => {
  const { days } = req.query;

  const trend = await statsService.getContentTrend(parseInt(days) || 30);

  res.json(success({ trend }));
});

/**
 * 获取热门内容
 */
exports.getHotContent = asyncHandler(async (req, res) => {
  const { type, limit, days } = req.query;

  const content = await statsService.getHotContent({
    type,
    limit: parseInt(limit) || 10,
    days: parseInt(days) || 7
  });

  res.json(success({ content }));
});

/**
 * 获取用户行为分析
 */
exports.getUserBehaviorAnalysis = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;

  const analysis = await statsService.getUserBehaviorAnalysis(userId);

  res.json(success(analysis));
});

/**
 * 获取积分趋势
 */
exports.getCreditTrend = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const { days } = req.query;

  const trend = await statsService.getCreditTrend(userId, parseInt(days) || 30);

  res.json(success({ trend }));
});

/**
 * 获取分类统计
 */
exports.getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getCategoryStats();

  res.json(success({ categories: stats }));
});

/**
 * 获取排行榜
 */
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const { type, limit } = req.query;

  const leaderboard = await statsService.getLeaderboard(type, parseInt(limit) || 50);

  res.json(success({ leaderboard }));
});

/**
 * 获取我的数据概览（Dashboard）
 */
exports.getMyDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 并行获取多个数据
  const [stats, behavior, creditTrend] = await Promise.all([
    statsService.getUserStats(userId),
    statsService.getUserBehaviorAnalysis(userId),
    statsService.getCreditTrend(userId, 7)
  ]);

  res.json(success({
    stats,
    behavior,
    creditTrend
  }));
});

