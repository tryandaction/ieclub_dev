// routes/posts.js
// 发布系统路由

const express = require('express')
const router = express.Router()
const postController = require('../controllers/postController')
const { authenticate, optionalAuth } = require('../middleware/auth')
const { apiLimiter } = require('../middleware/rateLimiter')

// 解析外链信息（需要登录）
router.post('/parse-link', authenticate, postController.parseLink)

// 创建发布内容（需要登录）
router.post('/', authenticate, apiLimiter, postController.createPost)

// 获取发布列表（可选登录）
router.get('/', optionalAuth, postController.getPosts)

// 获取发布详情（可选登录）
router.get('/:id', optionalAuth, postController.getPostById)

// 更新发布内容（需要登录）
router.put('/:id', authenticate, postController.updatePost)

// 删除发布内容（需要登录）
router.delete('/:id', authenticate, postController.deletePost)

module.exports = router
