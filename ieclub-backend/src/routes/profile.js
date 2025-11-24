// routes/profile.js
// 个人主页路由

const express = require('express')
const router = express.Router()
const profileController = require('../controllers/profileController')
const { authenticate, optionalAuth } = require('../middleware/auth')

// ⚠️ 重要：将无参数路由放在带参数路由之前，避免被 /:userId 匹配

// 编辑个人主页（需要登录）- 必须放在 /:userId 之前
router.put('/', authenticate, profileController.updateProfile)

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

module.exports = router

