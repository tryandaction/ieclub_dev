// src/middleware/auth.js
// JWT 认证中间件

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');
const response = require('../utils/response');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * 验证 JWT Token
 */
exports.authenticate = async (req, res, next) => {
  try {
    // 从 Header 中获取 token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.unauthorized(res, '请提供有效的认证令牌');
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证 token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return response.unauthorized(res, '登录已过期，请重新登录');
      }
      return response.unauthorized(res, '无效的认证令牌');
    }

    // 查询用户信息
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
      return response.unauthorized(res, '用户不存在');
    }

    if (user.status !== 'active') {
      return response.forbidden(res, '账号已被禁用');
    }

    // 将用户信息挂载到 req 对象
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    logger.error('认证中间件错误:', error);
    return response.serverError(res, '认证失败');
  }
};

/**
 * 可选认证（如果有 token 则验证，没有则跳过）
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // 没有 token，继续执行
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret);

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

      if (user && user.status === 'active') {
        req.user = user;
        req.userId = user.id;
      }
    } catch (error) {
      // Token 无效，继续执行但不设置用户信息
    }

    next();
  } catch (error) {
    logger.error('可选认证中间件错误:', error);
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