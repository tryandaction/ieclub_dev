// src/middleware/auth.js
// JWT 认证中间件

const jwt = require('jsonwebtoken');
const config = require('../config');
const response = require('../utils/response');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// 使用共享的 Prisma 实例以支持测试 mock
let prisma;
try {
  prisma = require('../config/database');
} catch {
  // Fallback for tests
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
}

/**
 * 验证 JWT Token
 */
exports.authenticate = async (req, res, next) => {
  console.log(' [authenticate] 开始认证', req.method, req.path);
  try {
    // 从 Header 中获取 token
    const authHeader = req.headers.authorization;
    console.log(' [authenticate] authHeader:', authHeader ? 'EXISTS' : 'MISSING');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(' [authenticate] Token missing or invalid format');
      throw AppError.Unauthorized('缺少认证令牌');
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    console.log(' [authenticate] Token length:', token.length);

    // 验证 token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
      console.log(' [authenticate] Token verified, userId:', decoded.userId);
    } catch (error) {
      console.log(' [authenticate] Token verification failed:', error.name);
      if (error.name === 'TokenExpiredError') {
        throw AppError.TokenExpired();
      }
      throw AppError.InvalidToken();
    }

    // 查询用户信息
    console.log(' [authenticate] Querying user...');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        openid: true,
        nickname: true,
        avatar: true,
        email: true,
        status: true,
        level: true,
        credits: true,
        isCertified: true,
        isVip: true,
      },
    });

    if (!user) {
      console.log(' [authenticate] User not found');
      throw AppError.UserNotFound();
    }

    if (user.status !== 'active') {
      console.log(' [authenticate] User banned');
      throw AppError.UserBanned();
    }

    // 将用户信息挂载到 req 对象
    req.user = user;
    req.userId = user.id;

    console.log(' [authenticate] Authentication successful');
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 可选认证（如果有 token 则验证，没有则跳过）
 */
exports.optionalAuth = async (req, res, next) => {
  console.log('[optionalAuth] path:', req.path);
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[optionalAuth] no token');
      return next();
    }

    const token = authHeader.substring(7);
    console.log('[optionalAuth] token length:', token.length);

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      console.log('[optionalAuth] decoded userId:', decoded.userId);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          openid: true,
          nickname: true,
          avatar: true,
          status: true,
        },
      });
      console.log('[optionalAuth] user found:', !!user);

      if (user && user.status === 'active') {
        req.user = user;
        req.userId = user.id;
        console.log('[optionalAuth] user set:', user.id);
      }
    } catch (error) {
      console.log('[optionalAuth] token error:', error.message);
    }

    next();
  } catch (error) {
    console.log('[optionalAuth] middleware error:', error.message);
    next();
  }
};

/**
 * 检查是否为 VIP 用户
 */
exports.requireVip = (req, res, next) => {
  if (!req.user) {
    return response.unauthorized(res);
  }

  if (!req.user.isVip) {
    return response.forbidden(res, '该功能仅限 VIP 用户使用');
  }

  next();
};

/**
 * 检查是否为认证用户
 */
exports.requireCertified = (req, res, next) => {
  if (!req.user) {
    return response.unauthorized(res);
  }

  if (!req.user.isCertified) {
    return response.forbidden(res, '该功能需要完成实名认证');
  }

  next();
};

/**
 * 生成 JWT Token
 * @param {object} payload - Token 载荷
 * @param {string} type - Token 类型（access 或 refresh）
 */
exports.generateToken = (payload, type = 'access') => {
  const secret = type === 'refresh' ? config.jwt.refreshSecret : config.jwt.secret;
  const expiresIn = type === 'refresh' ? config.jwt.refreshExpiresIn : config.jwt.expiresIn;

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * 刷新 Token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return response.error(res, '请提供刷新令牌');
    }

    // 验证 refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (error) {
      return response.unauthorized(res, '刷新令牌无效或已过期');
    }

    // 查询用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.status !== 'active') {
      return response.unauthorized(res, '用户不存在或已被禁用');
    }

    // 生成新的 token
    const newAccessToken = exports.generateToken({ userId: user.id }, 'access');
    const newRefreshToken = exports.generateToken({ userId: user.id }, 'refresh');

    return response.success(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    }, 'Token 刷新成功');
  } catch (error) {
    logger.error('刷新 Token 错误:', error);
    return response.serverError(res, 'Token 刷新失败');
  }
};