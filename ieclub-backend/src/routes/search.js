// ===== routes/search.js - 搜索路由 =====
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');

// 搜索话题
router.get('/topics', searchController.searchTopics);

// 搜索用户
router.get('/users', searchController.searchUsers);

// 获取搜索建议（智能联想+纠错）
router.get('/suggestions', searchController.getSearchSuggestions);

// 获取自动补全
router.get('/autocomplete', searchController.getAutoComplete);

// 获取热门搜索
router.get('/hot-keywords', searchController.getHotKeywords);

// 获取用户搜索历史（需要登录）
router.get('/history', authenticate, searchController.getSearchHistory);

// 清除搜索历史（需要登录）
router.delete('/history', authenticate, searchController.clearSearchHistory);

module.exports = router;

