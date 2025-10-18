// src/middleware/errorHandler.js
// 全局错误处理中间件

const logger = require('../utils/logger');
const response = require('../utils/response');
const { Prisma } = require('@prisma/client');

/**
 * 全局错误处理中间件
 */
module.exports = (err, req, res, _next) => {
  // 记录错误日志
  logger.error('全局错误处理:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.userId,
  });

  // Prisma 错误处理
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // 唯一约束违反
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || '字段';
      return response.error(res, `${field} 已存在`, 400);
    }

    // 记录不存在
    if (err.code === 'P2025') {
      return response.notFound(res, '记录不存在');
    }

    // 外键约束违反
    if (err.code === 'P2003') {
      return response.error(res, '关联数据不存在', 400);
    }

    return response.error(res, '数据库操作失败', 400);
  }

  // Prisma 验证错误
  if (err instanceof Prisma.PrismaClientValidationError) {
    return response.error(res, '数据验证失败', 400);
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return response.unauthorized(res, '无效的认证令牌');
  }

  if (err.name === 'TokenExpiredError') {
    return response.unauthorized(res, '登录已过期');
  }

  // 验证错误（express-validator）
  if (err.name === 'ValidationError') {
    return response.error(res, err.message, 400, err.errors);
  }

  // 文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    return response.error(res, '文件大小超出限制', 400);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return response.error(res, '文件数量超出限制', 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return response.error(res, '不支持的文件类型', 400);
  }

  // 业务错误
  if (err.isBusinessError) {
    return response.error(res, err.message, err.statusCode || 400);
  }

  // 默认服务器错误
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      code: statusCode,
      message,
      error: {
        message: err.message,
        stack: err.stack,
      },
      timestamp: Date.now(),
    });
  }

  // 生产环境返回简化错误信息
  return response.serverError(res, message);
};

/**
 * 404 错误处理
 */
exports.notFound = (req, res) => {
  return response.notFound(res, `路由 ${req.method} ${req.url} 不存在`);
};

/**
 * 业务错误类
 */
class BusinessError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
    this.isBusinessError = true;
  }
}

exports.BusinessError = BusinessError;