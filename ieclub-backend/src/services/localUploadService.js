// src/services/localUploadService.js
// 本地文件上传服务（开发环境使用）- 增强安全版本

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

// 使用 crypto 替代 uuid
function uuidv4() {
  return crypto.randomUUID();
}

// 文件类型魔数（文件头）验证
const FILE_SIGNATURES = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF]
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],  // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]   // GIF89a
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46]  // RIFF
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46]  // %PDF
  ]
};

/**
 * 验证文件魔数（文件头）
 */
async function validateFileSignature(buffer, mimeType) {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return true;  // 未定义的类型跳过验证

  const fileHeader = Array.from(buffer.slice(0, 8));
  
  return signatures.some(signature => {
    return signature.every((byte, index) => fileHeader[index] === byte);
  });
}

/**
 * 生成安全的文件名
 */
function generateSafeFilename(originalName, extension) {
  // 移除原文件名中的危险字符
  const safeName = originalName
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);
  
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  
  return `${timestamp}-${randomId}-${safeName}${extension}`;
}

/**
 * 验证文件路径（防止路径遍历攻击）
 */
function validateFilePath(filePath, baseDir) {
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(baseDir);
  
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new AppError('非法的文件路径', 'SECURITY_ERROR');
  }
  
  return resolvedPath;
}

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
const imagesDir = path.join(uploadDir, 'images');
const documentsDir = path.join(uploadDir, 'documents');

// 目录初始化标志
let directoriesInitialized = false;

async function ensureDirectories() {
  if (directoriesInitialized) return;
  
  try {
    await Promise.all([
      fs.mkdir(uploadDir, { recursive: true }),
      fs.mkdir(imagesDir, { recursive: true }),
      fs.mkdir(documentsDir, { recursive: true })
    ]);
    directoriesInitialized = true;
    logger.info('上传目录初始化成功');
  } catch (error) {
    logger.error('创建上传目录失败:', error);
    throw new AppError('初始化上传目录失败', 'INIT_ERROR');
  }
}

// 配置 multer 存储
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxImageSize, // 5MB
    files: 10,  // 最多10个文件
    fields: 20, // 最多20个字段
    parts: 30   // 最多30个部分
  },
  fileFilter: (req, file, cb) => {
    try {
      // 1. 验证 MIME 类型
      const allowedTypes = config.upload.allowedImageTypes;
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new AppError('不支持的文件类型', 'FILE_TYPE_ERROR'), false);
      }

      // 2. 验证文件扩展名
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      if (!allowedExtensions.includes(ext)) {
        return cb(new AppError('不支持的文件扩展名', 'FILE_EXTENSION_ERROR'), false);
      }

      // 3. 验证文件名长度
      if (file.originalname.length > 255) {
        return cb(new AppError('文件名过长', 'FILENAME_TOO_LONG'), false);
      }

      // 4. 检查文件名中的危险字符
      const dangerousChars = /[<>:"|?*\x00-\x1f]/;
      if (dangerousChars.test(file.originalname)) {
        return cb(new AppError('文件名包含非法字符', 'INVALID_FILENAME'), false);
      }

      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  },
});

/**
 * 图片处理配置
 */
const IMAGE_CONFIG = {
  maxWidth: 10000,
  maxHeight: 10000,
  quality: {
    original: 90,
    thumbnail: 80
  },
  thumbnail: {
    width: 400,
    height: 400,
    fit: 'cover'
  }
};

/**
 * 文档类型配置
 */
const DOCUMENT_CONFIG = {
  maxSize: 20 * 1024 * 1024, // 20MB
  allowedTypes: {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  }
};

