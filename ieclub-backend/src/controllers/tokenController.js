// src/controllers/tokenController.js
// Token 刷新和管理控制器

const prisma = require('../config/database');
const logger = require('../utils/logger');
const { generateTokenPair, verifyRefreshToken } = require('../utils/tokenUtils');
const AppError = require('../utils/AppError');

class TokenController {
  /**
   * 刷新 Token
   * POST /api/auth/refresh
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      // 验证必填字段
      if (!refreshToken) {
        throw new AppError('REFRESH_TOKEN_MISSING', 400, '缺少 Refresh Token');
      }

      // 验证 refresh token 签名和过期时间
      let decoded;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch (error) {
        if (error.code === 'REFRESH_TOKEN_EXPIRED') {
          throw new AppError('REFRESH_TOKEN_EXPIRED', 401, 'Refresh Token 已过期，请重新登录');
        }
        throw new AppError('REFRESH_TOKEN_INVALID', 401, 'Refresh Token 无效');
      }

      // 从数据库查询用户
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          nickname: true,
          avatar: true,
          level: true,
          isCertified: true,
          isVip: true,
          status: true,
          refreshToken: true,
          tokenVersion: true
        }
      });

      if (!user) {
        throw new AppError('AUTH_USER_NOT_FOUND', 401, '用户不存在');
      }

      // 检查用户状态
      if (user.status !== 'active') {
        throw new AppError('AUTH_USER_BANNED', 403, '账户已被禁用');
      }

      // 验证 refresh token 是否匹配数据库中的
      if (user.refreshToken !== refreshToken) {
        logger.warn('Refresh Token 不匹配:', {
          userId: user.id,
          storedToken: user.refreshToken ? 'exists' : 'null',
          providedToken: refreshToken.substring(0, 20) + '...'
        });
        throw new AppError('REFRESH_TOKEN_INVALID', 401, 'Refresh Token 无效或已撤销');
      }

      // 检查 token version
      if (decoded.tokenVersion !== user.tokenVersion) {
        logger.warn('Token 版本不匹配:', {
          userId: user.id,
          tokenVersion: user.tokenVersion,
          decodedVersion: decoded.tokenVersion
        });
        throw new AppError('REFRESH_TOKEN_REVOKED', 401, 'Token 已被撤销，请重新登录');
      }

      // 生成新的 token 对
      const tokens = generateTokenPair(user);

      // 更新数据库中的 refresh token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: tokens.refreshToken,
          lastActiveAt: new Date()
        }
      });

      logger.info('Token 刷新成功:', {
        userId: user.id,
        email: user.email
      });

      res.json({
        success: true,
        message: 'Token 刷新成功',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            avatar: user.avatar,
            level: user.level,
            isCertified: user.isCertified,
            isVip: user.isVip
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 登出（撤销当前 Refresh Token）
   * POST /api/auth/logout
   */
  static async logout(req, res, next) {
    try {
      const userId = req.userId; // 从 auth middleware 获取

      if (!userId) {
        throw new AppError('AUTH_TOKEN_MISSING', 401, '未登录');
      }

      // 清除数据库中的 refresh token
      await prisma.user.update({
        where: { id: userId },
        data: {
          refreshToken: null
        }
      });

      logger.info('用户登出:', { userId });

      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 登出所有设备（撤销所有 Token）
   * POST /api/auth/logout-all
   */
  static async logoutAll(req, res, next) {
    try {
      const userId = req.userId; // 从 auth middleware 获取

      if (!userId) {
        throw new AppError('AUTH_TOKEN_MISSING', 401, '未登录');
      }

      // 增加 tokenVersion，使所有已签发的 token 失效
      await prisma.user.update({
        where: { id: userId },
        data: {
          tokenVersion: { increment: 1 },
          refreshToken: null
        }
      });

      logger.info('用户登出所有设备:', { userId });

      res.json({
        success: true,
        message: '已登出所有设备'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 验证 Token 有效性
   * GET /api/auth/verify-token
   */
  static async verifyToken(req, res, next) {
    try {
      const userId = req.userId; // 从 auth middleware 获取
      const user = req.user; // 从 auth middleware 获取

      if (!userId || !user) {
        throw new AppError('AUTH_TOKEN_INVALID', 401, 'Token 无效');
      }

      res.json({
        success: true,
        message: 'Token 有效',
        data: {
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            avatar: user.avatar,
            level: user.level,
            isCertified: user.isCertified,
            isVip: user.isVip
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TokenController;
