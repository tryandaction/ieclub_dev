// ieclub-backend/src/middleware/security-enhanced.js
// 增强的安全中间件

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { rateLimiters } = require('./rateLimiter');
const logger = require('../utils/logger');

/**
 * 安全头配置
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xPoweredBy: false,
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: { nosniff: true },
  xXssProtection: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

/**
 * API速率限制配置
 */
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制100次请求
  message: {
    success: false,
    code: 429,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 管理员跳过限制
    return req.user?.isAdmin === true;
  },
  keyGenerator: (req) => {
    // 使用用户ID或IP作为键
    return req.user?.id || req.ip || 'anonymous';
  }
});

/**
 * 严格速率限制（用于敏感操作）
 */
const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 限制5次请求
  message: {
    success: false,
    code: 429,
    message: '操作过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 输入清理中间件
 * 移除潜在的恶意输入
 */
function sanitizeInput(req, res, next) {
  // 清理查询参数
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    }
  }

  // 清理请求体
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }

  next();
}

/**
 * 请求大小限制检查
 */
function checkRequestSize(req, res, next) {
  const contentLength = req.get('content-length');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      code: 413,
      message: '请求体过大',
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        maxSize: `${maxSize / 1024 / 1024}MB`
      }
    });
  }

  next();
}

/**
 * IP白名单检查
 */
function createIpWhitelist(allowedIps = []) {
  return (req, res, next) => {
    if (allowedIps.length === 0) {
      return next();
    }

    const clientIp = req.ip || req.connection.remoteAddress;
    
    if (!allowedIps.includes(clientIp)) {
      logger.warn('IP不在白名单中', { ip: clientIp, path: req.path });
      return res.status(403).json({
        success: false,
        code: 403,
        message: '访问被拒绝',
        error: {
          code: 'IP_NOT_ALLOWED'
        }
      });
    }

    next();
  };
}

/**
 * 用户代理检查（防止爬虫）
 */
function checkUserAgent(req, res, next) {
  const userAgent = req.get('user-agent');
  const blockedAgents = [
    'curl',
    'wget',
    'python-requests',
    'scrapy'
  ];

  if (userAgent) {
    const lowerUA = userAgent.toLowerCase();
    for (const blocked of blockedAgents) {
      if (lowerUA.includes(blocked)) {
        logger.warn('检测到可疑User-Agent', { userAgent, ip: req.ip });
        return res.status(403).json({
          success: false,
          code: 403,
          message: '访问被拒绝',
          error: {
            code: 'INVALID_USER_AGENT'
          }
        });
      }
    }
  }

  next();
}

module.exports = {
  securityHeaders,
  apiRateLimit,
  strictRateLimit,
  sanitizeInput,
  checkRequestSize,
  createIpWhitelist,
  checkUserAgent
};

