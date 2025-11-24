// routes/profile.js
// 个人主页路由

const express = require('express')
const router = express.Router()
const profileController = require('../controllers/profileController')
const { authenticate, optionalAuth } = require('../middleware/auth')

// 获取用户公开主页（可选登录）
router.get('/:userId', optionalAuth, profileController.getUserProfile)

// 获取用户主页的发布内容（可选登录）
router.get('/:userId/posts', optionalAuth, profileController.getUserPosts)

// 获取用户统计数据
router.get('/:userId/stats', profileController.getUserStats)

// 获取用户关注列表
router.get('/:userId/following', optionalAuth, profileController.getUserFollowing)

// 获取用户粉丝列表  
router.get('/:userId/followers', optionalAuth, profileController.getUserFollowers)

// 获取用户收藏列表
router.get('/:userId/favorites', authenticate, profileController.getUserFavorites)

// 获取用户参与的活动
router.get('/:userId/activities', authenticate, profileController.getUserActivities)

// 编辑个人主页（需要登录）
router.put('/', authenticate, profileController.updateProfile)

module.exports = router

