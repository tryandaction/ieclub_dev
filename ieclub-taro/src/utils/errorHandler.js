/**
 * 全局错误处理工具
 */

/**
 * 错误类型枚举
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

/**
 * 错误消息映射
 */
const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: '网络连接失败，请检查网络设置',
  [ERROR_TYPES.AUTH]: '登录已过期，请重新登录',
  [ERROR_TYPES.VALIDATION]: '输入数据验证失败',
  [ERROR_TYPES.SERVER]: '服务器错误，请稍后重试',
  [ERROR_TYPES.UNKNOWN]: '未知错误，请稍后重试'
};

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(type, message, originalError = null) {
    super(message || ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN]);
    this.type = type;
    this.originalError = originalError;
    this.name = 'AppError';
  }
}

/**
 * 解析API错误
 */
export const parseApiError = (error) => {
  // 网络错误
  if (!error.response) {
    return new AppError(
      ERROR_TYPES.NETWORK,
      error.message || ERROR_MESSAGES[ERROR_TYPES.NETWORK],
      error
    );
  }

  const { status, data } = error.response;

  // 认证错误
  if (status === 401 || status === 403) {
    return new AppError(
      ERROR_TYPES.AUTH,
      data?.message || ERROR_MESSAGES[ERROR_TYPES.AUTH],
      error
    );
  }

  // 验证错误
  if (status === 400 || status === 422) {
    return new AppError(
      ERROR_TYPES.VALIDATION,
      data?.message || ERROR_MESSAGES[ERROR_TYPES.VALIDATION],
      error
    );
  }

  // 服务器错误
  if (status >= 500) {
    return new AppError(
      ERROR_TYPES.SERVER,
      data?.message || ERROR_MESSAGES[ERROR_TYPES.SERVER],
      error
    );
  }

  // 其他错误
  return new AppError(
    ERROR_TYPES.UNKNOWN,
    data?.message || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN],
    error
  );
};

/**
 * 错误日志记录
 */
export const logError = (error, context = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    type: error.type || ERROR_TYPES.UNKNOWN,
    context,
    stack: error.stack,
    originalError: error.originalError
  };

  // 开发环境：输出到控制台
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Log:', errorLog);
  }

  // 生产环境：上报到监控服务
  // if (process.env.NODE_ENV === 'production') {
  //   reportToMonitoring(errorLog);
  // }

  return errorLog;
};

/**
 * 获取用户友好的错误消息
 */
export const getUserFriendlyMessage = (error) => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
};

/**
 * 处理异步错误
 */
export const handleAsyncError = async (asyncFn, errorCallback = null) => {
  try {
    return await asyncFn();
  } catch (error) {
    const appError = parseApiError(error);
    logError(appError);

    if (errorCallback) {
      errorCallback(appError);
    }

    throw appError;
  }
};

/**
 * 重试机制
 */
export const retryAsync = async (
  asyncFn,
  maxRetries = 3,
  delay = 1000,
  onRetry = null
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt, maxRetries);
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw parseApiError(lastError);
};

export default {
  ERROR_TYPES,
  AppError,
  parseApiError,
  logError,
  getUserFriendlyMessage,
  handleAsyncError,
  retryAsync
};

