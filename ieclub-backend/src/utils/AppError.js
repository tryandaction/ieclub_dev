// ieclub-backend/src/utils/AppError.js - 统一错误类
const { ERROR_CODES } = require('../config/constants');

class AppError extends Error {
  constructor(errorCode, details = null) {
    const errorInfo = ERROR_CODES[errorCode] || ERROR_CODES.SERVER_ERROR;
    super(errorInfo.message);

    this.code = errorCode;
    this.errorCode = errorInfo.code;
    this.statusCode = errorInfo.status;
    this.message = errorInfo.message;
    this.details = details;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        errorCode: this.errorCode,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

module.exports = AppError;