// src/middleware/csrf.js
// CSRF 防护中间件 - 使用 Double Submit Cookie 模式

const crypto = require('crypto');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * 生成 CSRF Token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF Token 管理器
 */
class CSRFTokenManager {
  /**
   * 生成并设置 CSRF Token
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @returns {string} CSRF Token
   */
  static generateAndSetToken(req, res) {
    const token = generateToken();
    
    // 设置 Cookie（HttpOnly, Secure, SameSite）
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,  // 允许 JavaScript 读取（前端需要在请求头中发送）
      secure: process.env.NODE_ENV === 'production',  // 生产环境使用 HTTPS
      sameSite: 'strict',  // 严格的同站策略
      maxAge: 24 * 60 * 60 * 1000,  // 24小时
      path: '/'
    });
    
    // 同时在服务器端存储（用于验证）
    req.session = req.session || {};
    req.session.csrfSecret = token;
    
    logger.debug('生成 CSRF Token', { userId: req.user?.id });
    
    return token;
  }
  
  /**
   * 验证 CSRF Token
   * 
   * @param {Object} req - Express request
   * @returns {boolean} 是否验证通过
   */
  static verifyToken(req) {
    // 从请求头获取 Token
    const headerToken = req.headers['x-csrf-token'] || 
                       req.headers['x-xsrf-token'] ||
                       req.body?._csrf;
    
    // 从 Cookie 获取 Token
    const cookieToken = req.cookies?.['XSRF-TOKEN'];
    
    // 从 Session 获取密钥
    const sessionSecret = req.session?.csrfSecret;
    
    if (!headerToken || !cookieToken || !sessionSecret) {
      logger.warn('CSRF Token 缺失', {
        hasHeader: !!headerToken,
        hasCookie: !!cookieToken,
        hasSession: !!sessionSecret,
        userId: req.user?.id
      });
      return false;
    }
    
    // Double Submit Cookie 验证
    // 1. 请求头的 Token 必须与 Cookie 中的 Token 一致
    // 2. Cookie 中的 Token 必须与 Session 中的密钥一致
    const isValid = headerToken === cookieToken && cookieToken === sessionSecret;
    
    if (!isValid) {
      logger.warn('CSRF Token 验证失败', {
        userId: req.user?.id,
        ip: req.ip
      });
    }
    
    return isValid;
  }
  
  /**
   * 清除 CSRF Token
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static clearToken(req, res) {
    res.clearCookie('XSRF-TOKEN');
    if (req.session) {
      delete req.session.csrfSecret;
    }
    logger.debug('清除 CSRF Token', { userId: req.user?.id });
  }
}

/**
 * CSRF 保护中间件
 * 
 * @param {Object} options - 配置选项
 * @param {Array<string>} options.ignoreMethods - 忽略的 HTTP 方法，默认 ['GET', 'HEAD', 'OPTIONS']
 * @param {Array<string>} options.ignorePaths - 忽略的路径（正则表达式字符串）
 * @returns {Function} Express 中间件
 */
const csrfProtection = (options = {}) => {
  const {
    ignoreMethods = ['GET', 'HEAD', 'OPTIONS'],
    ignorePaths = []
  } = options;
  
  return (req, res, next) => {
    // 跳过安全方法（GET, HEAD, OPTIONS）
    if (ignoreMethods.includes(req.method)) {
      return next();
    }
    
    // 跳过指定路径
    const shouldIgnore = ignorePaths.some(pattern => {
      const regex = new RegExp(pattern);
      return regex.test(req.path);
    });
    
    if (shouldIgnore) {
      return next();
    }
    
    // 验证 CSRF Token
    const isValid = CSRFTokenManager.verifyToken(req);
    
    if (!isValid) {
      return next(AppError.Forbidden('CSRF Token 验证失败'));
    }
    
    next();
  };
};

/**
 * 获取 CSRF Token 的路由处理器
 */
const getCsrfToken = (req, res) => {
  const token = CSRFTokenManager.generateAndSetToken(req, res);
  
  res.json({
    success: true,
    csrfToken: token,
    message: 'CSRF Token 已生成'
  });
};

/**
 * 刷新 CSRF Token 的路由处理器
 */
const refreshCsrfToken = (req, res) => {
  // 清除旧 Token
  CSRFTokenManager.clearToken(req, res);
  
  // 生成新 Token
  const token = CSRFTokenManager.generateAndSetToken(req, res);
  
  res.json({
    success: true,
    csrfToken: token,
    message: 'CSRF Token 已刷新'
  });
};

module.exports = {
  csrfProtection,
  getCsrfToken,
  refreshCsrfToken,
  CSRFTokenManager
};

