// ieclub-backend/src/middleware/adminAuth.js
// 管理员权限验证中间件

const logger = require('../utils/logger');

// 使用共享的 Prisma 实例
let prisma;
try {
  prisma = require('../config/database');
} catch {
  // Fallback for tests
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
}

// 管理员邮箱白名单（可以从环境变量或数据库读取）
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

/**
 * 验证管理员权限
 */
exports.requireAdmin = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '请先登录'
        }
      });
    }

    // 检查用户是否是管理员
    // 方法1: 从白名单检查
    if (ADMIN_EMAILS.includes(user.email)) {
      logger.info(`管理员访问: ${user.email}`, {
        userId: user.id,
        action: req.method,
        path: req.path
      });
      return next();
    }

    // 方法2: 从数据库检查（如果有管理员字段）
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { isAdmin: true, status: true }
    });

    if (dbUser && dbUser.isAdmin && dbUser.status === 'active') {
      logger.info(`管理员访问: ${user.email}`, {
        userId: user.id,
        action: req.method,
        path: req.path
      });
      return next();
    }

    // 非管理员
    logger.warn(`非管理员尝试访问管理后台: ${user.email}`, {
      userId: user.id,
      path: req.path
    });

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '无权访问此资源'
      }
    });
  } catch (error) {
    logger.error('管理员权限验证失败:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '权限验证失败'
      }
    });
  }
};

/**
 * 验证超级管理员权限（用于敏感操作）
 */
exports.requireSuperAdmin = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '请先登录'
        }
      });
    }

    // 超级管理员邮箱列表
    const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || '').split(',').filter(Boolean);

    if (SUPER_ADMIN_EMAILS.includes(user.email)) {
      logger.info(`超级管理员访问: ${user.email}`, {
        userId: user.id,
        action: req.method,
        path: req.path
      });
      return next();
    }

    logger.warn(`非超级管理员尝试访问敏感操作: ${user.email}`, {
      userId: user.id,
      path: req.path
    });

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '需要超级管理员权限'
      }
    });
  } catch (error) {
    logger.error('超级管理员权限验证失败:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '权限验证失败'
      }
    });
  }
};

/**
 * 记录管理员操作日志
 */
exports.logAdminAction = (action) => {
  return async (req, res, next) => {
    const user = req.user;
    
    // 记录操作
    logger.info(`管理员操作: ${action}`, {
      adminId: user.id,
      adminEmail: user.email,
      action,
      params: req.params,
      query: req.query,
      body: req.body,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date()
    });

    // 保存到数据库（可选）
    try {
      await prisma.admin_logs.create({
        data: {
          adminId: user.id,
          action,
          target: JSON.stringify(req.params),
          details: JSON.stringify({
            query: req.query,
            body: req.body
          }),
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      }).catch(() => {
        // 如果表不存在，静默失败
      });
    } catch (error) {
      // 忽略数据库错误
    }

    next();
  };
};

