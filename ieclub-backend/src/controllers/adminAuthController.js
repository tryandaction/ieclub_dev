// 管理员认证Controller
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const {
  hashPassword,
  verifyPassword,
  generate2FASecret,
  generate2FAQRCode,
  verify2FAToken,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  validatePasswordStrength,
  getRolePermissions,
} = require('../utils/adminAuth');

const prisma = new PrismaClient();

/**
 * 生成JWT令牌
 */
function generateAdminToken(admin) {
  const payload = {
    adminId: admin.id,
    type: 'admin',
    tokenVersion: admin.tokenVersion || 0,
  };

  // Access Token - 2小时
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-admin-secret-key',
    { expiresIn: '2h' }
  );

  // Refresh Token - 7天
  const refreshToken = jwt.sign(
    { ...payload, isRefresh: true },
    process.env.JWT_REFRESH_SECRET || 'your-admin-refresh-secret-key',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

/**
 * 管理员登录
 * POST /api/admin/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password, twoFactorCode, backupCode } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        code: 400,
        message: '邮箱和密码不能为空',
      });
    }

    // 查找管理员
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({
        code: 401,
        message: '邮箱或密码错误',
      });
    }

    // 检查账户状态
    if (admin.status !== 'active') {
      return res.status(403).json({
        code: 403,
        message: '账户已被停用',
      });
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      // 增加登录尝试次数
      const loginAttempts = admin.loginAttempts + 1;
      const updateData = { loginAttempts };

      // 如果尝试次数超过5次，锁定账户30分钟
      if (loginAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await prisma.admin.update({
        where: { id: admin.id },
        data: updateData,
      });

      return res.status(401).json({
        code: 401,
        message: '邮箱或密码错误',
        remainingAttempts: Math.max(0, 5 - loginAttempts),
      });
    }

    // 如果启用了2FA
    if (admin.twoFactorEnabled) {
      // 检查是否提供了验证码
      if (!twoFactorCode && !backupCode) {
        return res.status(200).json({
          code: 200,
          message: '需要双因素认证',
          requiresTwoFactor: true,
        });
      }

      // 验证2FA令牌或备用码
      let twoFactorValid = false;

      if (twoFactorCode) {
        twoFactorValid = verify2FAToken(twoFactorCode, admin.twoFactorSecret);
      } else if (backupCode) {
        const result = await verifyBackupCode(backupCode, admin.backupCodes);
        twoFactorValid = result.valid;

        // 如果备用码有效，更新剩余备用码
        if (result.valid) {
          await prisma.admin.update({
            where: { id: admin.id },
            data: {
              backupCodes: JSON.stringify(result.remainingCodes),
            },
          });
        }
      }

      if (!twoFactorValid) {
        return res.status(401).json({
          code: 401,
          message: '验证码错误',
        });
      }
    }

    // 登录成功，重置登录尝试次数
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: req.ip || req.connection.remoteAddress,
      },
    });

    // 生成令牌
    const tokens = generateAdminToken(admin);

    // 更新refresh token
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        refreshToken: tokens.refreshToken,
      },
    });

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'login',
        resourceType: 'admin',
        resourceId: admin.id,
        description: `管理员 ${admin.username} 登录系统`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: 'POST',
        path: req.path,
        status: 'success',
        level: 'info',
      },
    });

    // 返回结果
    return res.json({
      code: 200,
      message: '登录成功',
      data: {
        ...tokens,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          permissions: JSON.parse(admin.permissions),
          realName: admin.realName,
          avatar: admin.avatar,
        },
      },
    });
  } catch (error) {
    console.error('管理员登录失败:', error);
    return res.status(500).json({
      code: 500,
      message: '登录失败',
    });
  }
};

/**
 * 管理员登出
 * POST /api/admin/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    const adminId = req.admin.id;

    // 清除refresh token并增加token版本（使所有现有token失效）
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        refreshToken: null,
        tokenVersion: { increment: 1 },
      },
    });

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: adminId,
        action: 'logout',
        resourceType: 'admin',
        resourceId: adminId,
        description: `管理员 ${req.admin.username} 登出系统`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: 'POST',
        path: req.path,
        status: 'success',
        level: 'info',
      },
    });

    return res.json({
      code: 200,
      message: '登出成功',
    });
  } catch (error) {
    console.error('管理员登出失败:', error);
    return res.status(500).json({
      code: 500,
      message: '登出失败',
    });
  }
};

/**
 * 刷新令牌
 * POST /api/admin/auth/refresh
 */
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        code: 400,
        message: '缺少刷新令牌',
      });
    }

    // 验证refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'your-admin-refresh-secret-key'
      );
    } catch (error) {
      return res.status(401).json({
        code: 401,
        message: '刷新令牌无效或已过期',
      });
    }

    // 从数据库验证
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
    });

    if (!admin || admin.refreshToken !== refreshToken) {
      return res.status(401).json({
        code: 401,
        message: '刷新令牌无效',
      });
    }

    if (admin.status !== 'active') {
      return res.status(403).json({
        code: 403,
        message: '账户已被停用',
      });
    }

    // 生成新令牌
    const tokens = generateAdminToken(admin);

    // 更新refresh token
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        refreshToken: tokens.refreshToken,
      },
    });

    return res.json({
      code: 200,
      message: '令牌刷新成功',
      data: tokens,
    });
  } catch (error) {
    console.error('刷新令牌失败:', error);
    return res.status(500).json({
      code: 500,
      message: '刷新令牌失败',
    });
  }
};