class LocalUploadService {
  /**
   * 处理单个图片文件
   * @private
   */
  static async _processSingleImage(file) {
    // 1. 验证文件魔数（防止伪造文件类型）
    const isValidSignature = await validateFileSignature(file.buffer, file.mimetype);
    if (!isValidSignature) {
      logger.warn('文件魔数验证失败:', { originalName: file.originalname, mimetype: file.mimetype });
      throw new AppError('文件类型验证失败', 'INVALID_FILE_SIGNATURE');
    }

    // 2. 使用 sharp 验证图片（防止恶意图片）
    let imageInfo;
    try {
      imageInfo = await sharp(file.buffer).metadata();
    } catch (error) {
      logger.warn('图片格式验证失败:', { originalName: file.originalname });
      throw new AppError('无效的图片格式', 'INVALID_IMAGE_FORMAT');
    }

    // 3. 验证图片尺寸
    if (imageInfo.width > IMAGE_CONFIG.maxWidth || imageInfo.height > IMAGE_CONFIG.maxHeight) {
      throw new AppError(
        `图片尺寸过大，最大${IMAGE_CONFIG.maxWidth}x${IMAGE_CONFIG.maxHeight}`,
        'IMAGE_TOO_LARGE'
      );
    }

    // 4. 生成安全的文件名
    const fileId = uuidv4();
    const timestamp = Date.now();
    const originalName = `${timestamp}-${fileId}-original.jpg`;
    const thumbnailName = `${timestamp}-${fileId}-thumb.jpg`;

    // 5. 验证文件路径（防止路径遍历）
    const originalPath = validateFilePath(path.join(imagesDir, originalName), imagesDir);
    const thumbnailPath = validateFilePath(path.join(imagesDir, thumbnailName), imagesDir);

    // 6. 处理并保存原图（重新编码，移除 EXIF 数据）
    const processedBuffer = await sharp(file.buffer)
      .rotate()  // 根据 EXIF 自动旋转
      .withMetadata({
        exif: {},  // 移除 EXIF 数据（可能包含敏感信息）
        icc: imageInfo.icc  // 保留颜色配置
      })
      .jpeg({ quality: IMAGE_CONFIG.quality.original, mozjpeg: true })
      .toBuffer();

    // 7. 生成缩略图
    const thumbnailBuffer = await sharp(processedBuffer)
      .resize(IMAGE_CONFIG.thumbnail.width, IMAGE_CONFIG.thumbnail.height, {
        fit: IMAGE_CONFIG.thumbnail.fit,
        position: 'center',
      })
      .jpeg({ quality: IMAGE_CONFIG.quality.thumbnail, mozjpeg: true })
      .toBuffer();

    // 8. 并行写入文件
    await Promise.all([
      fs.writeFile(originalPath, processedBuffer),
      fs.writeFile(thumbnailPath, thumbnailBuffer)
    ]);

    // 9. 计算文件哈希（用于去重）
    const fileHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    // 10. 生成访问URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const originalUrl = `${baseUrl}/uploads/images/${originalName}`;
    const thumbnailUrl = `${baseUrl}/uploads/images/${thumbnailName}`;

    return {
      url: originalUrl,
      thumbnail: thumbnailUrl,
      width: imageInfo.width,
      height: imageInfo.height,
      size: file.size,
      originalName: file.originalname,
      hash: fileHash,
      format: imageInfo.format
    };
  }

  /**
   * 上传图片并生成缩略图（增强安全版本）
   * @param {Array} files - 文件数组
   */
  static async uploadImages(files) {
    // 确保目录存在
    await ensureDirectories();

    if (!files || files.length === 0) {
      throw new AppError('没有文件上传', 'NO_FILES');
    }

    const results = [];

    // 并行处理所有图片（限制并发数）
    const CONCURRENT_LIMIT = 3;
    for (let i = 0; i < files.length; i += CONCURRENT_LIMIT) {
      const batch = files.slice(i, i + CONCURRENT_LIMIT);
      const batchResults = await Promise.allSettled(
        batch.map(file => this._processSingleImage(file))
      );

      batchResults.forEach((result, index) => {
        const file = batch[index];
        if (result.status === 'fulfilled') {
          results.push(result.value);
          logger.info('图片上传成功:', { 
            originalName: file.originalname,
            size: file.size,
            dimensions: `${result.value.width}x${result.value.height}`
          });
        } else {
          logger.error('处理图片失败:', { 
            originalName: file.originalname, 
            error: result.reason.message 
          });
          results.push({
            originalName: file.originalname,
            error: result.reason.message || '上传失败'
          });
        }
      });
    }

    const successCount = results.filter(r => !r.error).length;
    logger.info('图片上传完成:', { 
      total: files.length, 
      success: successCount, 
      failed: files.length - successCount 
    });

    return results;
  }

  /**
   * 处理单个文档文件
   * @private
   */
  static async _processSingleDocument(file) {
    // 1. 验证文件类型
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = DOCUMENT_CONFIG.allowedTypes[file.mimetype];
    
    if (!allowedExtensions || !allowedExtensions.includes(extension)) {
      throw new AppError('不支持的文档类型', 'INVALID_DOCUMENT_TYPE');
    }

    // 2. 验证文件大小
    if (file.size > DOCUMENT_CONFIG.maxSize) {
      throw new AppError('文件过大，最大20MB', 'FILE_TOO_LARGE');
    }

    // 3. 验证文件魔数
    const isValidSignature = await validateFileSignature(file.buffer, file.mimetype);
    if (!isValidSignature && file.mimetype === 'application/pdf') {
      logger.warn('文档魔数验证失败:', { originalName: file.originalname });
      throw new AppError('文件类型验证失败', 'INVALID_FILE_SIGNATURE');
    }

    // 4. 生成安全的文件名
    const safeFileName = generateSafeFilename(file.originalname, extension);

    // 5. 验证文件路径
    const filePath = validateFilePath(path.join(documentsDir, safeFileName), documentsDir);

    // 6. 保存文件
    await fs.writeFile(filePath, file.buffer);

    // 7. 计算文件哈希
    const fileHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    // 8. 生成访问URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/documents/${safeFileName}`;

    return {
      name: file.originalname,
      url: fileUrl,
      size: file.size,
      type: file.mimetype,
      hash: fileHash,
      extension: extension
    };
  }

