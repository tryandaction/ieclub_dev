const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { uploadSingle, uploadMultipleImages } = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');

/**
 * 上传路由
 * 基础路径: /api/upload
 */

// 上传头像 (单文件: 'avatar')
router.post('/avatar', authenticate, uploadSingle, uploadController.uploadAvatar);

// 上传多张图片 (多文件: 'images')
router.post('/images-v2', authenticate, uploadMultipleImages, uploadController.uploadImages);

// 上传单张图片 (单文件: 'image')
router.post('/image', authenticate, uploadSingle, uploadController.uploadImage);

// 删除文件
router.delete('/file', authenticate, uploadController.deleteFile);

module.exports = router;
