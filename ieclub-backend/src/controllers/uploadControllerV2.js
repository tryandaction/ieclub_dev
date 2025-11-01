// ieclub-backend/src/controllers/uploadControllerV2.js
// 文件上传控制器 V2 - 整合图片压缩功能

const path = require('path');
const fs = require('fs').promises;
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/response');
const imageService = require('../services/imageService');
const logger = require('../utils/logger');

/**
 * 上传并压缩图片
 */
exports.uploadImages = asyncHandler(async (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json(error('请选择要上传的图片'));
  }

  logger.info(`收到图片上传请求`, {
    userId: req.user.id,
    count: files.length
  });

  const results = [];
  const uploadDir = path.join(__dirname, '../../uploads/images');
  const compressedDir = path.join(uploadDir, 'compressed');
  const thumbnailDir = path.join(uploadDir, 'thumbnails');

  // 确保目录存在
  await fs.mkdir(compressedDir, { recursive: true });
  await fs.mkdir(thumbnailDir, { recursive: true });

  for (const file of files) {
    try {
      // 验证图片
      const validation = await imageService.validateImage(file.path);
      if (!validation.valid) {
        results.push({
          originalName: file.originalname,
          error: validation.error
        });
        continue;
      }

      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const compressedPath = path.join(compressedDir, `${filename}.jpg`);
      const thumbnailPath = path.join(thumbnailDir, `${filename}_thumb.jpg`);

      // 压缩图片
      const compressed = await imageService.compressImage(file.path, compressedPath, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 80,
        format: 'jpeg'
      });

      // 生成缩略图
      await imageService.generateThumbnail(file.path, thumbnailPath, {
        width: 300,
        height: 300,
        fit: 'cover'
      });

      // 生成访问URL
      const baseUrl = req.protocol + '://' + req.get('host');
      const compressedUrl = `${baseUrl}/uploads/images/compressed/${filename}.jpg`;
      const thumbnailUrl = `${baseUrl}/uploads/images/thumbnails/${filename}_thumb.jpg`;

      results.push({
        originalName: file.originalname,
        url: compressedUrl,
        thumbnailUrl,
        size: compressed.compressedSize,
        width: compressed.width,
        height: compressed.height,
        compressionRatio: ((1 - compressed.compressedSize / compressed.originalSize) * 100).toFixed(2) + '%'
      });

      // 删除原文件
      await fs.unlink(file.path).catch(() => {});

      logger.info(`图片上传成功: ${file.originalname}`);
    } catch (err) {
      logger.error(`处理图片失败: ${file.originalname}`, err);
      results.push({
        originalName: file.originalname,
        error: err.message
      });
    }
  }

  res.json(success({ uploads: results }, '上传完成'));
});

/**
 * 上传头像（自动裁剪为正方形）
 */
exports.uploadAvatar = asyncHandler(async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json(error('请选择要上传的头像'));
  }

  // 验证图片
  const validation = await imageService.validateImage(file.path);
  if (!validation.valid) {
    await fs.unlink(file.path).catch(() => {});
    return res.status(400).json(error(validation.error));
  }

  const uploadDir = path.join(__dirname, '../../uploads/avatars');
  await fs.mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}-${req.user.id}.jpg`;
  const outputPath = path.join(uploadDir, filename);

  // 裁剪为正方形并压缩
  const metadata = await imageService.getImageInfo(file.path);
  const size = Math.min(metadata.width, metadata.height);

  await imageService.cropImage(file.path, outputPath, {
    width: size,
    height: size,
    left: Math.floor((metadata.width - size) / 2),
    top: Math.floor((metadata.height - size) / 2)
  });

  // 再压缩
  const compressedPath = outputPath.replace('.jpg', '_compressed.jpg');
  await imageService.compressImage(outputPath, compressedPath, {
    maxWidth: 500,
    maxHeight: 500,
    quality: 85,
    format: 'jpeg'
  });

  // 删除临时文件
  await fs.unlink(file.path).catch(() => {});
  await fs.unlink(outputPath).catch(() => {});

  const baseUrl = req.protocol + '://' + req.get('host');
  const avatarUrl = `${baseUrl}/uploads/avatars/${filename.replace('.jpg', '_compressed.jpg')}`;

  // 更新用户头像
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  await prisma.user.update({
    where: { id: req.user.id },
    data: { avatar: avatarUrl }
  });

  logger.info(`用户 ${req.user.id} 上传头像成功`);

  res.json(success({ avatarUrl }, '头像上传成功'));
});

/**
 * 上传文档
 */
exports.uploadDocuments = asyncHandler(async (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json(error('请选择要上传的文档'));
  }

  const allowedFormats = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'];
  const results = [];

  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedFormats.includes(ext)) {
      results.push({
        originalName: file.originalname,
        error: '不支持的文件格式'
      });
      await fs.unlink(file.path).catch(() => {});
      continue;
    }

    // 检查文件大小（最大20MB）
    const maxSize = 20 * 1024 * 1024;
    const stats = await fs.stat(file.path);
    
    if (stats.size > maxSize) {
      results.push({
        originalName: file.originalname,
        error: '文件过大，最大20MB'
      });
      await fs.unlink(file.path).catch(() => {});
      continue;
    }

    const baseUrl = req.protocol + '://' + req.get('host');
    const fileUrl = `${baseUrl}/${file.path.replace(/\\/g, '/')}`;

    results.push({
      originalName: file.originalname,
      url: fileUrl,
      size: stats.size,
      type: ext
    });

    logger.info(`文档上传成功: ${file.originalname}`);
  }

  res.json(success({ uploads: results }, '上传完成'));
});

/**
 * 删除文件
 */
exports.deleteFile = asyncHandler(async (req, res) => {
  const { fileUrl } = req.body;

  if (!fileUrl) {
    return res.status(400).json(error('请提供文件URL'));
  }

  try {
    // 从URL提取文件路径
    const urlParts = fileUrl.split('/uploads/');
    if (urlParts.length !== 2) {
      return res.status(400).json(error('无效的文件URL'));
    }

    const filePath = path.join(__dirname, '../../uploads/', urlParts[1]);

    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json(error('文件不存在'));
    }

    // 删除文件
    await fs.unlink(filePath);

    logger.info(`删除文件: ${filePath}`);

    res.json(success(null, '删除成功'));
  } catch (err) {
    logger.error('删除文件失败:', err);
    return res.status(500).json(error('删除失败'));
  }
});

/**
 * 获取链接预览
 */
exports.getLinkPreview = asyncHandler(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json(error('请提供URL'));
  }

  try {
    const axios = require('axios');
    const cheerio = require('cheerio');

    // 获取页面内容
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 提取 OpenGraph 标签
    const preview = {
      url,
      title: $('meta[property="og:title"]').attr('content') || $('title').text(),
      description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content'),
      image: $('meta[property="og:image"]').attr('content'),
      siteName: $('meta[property="og:site_name"]').attr('content')
    };

    res.json(success(preview));
  } catch (err) {
    logger.error('获取链接预览失败:', err);
    return res.status(500).json(error('获取预览失败'));
  }
});

