// src/utils/response.js
// 统一响应格式工具

/**
 * 成功响应
 */
exports.success = (res, data = null, message = '操作成功') => {
  return res.json({
    success: true,
    code: 200,
    message,
    data,
    timestamp: Date.now(),
  });
};

/**
 * 分页响应
 */
exports.paginated = (res, data, pagination) => {
  return res.json({
    success: true,
    code: 200,
    message: '获取成功',
    data,
    pagination,
    timestamp: Date.now(),
  });
};

/**
 * 创建成功响应
 */
exports.created = (res, data = null, message = '创建成功') => {
  return res.status(201).json({
    success: true,
    code: 201,
    message,
    data,
    timestamp: Date.now(),
  });
};

/**
 * 错误响应
 */
exports.error = (res, message = '操作失败', code = 400, errors = null) => {
  return res.status(code).json({
    success: false,
    code,
    message,
    errors,
    timestamp: Date.now(),
  });
};

/**
 * 未授权响应
 */
exports.unauthorized = (res, message = '未授权访问') => {
  return res.status(401).json({
    success: false,
    code: 401,
    message,
    timestamp: Date.now(),
  });
};

/**
 * 禁止访问响应
 */
exports.forbidden = (res, message = '禁止访问') => {
  return res.status(403).json({
    success: false,
    code: 403,
    message,
    timestamp: Date.now(),
  });
};

/**
 * 未找到响应
 */
exports.notFound = (res, message = '资源不存在') => {
  return res.status(404).json({
    success: false,
    code: 404,
    message,
    timestamp: Date.now(),
  });
};

/**
 * 服务器错误响应
 */
exports.serverError = (res, message = '服务器内部错误') => {
  return res.status(500).json({
    success: false,
    code: 500,
    message,
    timestamp: Date.now(),
  });
};

/**
 * 成功响应（返回数据对象）
 */
exports.successResponse = (data = null, message = '操作成功') => {
  return {
    success: true,
    code: 200,
    message,
    data,
    timestamp: Date.now(),
  };
};

/**
 * 错误响应（返回数据对象）
 */
exports.errorResponse = (message = '操作失败', code = 400) => {
  return {
    success: false,
    code,
    message,
    timestamp: Date.now(),
  };
};