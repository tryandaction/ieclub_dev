// src/utils/AppError.js
// 统一的应用错误类 - 增强版

/**
 * 自定义应用错误类
 * 用于统一的错误处理和响应格式
 */
class AppError extends Error {
  /**
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP 状态码
   * @param {string} code - 错误代码
   * @param {*} details - 错误详情
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // 标记为可操作的错误（非程序bug）
    this.timestamp = Date.now();
    
    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 转换为 JSON 响应格式
   */
  toJSON() {
    const response = {
      success: false,
      code: this.statusCode,
      errorCode: this.code,
      message: this.message,
      timestamp: this.timestamp
    };

    // 只在有详情时添加
    if (this.details) {
      response.details = this.details;
    }

    // 开发环境添加堆栈信息
    if (process.env.NODE_ENV === 'development') {
      response.stack = this.stack;
    }

    return response;
  }

  // ==================== 静态工厂方法 ====================

  /**
   * 400 Bad Request - 请求参数错误
   */
  static BadRequest(message = '请求参数错误', details = null) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  /**
   * 401 Unauthorized - 未授权
   */
  static Unauthorized(message = '未授权，请先登录') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  /**
   * 403 Forbidden - 禁止访问
   */
  static Forbidden(message = '禁止访问，权限不足') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  /**
   * 404 Not Found - 资源不存在
   */
  static NotFound(resource = '资源') {
    return new AppError(`${resource}不存在`, 404, 'NOT_FOUND');
  }

  /**
   * 409 Conflict - 资源冲突
   */
  static Conflict(message = '资源冲突') {
    return new AppError(message, 409, 'CONFLICT');
  }

  /**
   * 422 Unprocessable Entity - 验证失败
   */
  static ValidationError(message = '数据验证失败', details = null) {
    return new AppError(message, 422, 'VALIDATION_ERROR', details);
  }

  /**
   * 429 Too Many Requests - 请求过于频繁
   */
  static TooManyRequests(message = '请求过于频繁，请稍后重试') {
    return new AppError(message, 429, 'TOO_MANY_REQUESTS');
  }

  /**
   * 500 Internal Server Error - 服务器内部错误
   */
  static InternalError(message = '服务器内部错误') {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }

  /**
   * 503 Service Unavailable - 服务不可用
   */
  static ServiceUnavailable(message = '服务暂时不可用') {
    return new AppError(message, 503, 'SERVICE_UNAVAILABLE');
  }

  // ==================== 业务错误 ====================

  /**
   * 用户相关错误
   */
  static UserNotFound() {
    return new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  static UserAlreadyExists() {
    return new AppError('用户已存在', 409, 'USER_ALREADY_EXISTS');
  }

  static InvalidCredentials() {
    return new AppError('邮箱或密码错误', 401, 'INVALID_CREDENTIALS');
  }

  static UserBanned() {
    return new AppError('账号已被封禁', 403, 'USER_BANNED');
  }

  /**
   * 话题相关错误
   */
  static TopicNotFound() {
    return new AppError('话题不存在', 404, 'TOPIC_NOT_FOUND');
  }

  static TopicAlreadyLiked() {
    return new AppError('已经点赞过该话题', 409, 'TOPIC_ALREADY_LIKED');
  }

  /**
   * 活动相关错误
   */
  static ActivityNotFound() {
    return new AppError('活动不存在', 404, 'ACTIVITY_NOT_FOUND');
  }

  static ActivityFull() {
    return new AppError('活动名额已满', 409, 'ACTIVITY_FULL');
  }

  static AlreadyJoined() {
    return new AppError('已经报名过该活动', 409, 'ALREADY_JOINED');
  }

  static ActivityStarted() {
    return new AppError('活动已开始，无法报名', 400, 'ACTIVITY_STARTED');
  }

  /**
   * 评论相关错误
   */
  static CommentNotFound() {
    return new AppError('评论不存在', 404, 'COMMENT_NOT_FOUND');
  }

  /**
   * 文件上传错误
   */
  static FileTooLarge(maxSize) {
    return new AppError(`文件大小超过限制 (最大 ${maxSize})`, 400, 'FILE_TOO_LARGE');
  }

  static InvalidFileType(allowedTypes) {
    return new AppError(
      `不支持的文件类型 (支持: ${allowedTypes.join(', ')})`, 
      400, 
      'INVALID_FILE_TYPE'
    );
  }

  /**
   * 权限错误
   */
  static NoPermission(action = '执行此操作') {
    return new AppError(`无权${action}`, 403, 'NO_PERMISSION');
  }

  static NotOwner() {
    return new AppError('只有作者可以执行此操作', 403, 'NOT_OWNER');
  }

  /**
   * 验证码错误
   */
  static InvalidVerifyCode() {
    return new AppError('验证码错误或已过期', 400, 'INVALID_VERIFY_CODE');
  }

  static VerifyCodeExpired() {
    return new AppError('验证码已过期', 400, 'VERIFY_CODE_EXPIRED');
  }

  /**
   * Token 错误
   */
  static InvalidToken() {
    return new AppError('无效的认证令牌', 401, 'INVALID_TOKEN');
  }

  static TokenExpired() {
    return new AppError('登录已过期，请重新登录', 401, 'TOKEN_EXPIRED');
  }

  /**
   * 数据库错误
   */
  static DatabaseError(message = '数据库操作失败') {
    return new AppError(message, 500, 'DATABASE_ERROR');
  }

  /**
   * 外部服务错误
   */
  static ExternalServiceError(service = '外部服务') {
    return new AppError(`${service}调用失败`, 503, 'EXTERNAL_SERVICE_ERROR');
  }
}

/**
 * 业务错误类（继承自 AppError）
 * 用于业务逻辑中的可预期错误
 */
class BusinessError extends AppError {
  constructor(message, statusCode = 400, code = 'BUSINESS_ERROR', details = null) {
    super(message, statusCode, code, details);
    this.name = 'BusinessError';
    this.isBusinessError = true;
  }
}

module.exports = AppError;
module.exports.BusinessError = BusinessError;
