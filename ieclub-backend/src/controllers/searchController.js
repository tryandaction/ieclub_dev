// ieclub-backend/src/controllers/searchController.js
// 搜索控制器 - 使用服务层重构

const searchService = require('../services/searchService');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/response');

/**
 * 全局搜索
 */
exports.globalSearch = asyncHandler(async (req, res) => {
  const { keyword, page, pageSize, types } = req.query;
  const userId = req.user ? req.user.id : null;

  if (!keyword || keyword.trim().length === 0) {
    return res.status(400).json(error('请输入搜索关键词'));
  }

  const trimmedKeyword = keyword.trim();

  // 保存搜索历史
  if (userId) {
    await searchService.saveSearchHistory(userId, trimmedKeyword).catch(() => {});
  }

  const result = await searchService.globalSearch(trimmedKeyword, {
    page: parseInt(page) || 1,
    pageSize: parseInt(pageSize) || 20,
    types: types ? types.split(',') : ['posts', 'users', 'activities']
  });

  res.json(success(result));
});

/**
 * 搜索帖子
 */
exports.searchPosts = asyncHandler(async (req, res) => {
  const { keyword, page, pageSize } = req.query;
  const userId = req.user ? req.user.id : null;

  if (!keyword || keyword.trim().length === 0) {
    return res.status(400).json(error('请输入搜索关键词'));
  }

  const trimmedKeyword = keyword.trim();

  // 保存搜索历史
  if (userId) {
    await searchService.saveSearchHistory(userId, trimmedKeyword, 'posts').catch(() => {});
  }

  const result = await searchService.searchPosts(
    trimmedKeyword,
    parseInt(page) || 1,
    parseInt(pageSize) || 20
  );

  res.json(success(result));
});

/**
 * 搜索用户
 */
exports.searchUsers = asyncHandler(async (req, res) => {
  const { keyword, page, pageSize } = req.query;
  const userId = req.user ? req.user.id : null;

  if (!keyword || keyword.trim().length === 0) {
    return res.status(400).json(error('请输入搜索关键词'));
  }

  const trimmedKeyword = keyword.trim();

  // 保存搜索历史
  if (userId) {
    await searchService.saveSearchHistory(userId, trimmedKeyword, 'users').catch(() => {});
  }

  const result = await searchService.searchUsers(
    trimmedKeyword,
    parseInt(page) || 1,
    parseInt(pageSize) || 20
  );

  res.json(success(result));
});

/**
 * 搜索活动
 */
exports.searchActivities = asyncHandler(async (req, res) => {
  const { keyword, page, pageSize } = req.query;
  const userId = req.user ? req.user.id : null;

  if (!keyword || keyword.trim().length === 0) {
    return res.status(400).json(error('请输入搜索关键词'));
  }

  const trimmedKeyword = keyword.trim();

  // 保存搜索历史
  if (userId) {
    await searchService.saveSearchHistory(userId, trimmedKeyword, 'activities').catch(() => {});
  }

  const result = await searchService.searchActivities(
    trimmedKeyword,
    parseInt(page) || 1,
    parseInt(pageSize) || 20
  );

  res.json(success(result));
});

/**
 * 获取热门搜索关键词
 */
exports.getHotKeywords = asyncHandler(async (req, res) => {
  const { limit } = req.query;

  const keywords = await searchService.getHotKeywords(parseInt(limit) || 10);

  res.json(success({ keywords }));
});

/**
 * 获取搜索建议
 */
exports.getSuggestions = asyncHandler(async (req, res) => {
  const { keyword, limit } = req.query;

  if (!keyword || keyword.trim().length < 2) {
    return res.json(success({ suggestions: [] }));
  }

  const suggestions = await searchService.getSuggestions(
    keyword.trim(),
    parseInt(limit) || 10
  );

  res.json(success({ suggestions }));
});

/**
 * 获取用户搜索历史
 */
exports.getSearchHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit } = req.query;

  const history = await searchService.getUserSearchHistory(
    userId,
    parseInt(limit) || 10
  );

  res.json(success({ history }));
});

/**
 * 清空搜索历史
 */
exports.clearSearchHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await searchService.clearSearchHistory(userId);

  res.json(success(result, result.message));
});

