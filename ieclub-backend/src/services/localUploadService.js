// src/services/localUploadService.js
// 本地文件上传服务（开发环境使用）

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');

// 使用 crypto 替代 uuid
function uuidv4() {
  return crypto.randomUUID();
}

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
const imagesDir = path.join(uploadDir, 'images');
const documentsDir = path.join(uploadDir, 'documents');

async function ensureDirectories() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(imagesDir, { recursive: true });
    await fs.mkdir(documentsDir, { recursive: true });
  } catch (error) {
    logger.error('创建上传目录失败:', error);
  }
}

// 初始化目录
ensureDirectories();

// 配置 multer 存储
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxImageSize, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = config.upload.allowedImageTypes;
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  },
});

class LocalUploadService {
  /**
   * 上传图片并生成缩略图
   * @param {Array} files - 文件数组
   */
  static async uploadImages(files) {
    try {
      const results = [];

      for (const file of files) {
        const fileId = uuidv4();
        const timestamp = Date.now();
        const originalName = `${timestamp}-${fileId}-original.jpg`;
        const thumbnailName = `${timestamp}-${fileId}-thumb.jpg`;

        // 保存原图
        const originalPath = path.join(imagesDir, originalName);
        await fs.writeFile(originalPath, file.buffer);

        // 生成缩略图
        const thumbnailBuffer = await sharp(file.buffer)
          .resize(400, 400, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        const thumbnailPath = path.join(imagesDir, thumbnailName);
        await fs.writeFile(thumbnailPath, thumbnailBuffer);

        // 获取图片信息
        const imageInfo = await sharp(file.buffer).metadata();

        // 生成访问URL
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const originalUrl = `${baseUrl}/uploads/images/${originalName}`;
        const thumbnailUrl = `${baseUrl}/uploads/images/${thumbnailName}`;

        results.push({
          url: originalUrl,
          thumbnail: thumbnailUrl,
          width: imageInfo.width,
          height: imageInfo.height,
          size: file.size,
          originalName: file.originalname,
        });
      }

      logger.info('图片上传成功:', { count: results.length });
      return results;
    } catch (error) {
      logger.error('图片上传失败:', error);
      throw error;
    }
  }

  /**
   * 上传文档
   * @param {Array} files - 文件数组
   */
  static async uploadDocuments(files) {
    try {
      const results = [];

      for (const file of files) {
        const fileId = uuidv4();
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const fileName = `${timestamp}-${fileId}${extension}`;

        const filePath = path.join(documentsDir, fileName);
        await fs.writeFile(filePath, file.buffer);

        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const fileUrl = `${baseUrl}/uploads/documents/${fileName}`;

        results.push({
          name: file.originalname,
          url: fileUrl,
          size: file.size,
          type: file.mimetype,
        });
      }

      logger.info('文档上传成功:', { count: results.length });
      return results;
    } catch (error) {
      logger.error('文档上传失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件
   * @param {string} url - 文件URL
   */
  static async deleteFile(url) {
    try {
      // 从URL中提取文件路径
      const urlPath = new URL(url).pathname;
      const filePath = path.join(__dirname, '../../', urlPath);

      await fs.unlink(filePath);
      logger.info('文件删除成功:', { url });
      return true;
    } catch (error) {
      logger.error('删除文件失败:', error);
      return false;
    }
  }

  /**
   * 获取上传中间件
   */
  static getUploadMiddleware() {
    return upload;
  }
}

module.exports = LocalUploadService;
