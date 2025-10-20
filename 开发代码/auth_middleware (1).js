// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

// 必须登录
exports.authenticate = async (req, res, next) => {
  try {
    // 从请求头获取 token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '请先登录'
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    try {
      // 验证 token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          nickname: true,
          avatar: true,
          verified: true
        }
      });

      if (!user) {
        return res.status(401).json({
          code: 401,
          message: '用户不存在'
        });
      }

      // 将用户信息附加到请求对象
      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          code: 401,
          message: '登录已过期，请重新登录'
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          code: 401,
          message: '无效的登录凭证'
        });
      }

      throw jwtError;
    }
  } catch (error) {
    console.error('认证失败:', error);
    return res.status(500).json({
      code: 500,
      message: '认证失败',
      error: error.message
    });
  }
};

// 可选登录（不强制要求登录）
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 没有 token，继续执行，但 req.user 为 null
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          nickname: true,
          avatar: true,
          verified: true
        }
      });

      req.user = user || null;
      next();
    } catch (jwtError) {
      // token 无效或过期，继续执行，但 req.user 为 null
      req.user = null;
      next();
    }
  } catch (error) {
    console.error('可选认证失败:', error);
    req.user = null;
    next();
  }
};