/**
 * 获取当前管理员信息
 * GET /api/admin/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        status: true,
        realName: true,
        phone: true,
        avatar: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return res.status(404).json({
        code: 404,
        message: '管理员不存在',
      });
    }

    admin.permissions = JSON.parse(admin.permissions);

    return res.json({
      code: 200,
      data: admin,
    });
  } catch (error) {
    console.error('获取管理员信息失败:', error);
    return res.status(500).json({
      code: 500,
      message: '获取管理员信息失败',
    });
  }
};

/**
 * 修改密码
 * POST /api/admin/auth/change-password
 */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '旧密码和新密码不能为空',
      });
    }

    // 验证新密码强度
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      return res.status(400).json({
        code: 400,
        message: '密码强度不足',
        errors: validation.errors,
      });
    }

    // 获取当前管理员
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
    });

    // 验证旧密码
    const isOldPasswordValid = await verifyPassword(oldPassword, admin.password);
    if (!isOldPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '旧密码错误',
      });
    }

    // 检查新密码是否与旧密码相同
    if (oldPassword === newPassword) {
      return res.status(400).json({
        code: 400,
        message: '新密码不能与旧密码相同',
      });
    }

    // 哈希新密码
    const hashedPassword = await hashPassword(newPassword);

    // 更新密码和历史
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        // 增加token版本，使所有现有token失效
        tokenVersion: { increment: 1 },
      },
    });

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'change_password',
        resourceType: 'admin',
        resourceId: admin.id,
        description: `管理员 ${admin.username} 修改了密码`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: 'POST',
        path: req.path,
        status: 'success',
        level: 'warning',
      },
    });

    return res.json({
      code: 200,
      message: '密码修改成功，请重新登录',
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    return res.status(500).json({
      code: 500,
      message: '修改密码失败',
    });
  }
};

/**
 * 启用2FA
 * POST /api/admin/auth/enable-2fa
 */
exports.enable2FA = async (req, res) => {
  try {
    const adminId = req.admin.id;

    // 检查是否已启用
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { twoFactorEnabled: true, email: true },
    });

    if (admin.twoFactorEnabled) {
      return res.status(400).json({
        code: 400,
        message: '已启用双因素认证',
      });
    }

    // 生成2FA密钥
    const { secret, otpauthUrl } = generate2FASecret(admin.email);

    // 生成二维码
    const qrCode = await generate2FAQRCode(otpauthUrl);

    // 生成备用码
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // 保存密钥（但先不启用）
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        twoFactorSecret: secret,
        backupCodes: JSON.stringify(hashedBackupCodes),
      },
    });

    return res.json({
      code: 200,
      message: '请扫描二维码并输入验证码完成设置',
      data: {
        secret,
        qrCode,
        backupCodes, // 只在设置时返回明文备用码
      },
    });
  } catch (error) {
    console.error('启用2FA失败:', error);
    return res.status(500).json({
      code: 500,
      message: '启用2FA失败',
    });
  }
};

/**
 * 验证并完成2FA启用
 * POST /api/admin/auth/verify-2fa
 */
exports.verify2FA = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        code: 400,
        message: '验证码不能为空',
      });
    }

    const adminId = req.admin.id;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (admin.twoFactorEnabled) {
      return res.status(400).json({
        code: 400,
        message: '已启用双因素认证',
      });
    }

    // 验证令牌
    const isValid = verify2FAToken(token, admin.twoFactorSecret);

    if (!isValid) {
      return res.status(401).json({
        code: 401,
        message: '验证码错误',
      });
    }

    // 启用2FA
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        twoFactorEnabled: true,
      },
    });

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: adminId,
        action: 'enable_2fa',
        resourceType: 'admin',
        resourceId: adminId,
        description: `管理员 ${req.admin.username} 启用了双因素认证`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: 'POST',
        path: req.path,
        status: 'success',
        level: 'warning',
      },
    });

    return res.json({
      code: 200,
      message: '双因素认证已启用',
    });
  } catch (error) {
    console.error('验证2FA失败:', error);
    return res.status(500).json({
      code: 500,
      message: '验证2FA失败',
    });
  }
};

/**
 * 禁用2FA
 * POST /api/admin/auth/disable-2fa
 */
exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        code: 400,
        message: '请输入密码以确认身份',
      });
    }

    const adminId = req.admin.id;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    // 验证密码
    const isPasswordValid = await verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '密码错误',
      });
    }

    // 禁用2FA
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
      },
    });

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: adminId,
        action: 'disable_2fa',
        resourceType: 'admin',
        resourceId: adminId,
        description: `管理员 ${req.admin.username} 禁用了双因素认证`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: 'POST',
        path: req.path,
        status: 'success',
        level: 'warning',
      },
    });

    return res.json({
      code: 200,
      message: '双因素认证已禁用',
    });
  } catch (error) {
    console.error('禁用2FA失败:', error);
    return res.status(500).json({
      code: 500,
      message: '禁用2FA失败',
    });
  }
};

module.exports = exports;

