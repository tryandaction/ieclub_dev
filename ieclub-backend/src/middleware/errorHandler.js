const logger = require('../utils/logger');
const response = require('../utils/response');
const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, _next) => {
  logger.error('全局错误处理:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.userId,
  });

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || '字段';
      return response.error(res, `${field} 已存在`, 400);
    }
    if (err.code === 'P2025') {
      return response.notFound(res, '记录不存在');
    }
    if (err.code === 'P2003') {
      return response.error(res, '关联数据不存在', 400);
    }
    return response.error(res, '数据库操作失败', 400);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return response.error(res, '数据验证失败', 400);
  }

  if (err.name === 'JsonWebTokenError') {
    return response.unauthorized(res, '无效的认证令牌');
  }

  if (err.name === 'TokenExpiredError') {
    return response.unauthorized(res, '登录已过期');
  }

  if (err.name === 'ValidationError') {
    return response.error(res, err.message, 400, err.errors);
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return response.error(res, '文件大小超出限制', 400);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return response.error(res, '文件数量超出限制', 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return response.error(res, '不支持的文件类型', 400);
  }

  if (err.isBusinessError) {
    return response.error(res, err.message, err.statusCode || 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

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

  return response.serverError(res, message);
};

const notFoundHandler = (req, res) => {
  return response.notFound(res, `路由 ${req.method} ${req.url} 不存在`);
};

class BusinessError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
    this.isBusinessError = true;
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  BusinessError
};