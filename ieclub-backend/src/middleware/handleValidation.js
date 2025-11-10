// 统一的验证错误处理中间件
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * 处理 express-validator 的验证错误
 * 统一错误格式，确保与前端期望的格式一致
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    const firstError = errorArray[0];
    
    // 记录验证错误
    logger.warn('验证失败:', {
      url: req.originalUrl,
      method: req.method,
      errors: errorArray,
      body: req.body,
      ip: req.ip
    });
    
    // 返回统一格式的错误响应
    return res.status(400).json({
      success: false,
      code: 400,
      message: firstError.msg || '请求参数验证失败',
      errors: errorArray.map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

module.exports = {
  handleValidationErrors
};

