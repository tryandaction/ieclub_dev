// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 高级搜索用户
router.get('/search', userController.searchUsers);

// 获取用户详细信息（支持高级筛选和排序）
router.get('/:id', optionalAuth, userController.getUserProfile);

// 更新用户信息（需要登录）
router.put('/:id', authenticate, userController.updateUserProfile);

// 关注/取消关注用户（需要登录）
router.post('/:id/follow', authenticate, userController.followUser);

// 获取用户关注列表
router.get('/:id/following', userController.getFollowing);

// 获取用户粉丝列表
router.get('/:id/followers', userController.getFollowers);

// 点赞用户（大拇指）（需要登录）
router.post('/:id/like', authenticate, userController.likeUser);

// 收藏用户（红心）（需要登录）
router.post('/:id/heart', authenticate, userController.heartUser);

module.exports = router;