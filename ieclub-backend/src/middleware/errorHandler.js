const logger = require('../utils/logger');

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // 默认错误状态码
  const statusCode = err.statusCode || err.status || 500;
  
  // 开发环境返回详细错误
  const errorResponse = {
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 错误处理
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.originalUrl
  });
};

/**
 * 异步错误包装器
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};