  /**
   * 上传文档（增强安全版本）
   * @param {Array} files - 文件数组
   */
  static async uploadDocuments(files) {
    // 确保目录存在
    await ensureDirectories();

    if (!files || files.length === 0) {
      throw new AppError('没有文件上传', 'NO_FILES');
    }

    const results = [];

    // 并行处理所有文档（限制并发数）
    const CONCURRENT_LIMIT = 3;
    for (let i = 0; i < files.length; i += CONCURRENT_LIMIT) {
      const batch = files.slice(i, i + CONCURRENT_LIMIT);
      const batchResults = await Promise.allSettled(
        batch.map(file => this._processSingleDocument(file))
      );

      batchResults.forEach((result, index) => {
        const file = batch[index];
        if (result.status === 'fulfilled') {
          results.push(result.value);
          logger.info('文档上传成功:', { 
            originalName: file.originalname,
            size: file.size,
            type: file.mimetype
          });
        } else {
          logger.error('处理文档失败:', { 
            originalName: file.originalname, 
            error: result.reason.message 
          });
          results.push({
            name: file.originalname,
            error: result.reason.message || '上传失败'
          });
        }
      });
    }

    const successCount = results.filter(r => !r.error).length;
    logger.info('文档上传完成:', { 
      total: files.length, 
      success: successCount, 
      failed: files.length - successCount 
    });

    return results;
  }

  /**
   * 删除文件（增强安全版本）
   * @param {string} url - 文件URL
   * @param {string} userId - 用户ID（用于权限验证）
   */
  static async deleteFile(url, userId = null) {
    try {
      // 1. 验证 URL 格式
      let urlPath;
      try {
        const parsedUrl = new URL(url);
        urlPath = parsedUrl.pathname;
      } catch (error) {
        throw new AppError('无效的文件URL', 'INVALID_URL');
      }

      // 2. 验证 URL 路径（防止路径遍历）
      if (!urlPath.startsWith('/uploads/')) {
        throw new AppError('非法的文件路径', 'INVALID_PATH');
      }

      // 3. 构建文件路径
      const relativePath = urlPath.replace('/uploads/', '');
      const filePath = path.join(uploadDir, relativePath);

      // 4. 验证文件路径（防止路径遍历攻击）
      const resolvedPath = validateFilePath(filePath, uploadDir);

      // 5. 检查文件是否存在
      try {
        await fs.access(resolvedPath);
      } catch (error) {
        throw new AppError('文件不存在', 'FILE_NOT_FOUND');
      }

      // 6. 删除文件和缩略图（如果是图片）
      const deletePromises = [fs.unlink(resolvedPath)];
      
      if (urlPath.includes('/images/') && urlPath.includes('-original.jpg')) {
        const thumbnailPath = resolvedPath.replace('-original.jpg', '-thumb.jpg');
        deletePromises.push(
          fs.unlink(thumbnailPath).catch(() => {
            // 缩略图不存在时忽略错误
          })
        );
      }

      await Promise.all(deletePromises);

      logger.info('文件删除成功:', { 
        url, 
        userId,
        path: resolvedPath 
      });

      return true;
    } catch (error) {
      logger.error('删除文件失败:', { 
        url, 
        error: error.message 
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('删除文件失败', 'DELETE_FAILED');
    }
  }

  /**
   * 批量删除文件
   * @param {Array<string>} urls - 文件URL数组
   * @param {string} userId - 用户ID
   */
  static async deleteFiles(urls, userId = null) {
    if (!urls || urls.length === 0) {
      return { success: 0, failed: 0, errors: [] };
    }

    const results = await Promise.allSettled(
      urls.map(url => this.deleteFile(url, userId))
    );

    const summary = {
      success: 0,
      failed: 0,
      errors: []
    };

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        summary.success++;
      } else {
        summary.failed++;
        summary.errors.push({
          url: urls[index],
          error: result.reason.message
        });
      }
    });

    return summary;
  }

  /**
   * 获取上传中间件
   */
  static getUploadMiddleware() {
    return upload;
  }

  /**
   * 清理过期文件（可用于定时任务）
   * @param {number} daysOld - 删除多少天前的文件
   */
  static async cleanupOldFiles(daysOld = 30) {
    try {
      await ensureDirectories();
      
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      const directories = [imagesDir, documentsDir];

      for (const dir of directories) {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtimeMs < cutoffTime) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }

      logger.info('清理过期文件完成:', { 
        daysOld, 
        deletedCount 
      });

      return { deletedCount };
    } catch (error) {
      logger.error('清理过期文件失败:', error);
      throw new AppError('清理文件失败', 'CLEANUP_FAILED');
    }
  }
}

module.exports = LocalUploadService;
