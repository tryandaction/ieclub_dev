// ieclub-backend/src/controllers/adminController.js
// 管理后台控制器

const adminService = require('../services/adminService');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/response');

/**
 * 获取管理后台概览
 */
exports.getDashboardOverview = asyncHandler(async (req, res) => {
  const overview = await adminService.getDashboardOverview();
  res.json(success(overview));
});

/**
 * 获取用户列表
 */
exports.getUsers = asyncHandler(async (req, res) => {
  const { page, pageSize, status, keyword, sortBy, order } = req.query;

  const result = await adminService.getUsers({
    page: parseInt(page) || 1,
    pageSize: parseInt(pageSize) || 20,
    status,
    keyword,
    sortBy,
    order
  });

  res.json(success(result));
});

/**
 * 更新用户状态
 */
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!['active', 'banned', 'suspended'].includes(status)) {
    return res.status(400).json(error('无效的状态值'));
  }

  const user = await adminService.updateUserStatus(userId, status);

  res.json(success(user, '用户状态已更新'));
});

/**
 * 获取内容列表
 */
exports.getContents = asyncHandler(async (req, res) => {
  const { type, page, pageSize, status, keyword } = req.query;

  const result = await adminService.getContents({
    type,
    page: parseInt(page) || 1,
    pageSize: parseInt(pageSize) || 20,
    status,
    keyword
  });

  res.json(success(result));
});

/**
 * 更新内容状态
 */
exports.updateContentStatus = asyncHandler(async (req, res) => {
  const { type, contentId } = req.params;
  const { status } = req.body;

  if (!['published', 'hidden', 'deleted'].includes(status)) {
    return res.status(400).json(error('无效的状态值'));
  }

  const content = await adminService.updateContentStatus(type, contentId, status);

  res.json(success(content, '内容状态已更新'));
});

/**
 * 获取活动列表
 */
exports.getActivities = asyncHandler(async (req, res) => {
  const { page, pageSize, status, keyword } = req.query;

  const result = await adminService.getActivities({
    page: parseInt(page) || 1,
    pageSize: parseInt(pageSize) || 20,
    status,
    keyword
  });

  res.json(success(result));
});

/**
 * 获取举报列表
 */
exports.getReports = asyncHandler(async (req, res) => {
  const { page, pageSize, status, type } = req.query;

  const result = await adminService.getReports({
    page: parseInt(page) || 1,
    pageSize: parseInt(pageSize) || 20,
    status,
    type
  });

  res.json(success(result));
});

/**
 * 处理举报
 */
exports.handleReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { action, adminNote } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json(error('无效的操作'));
  }

  const report = await adminService.handleReport(reportId, action, adminNote);

  res.json(success(report, '举报已处理'));
});

/**
 * 获取系统统计
 */
exports.getSystemStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const stats = await adminService.getSystemStats({ startDate, endDate });

  res.json(success(stats));
});

/**
 * 发送系统公告
 */
exports.sendAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, type, targetUsers } = req.body;

  if (!title || !content) {
    return res.status(400).json(error('标题和内容不能为空'));
  }

  const result = await adminService.sendAnnouncement({
    title,
    content,
    type: type || 'general',
    targetUsers: targetUsers || 'all'
  });

  res.json(success(result, '公告已发送'));
});

/**
 * 批量操作用户
 */
exports.batchUpdateUsers = asyncHandler(async (req, res) => {
  const { userIds, action, value } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json(error('用户ID列表不能为空'));
  }

  if (!action || !value) {
    return res.status(400).json(error('操作类型和值不能为空'));
  }

  const result = await adminService.batchUpdateUsers(userIds, action, value);

  res.json(success(result, '批量操作成功'));
});

/**
 * 导出数据
 */
exports.exportData = asyncHandler(async (_req, res) => {
  // const { type, format, filters } = req.query;

  // TODO: 实现数据导出功能
  // 支持导出为 CSV、Excel、JSON 格式

  res.json(success({ message: '数据导出功能开发中' }));
});

