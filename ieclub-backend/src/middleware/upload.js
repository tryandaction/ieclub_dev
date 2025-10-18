// src/middleware/upload.js
// 文件上传中间件

const multer = require('multer');
const config = require('../config');

// 内存存储配置
const storage = multer.memoryStorage();

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  if (file.mimetype.startsWith('image/')) {
    // 图片类型检查
    if (!config.upload.allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('不支持的图片格式'), false);
    }
  } else if (file.mimetype.includes('document') || file.mimetype.includes('pdf') || file.mimetype.includes('word') || file.mimetype.includes('excel') || file.mimetype.includes('powerpoint')) {
    // 文档类型检查
    if (!config.upload.allowedDocumentTypes.some(type => file.mimetype.includes(type.replace('application/', '')))) {
      return cb(new Error('不支持的文档格式'), false);
    }
  } else {
    return cb(new Error('不支持的文件类型'), false);
  }

  cb(null, true);
};

// 上传中间件配置
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10, // 最多10个文件
  },
});

// 多图片上传中间件
exports.uploadMultipleImages = upload.fields([
  { name: 'images', maxCount: config.business.topic.maxImages }
]);

// 多文档上传中间件
exports.uploadMultipleDocuments = upload.fields([
  { name: 'documents', maxCount: config.business.topic.maxDocuments }
]);

// 单文件上传中间件
exports.uploadSingle = upload.single('file');

// 上传错误处理中间件
exports.handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: `文件大小不能超过 ${Math.floor(config.upload.maxImageSize / (1024 * 1024))}MB`,
        timestamp: Date.now(),
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '文件数量过多',
        timestamp: Date.now(),
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '不支持的文件类型',
        timestamp: Date.now(),
      });
    }
  }

  if (error.message) {
    return res.status(400).json({
      success: false,
      code: 400,
      message: error.message,
      timestamp: Date.now(),
    });
  }

  next(error);
};

// 获取上传的文件数组
exports.getUploadedFiles = (req, fieldName) => {
  if (!req.files || !req.files[fieldName]) {
    return [];
  }

  return Array.isArray(req.files[fieldName]) ? req.files[fieldName] : [req.files[fieldName]];
};