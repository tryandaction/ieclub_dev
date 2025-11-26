const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

// 上传目录配置
const UPLOAD_BASE = '/root/IEclub_dev/uploads';

// 内存存储（先接收再处理）
const storage = multer.memoryStorage();

// 文件过滤器
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、GIF、WebP 格式的图片'), false);
  }
};

// 头像上传配置（限制2MB）
const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter
});

// 通用图片上传配置（限制5MB）
const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter
});

/**
 * 生成唯一文件名
 */
const generateFileName = (ext) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
};

/**
 * 压缩并保存图片
 */
const processAndSaveImage = async (buffer, outputDir, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 80,
    generateThumb = false,
    thumbWidth = 300,
    thumbHeight = 300
  } = options;

  // 确保目录存在
  await fs.mkdir(outputDir, { recursive: true });
  if (generateThumb) {
    await fs.mkdir(path.join(outputDir, '../thumbnails'), { recursive: true });
  }

  const fileName = generateFileName('.jpg');
  const outputPath = path.join(outputDir, fileName);

  // 压缩主图
  await sharp(buffer)
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality })
    .toFile(outputPath);

  let thumbnailUrl = null;

  // 生成缩略图
  if (generateThumb) {
    const thumbPath = path.join(outputDir, '../thumbnails', fileName);
    await sharp(buffer)
      .resize(thumbWidth, thumbHeight, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toFile(thumbPath);
    thumbnailUrl = `/uploads/${path.basename(path.dirname(outputDir))}/thumbnails/${fileName}`;
  }

  return {
    fileName,
    url: `/uploads/${path.basename(path.dirname(outputDir))}/compressed/${fileName}`,
    thumbnailUrl
  };
};

/**
 * 上传头像
 * POST /api/upload/avatar
 */
router.post('/avatar', authenticate, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择图片' });
    }

    logger.info(`用户 ${req.user.id} 上传头像`, { size: req.file.size });

    const result = await processAndSaveImage(req.file.buffer, `${UPLOAD_BASE}/avatars/compressed`, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 85
    });

    res.json({
      success: true,
      message: '头像上传成功',
      data: { url: result.url }
    });
  } catch (error) {
    logger.error('头像上传失败:', error);
    res.status(500).json({ success: false, message: error.message || '上传失败' });
  }
});

/**
 * 上传封面图
 * POST /api/upload/cover
 */
router.post('/cover', authenticate, imageUpload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择图片' });
    }

    logger.info(`用户 ${req.user.id} 上传封面`, { size: req.file.size });

    const result = await processAndSaveImage(req.file.buffer, `${UPLOAD_BASE}/covers/compressed`, {
      maxWidth: 1920,
      maxHeight: 600,
      quality: 80
    });

    res.json({
      success: true,
      message: '封面上传成功',
      data: { url: result.url }
    });
  } catch (error) {
    logger.error('封面上传失败:', error);
    res.status(500).json({ success: false, message: error.message || '上传失败' });
  }
});

/**
 * 上传话题图片（支持多图）
 * POST /api/upload/images-v2
 */
router.post('/images-v2', authenticate, imageUpload.array('images', 9), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: '请选择图片' });
    }

    logger.info(`用户 ${req.user.id} 上传${req.files.length}张图片`);

    const results = [];
    for (const file of req.files) {
      const result = await processAndSaveImage(file.buffer, `${UPLOAD_BASE}/topics/compressed`, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 80,
        generateThumb: true
      });
      results.push(result);
    }

    res.json({
      success: true,
      message: '图片上传成功',
      data: {
        uploads: results.map(r => r.url),
        thumbnails: results.map(r => r.thumbnailUrl)
      }
    });
  } catch (error) {
    logger.error('图片上传失败:', error);
    res.status(500).json({ success: false, message: error.message || '上传失败' });
  }
});

/**
 * 上传单张图片
 * POST /api/upload/image
 */
router.post('/image', authenticate, imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择图片' });
    }

    const result = await processAndSaveImage(req.file.buffer, `${UPLOAD_BASE}/topics/compressed`, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 80,
      generateThumb: true
    });

    res.json({
      success: true,
      message: '图片上传成功',
      data: {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl
      }
    });
  } catch (error) {
    logger.error('图片上传失败:', error);
    res.status(500).json({ success: false, message: error.message || '上传失败' });
  }
});

module.exports = router;
