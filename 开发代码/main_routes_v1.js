// ieclub-backend/src/routes/index.js
// 主路由配置 - 集成社区模块

const express = require('express');
const router = express.Router();

// 导入各模块路由
const authRoutes = require('./auth');
const userRoutes = require('./user');
const topicRoutes = require('./topic');
const commentRoutes = require('./comment');
const uploadRoutes = require('./upload');
const notificationRoutes = require('./notification');
const searchRoutes = require('./search');
const communityRoutes = require('./community'); // 新增

// 注册路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/topics', topicRoutes);
router.use('/comments', commentRoutes);
router.use('/upload', uploadRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchRoutes);
router.use('/community', communityRoutes); // 新增社区路由

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
