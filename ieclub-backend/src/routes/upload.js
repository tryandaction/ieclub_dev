const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');

// 简单的内存存储配置
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片上传'), false);
    }
  }
});

/**
 * 简化的图片上传路由
 * 基础路径: /api/upload
 */

// 临时响应 - 告诉前端暂时不支持上传
router.post('/avatar', authenticate, (req, res) => {
  res.status(501).json({
    success: false,
    message: '图片上传功能开发中，请暂时使用外部图片链接',
    code: 'NOT_IMPLEMENTED'
  });
});

router.post('/images-v2', authenticate, (req, res) => {
  res.status(501).json({
    success: false,
    message: '图片上传功能开发中，请暂时使用外部图片链接',
    code: 'NOT_IMPLEMENTED'
  });
});

router.post('/image', authenticate, (req, res) => {
  res.status(501).json({
    success: false,
    message: '图片上传功能开发中，请暂时使用外部图片链接',
    code: 'NOT_IMPLEMENTED'
  });
});

module.exports = router;
