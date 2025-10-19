// ieclub-backend/src/config/constants.js - 统一错误码定义
const ERROR_CODES = {
  // 认证错误 (1xxx)
  AUTH_TOKEN_MISSING: { code: 1001, message: '请提供认证令牌', status: 401 },
  AUTH_TOKEN_INVALID: { code: 1002, message: '无效的认证令牌', status: 401 },
  AUTH_TOKEN_EXPIRED: { code: 1003, message: '认证令牌已过期', status: 401 },
  AUTH_USER_NOT_FOUND: { code: 1004, message: '用户不存在', status: 401 },
  AUTH_INVALID_CREDENTIALS: { code: 1005, message: '用户名或密码错误', status: 401 },
  AUTH_USER_BANNED: { code: 1006, message: '账号已被封禁', status: 403 },

  // 验证错误 (2xxx)
  VALIDATION_ERROR: { code: 2001, message: '数据验证失败', status: 400 },
  VALIDATION_REQUIRED_FIELD: { code: 2002, message: '必填字段缺失', status: 400 },
  VALIDATION_INVALID_FORMAT: { code: 2003, message: '数据格式无效', status: 400 },

  // 资源错误 (3xxx)
  RESOURCE_NOT_FOUND: { code: 3001, message: '资源不存在', status: 404 },
  RESOURCE_ALREADY_EXISTS: { code: 3002, message: '资源已存在', status: 409 },
  RESOURCE_FORBIDDEN: { code: 3003, message: '无权访问此资源', status: 403 },

  // 业务错误 (4xxx)
  ALREADY_LIKED: { code: 4001, message: '已经点赞过了', status: 400 },
  NOT_LIKED: { code: 4002, message: '尚未点赞', status: 400 },
  ALREADY_BOOKMARKED: { code: 4003, message: '已经收藏过了', status: 400 },
  NOT_BOOKMARKED: { code: 4004, message: '尚未收藏', status: 400 },
  ALREADY_FOLLOWED: { code: 4005, message: '已经关注过了', status: 400 },
  NOT_FOLLOWED: { code: 4006, message: '尚未关注', status: 400 },

  // 系统错误 (5xxx)
  SERVER_ERROR: { code: 5001, message: '服务器内部错误', status: 500 },
  DATABASE_ERROR: { code: 5002, message: '数据库错误', status: 500 },
  REDIS_ERROR: { code: 5003, message: '缓存服务错误', status: 500 },

  // 限流错误 (6xxx)
  RATE_LIMIT_EXCEEDED: { code: 6001, message: '请求过于频繁，请稍后再试', status: 429 },

  // 文件上传错误 (7xxx)
  FILE_TOO_LARGE: { code: 7001, message: '文件大小超过限制', status: 400 },
  FILE_TYPE_NOT_ALLOWED: { code: 7002, message: '不支持的文件类型', status: 400 },
  FILE_UPLOAD_FAILED: { code: 7003, message: '文件上传失败', status: 500 }
};

module.exports = { ERROR_CODES };