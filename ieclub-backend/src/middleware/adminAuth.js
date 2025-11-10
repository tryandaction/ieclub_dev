// 管理员认证中间件
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { hasPermission, hasAnyPermission, hasAllPermissions } = require('../utils/adminAuth');

const prisma = new PrismaClient();

/**
 * 管理员认证中间件
 * 验证JWT令牌并加载管理员信息
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌',
      });
    }

    const token = authHeader.substring(7);

    // 验证token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-admin-secret-key');
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
          code: 401,
          message: '令牌已过期',
        });
      }
      return res.status(401).json({
        code: 401,
        message: '无效的令牌',
      });
    }

    // 检查是否是管理员令牌
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权访问管理员功能',
      });
    }

    // 从数据库加载管理员信息
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        status: true,
        realName: true,
        avatar: true,
        tokenVersion: true,
      },
    });

    if (!admin) {
      return res.status(401).json({
        code: 401,
        message: '管理员不存在',
      });
    }

    // 检查管理员状态
    if (admin.status !== 'active') {
      return res.status(403).json({
        code: 403,
        message: '账号已被停用',
      });
    }

    // 检查token版本（用于强制登出）
    if (decoded.tokenVersion !== admin.tokenVersion) {
      return res.status(401).json({
        code: 401,
        message: '令牌已失效，请重新登录',
      });
    }

    // 解析权限
    admin.permissions = JSON.parse(admin.permissions);

    // 将管理员信息附加到请求对象
    req.admin = admin;

    next();
  } catch (error) {
    console.error('管理员认证错误:', error);
    return res.status(500).json({
      code: 500,
      message: '认证失败',
    });
  }
};

/**
 * 检查单个权限的中间件工厂函数
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        code: 401,
        message: '未认证',
      });
    }

    if (!hasPermission(req.admin, permission)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足',
        required: permission,
      });
    }

    next();
  };
};

/**
 * 检查任一权限的中间件工厂函数
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        code: 401,
        message: '未认证',
      });
    }

    if (!hasAnyPermission(req.admin, permissions)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足',
        required: `需要以下任一权限: ${permissions.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * 检查所有权限的中间件工厂函数
 */
const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        code: 401,
        message: '未认证',
      });
    }

    if (!hasAllPermissions(req.admin, permissions)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足',
        required: `需要以下所有权限: ${permissions.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * 检查角色的中间件工厂函数
 */
const requireRole = (roles) => {
  if (!Array.isArray(roles)) {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        code: 401,
        message: '未认证',
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        code: 403,
        message: '角色权限不足',
        required: `需要以下任一角色: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * 仅超级管理员可访问
 */
const requireSuperAdmin = requireRole('super_admin');

/**
 * 记录管理员操作的中间件
 */
const logAdminAction = (action, resourceType) => {
  return async (req, res, next) => {
    // 保存原始的res.json方法
    const originalJson = res.json.bind(res);

    // 重写res.json方法以捕获响应
    res.json = function(body) {
      // 异步记录日志，不阻塞响应
      setImmediate(async () => {
        try {
          const admin = req.admin;
          const resourceId = req.params.id || req.body?.id || null;

          await prisma.adminAuditLog.create({
        data: {
              adminId: admin.id,
              action: action,
              resourceType: resourceType,
              resourceId: resourceId,
              description: `${admin.username} ${action} ${resourceType} ${resourceId || ''}`,
          details: JSON.stringify({
                method: req.method,
                params: req.params,
                body: req.body,
            query: req.query,
              }),
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('user-agent'),
              method: req.method,
              path: req.path,
              status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failed',
              errorMessage: body?.message || null,
              level: res.statusCode >= 400 ? 'warning' : 'info',
            },
      });
    } catch (error) {
          console.error('记录审计日志失败:', error);
    }
      });

      // 调用原始的json方法
      return originalJson(body);
    };

    next();
  };
};

/**
 * 检查账户锁定状态
 */
const checkAccountLock = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next();
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        status: true,
        lockedUntil: true,
        loginAttempts: true,
      },
    });

    if (!admin) {
      return next();
    }

    // 检查是否被锁定
    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil(
        (new Date(admin.lockedUntil) - new Date()) / 1000 / 60
      );
      return res.status(423).json({
        code: 423,
        message: `账户已被锁定，请在${remainingMinutes}分钟后重试`,
      });
    }

    // 如果锁定已过期，重置登录尝试次数
    if (admin.lockedUntil && new Date(admin.lockedUntil) <= new Date()) {
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    next();
  } catch (error) {
    console.error('检查账户锁定状态失败:', error);
    next();
  }
};

/**
 * 速率限制中间件工厂
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15分钟
    max = 100, // 最多请求次数
    message = '请求过于频繁，请稍后再试',
  } = options;

  // 简单的内存存储（生产环境应使用Redis）
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // 获取该IP的请求记录
    let record = requests.get(key);

    if (!record) {
      record = { count: 0, resetTime: now + windowMs };
      requests.get(key, record);
    }

    // 检查是否需要重置
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    // 增加计数
    record.count++;

    // 检查是否超过限制
    if (record.count > max) {
      return res.status(429).json({
        code: 429,
        message: message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    requests.set(key, record);
    next();
  };
};

/**
 * 登录速率限制
 */
const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次登录尝试
  message: '登录尝试过于频繁，请15分钟后再试',
});

module.exports = {
  authenticateAdmin,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireSuperAdmin,
  logAdminAction,
  checkAccountLock,
  loginRateLimiter,
  createRateLimiter,
};
