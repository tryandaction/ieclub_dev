// 管理员认证和权限工具函数
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * 管理员权限定义
 */
const ADMIN_PERMISSIONS = {
  // 管理员管理
  ADMIN_CREATE: 'admin:create',
  ADMIN_READ: 'admin:read',
  ADMIN_UPDATE: 'admin:update',
  ADMIN_DELETE: 'admin:delete',
  
  // 用户管理
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_BAN: 'user:ban',
  USER_DELETE: 'user:delete',
  
  // 内容管理
  POST_READ: 'post:read',
  POST_UPDATE: 'post:update',
  POST_DELETE: 'post:delete',
  POST_FEATURE: 'post:feature',
  POST_PIN: 'post:pin',
  
  TOPIC_READ: 'topic:read',
  TOPIC_UPDATE: 'topic:update',
  TOPIC_DELETE: 'topic:delete',
  TOPIC_FEATURE: 'topic:feature',
  
  COMMENT_READ: 'comment:read',
  COMMENT_DELETE: 'comment:delete',
  
  // 公告管理
  ANNOUNCEMENT_CREATE: 'announcement:create',
  ANNOUNCEMENT_READ: 'announcement:read',
  ANNOUNCEMENT_UPDATE: 'announcement:update',
  ANNOUNCEMENT_DELETE: 'announcement:delete',
  
  // 举报管理
  REPORT_READ: 'report:read',
  REPORT_HANDLE: 'report:handle',
  
  // 数据访问
  STATS_VIEW: 'stats:view',
  STATS_EXPORT: 'stats:export',
  
  // 系统配置
  SYSTEM_CONFIG: 'system:config',
  AUDIT_LOG_VIEW: 'audit:view',
};

/**
 * 管理员角色定义
 */
const ADMIN_ROLES = {
  SUPER_ADMIN: {
    name: '超级管理员',
    code: 'super_admin',
    level: 10,
    permissions: Object.values(ADMIN_PERMISSIONS),
  },
  PLATFORM_ADMIN: {
    name: '平台管理员',
    code: 'platform_admin',
    level: 5,
    permissions: [
      ADMIN_PERMISSIONS.USER_READ,
      ADMIN_PERMISSIONS.USER_UPDATE,
      ADMIN_PERMISSIONS.USER_BAN,
      ADMIN_PERMISSIONS.POST_READ,
      ADMIN_PERMISSIONS.POST_UPDATE,
      ADMIN_PERMISSIONS.POST_DELETE,
      ADMIN_PERMISSIONS.POST_FEATURE,
      ADMIN_PERMISSIONS.POST_PIN,
      ADMIN_PERMISSIONS.TOPIC_READ,
      ADMIN_PERMISSIONS.TOPIC_UPDATE,
      ADMIN_PERMISSIONS.TOPIC_DELETE,
      ADMIN_PERMISSIONS.TOPIC_FEATURE,
      ADMIN_PERMISSIONS.COMMENT_READ,
      ADMIN_PERMISSIONS.COMMENT_DELETE,
      ADMIN_PERMISSIONS.ANNOUNCEMENT_CREATE,
      ADMIN_PERMISSIONS.ANNOUNCEMENT_READ,
      ADMIN_PERMISSIONS.ANNOUNCEMENT_UPDATE,
      ADMIN_PERMISSIONS.ANNOUNCEMENT_DELETE,
      ADMIN_PERMISSIONS.REPORT_READ,
      ADMIN_PERMISSIONS.REPORT_HANDLE,
      ADMIN_PERMISSIONS.STATS_VIEW,
      ADMIN_PERMISSIONS.AUDIT_LOG_VIEW,
    ],
  },
  CONTENT_MODERATOR: {
    name: '内容审核员',
    code: 'content_moderator',
    level: 3,
    permissions: [
      ADMIN_PERMISSIONS.USER_READ,
      ADMIN_PERMISSIONS.POST_READ,
      ADMIN_PERMISSIONS.POST_UPDATE,
      ADMIN_PERMISSIONS.POST_DELETE,
      ADMIN_PERMISSIONS.TOPIC_READ,
      ADMIN_PERMISSIONS.TOPIC_UPDATE,
      ADMIN_PERMISSIONS.TOPIC_DELETE,
      ADMIN_PERMISSIONS.COMMENT_READ,
      ADMIN_PERMISSIONS.COMMENT_DELETE,
      ADMIN_PERMISSIONS.REPORT_READ,
      ADMIN_PERMISSIONS.REPORT_HANDLE,
      ADMIN_PERMISSIONS.STATS_VIEW,
    ],
  },
  DATA_ANALYST: {
    name: '数据分析员',
    code: 'data_analyst',
    level: 2,
    permissions: [
      ADMIN_PERMISSIONS.STATS_VIEW,
      ADMIN_PERMISSIONS.STATS_EXPORT,
      ADMIN_PERMISSIONS.USER_READ,
      ADMIN_PERMISSIONS.POST_READ,
      ADMIN_PERMISSIONS.TOPIC_READ,
    ],
  },
};

/**
 * 获取角色配置
 */
function getRoleConfig(role) {
  const roleKey = Object.keys(ADMIN_ROLES).find(
    key => ADMIN_ROLES[key].code === role
  );
  return roleKey ? ADMIN_ROLES[roleKey] : null;
}

/**
 * 获取角色的权限列表
 */
function getRolePermissions(role) {
  const config = getRoleConfig(role);
  return config ? config.permissions : [];
}

/**
 * 检查管理员是否有指定权限
 */
function hasPermission(admin, permission) {
  if (!admin || !admin.permissions) {
    return false;
  }
  
  const permissions = typeof admin.permissions === 'string' 
    ? JSON.parse(admin.permissions) 
    : admin.permissions;
    
  return permissions.includes(permission);
}

/**
 * 检查管理员是否有任一权限
 */
function hasAnyPermission(admin, permissionList) {
  if (!Array.isArray(permissionList)) {
    permissionList = [permissionList];
  }
  return permissionList.some(permission => hasPermission(admin, permission));
}

/**
 * 检查管理员是否有所有权限
 */
function hasAllPermissions(admin, permissionList) {
  if (!Array.isArray(permissionList)) {
    permissionList = [permissionList];
  }
  return permissionList.every(permission => hasPermission(admin, permission));
}

/**
 * 哈希密码
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

/**
 * 验证密码
 */
async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * 生成2FA密钥
 */
function generate2FASecret(adminEmail) {
  const secret = speakeasy.generateSecret({
    name: `IEclub Admin (${adminEmail})`,
    length: 32,
  });
  
  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
}

/**
 * 生成2FA二维码
 */
async function generate2FAQRCode(otpauthUrl) {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch (error) {
    throw new Error('生成二维码失败');
  }
}

/**
 * 验证2FA令牌
 */
function verify2FAToken(token, secret) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // 允许前后2个时间窗口
  });
}

/**
 * 生成备用码
 */
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // 生成8位随机码
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * 哈希备用码
 */
async function hashBackupCodes(codes) {
  const hashedCodes = [];
  for (const code of codes) {
    const hashed = await hashPassword(code);
    hashedCodes.push(hashed);
  }
  return hashedCodes;
}

/**
 * 验证备用码
 */
async function verifyBackupCode(code, hashedCodes) {
  if (!Array.isArray(hashedCodes)) {
    try {
      hashedCodes = JSON.parse(hashedCodes);
    } catch {
      return { valid: false, remainingCodes: [] };
    }
  }
  
  for (let i = 0; i < hashedCodes.length; i++) {
    const isValid = await verifyPassword(code, hashedCodes[i]);
    if (isValid) {
      // 移除已使用的备用码
      const remainingCodes = hashedCodes.filter((_, index) => index !== i);
      return { valid: true, remainingCodes };
    }
  }
  
  return { valid: false, remainingCodes: hashedCodes };
}

/**
 * 密码强度验证
 */
function validatePasswordStrength(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('密码长度至少8位');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含数字');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 检查密码是否在历史记录中
 */
async function isPasswordInHistory(password, passwordHistory) {
  if (!passwordHistory) {
    return false;
  }
  
  let history = [];
  try {
    history = typeof passwordHistory === 'string' 
      ? JSON.parse(passwordHistory) 
      : passwordHistory;
  } catch {
    return false;
  }
  
  for (const oldHash of history) {
    const matches = await verifyPassword(password, oldHash);
    if (matches) {
      return true;
    }
  }
  
  return false;
}

/**
 * 更新密码历史
 */
function updatePasswordHistory(currentHash, passwordHistory, maxHistory = 5) {
  let history = [];
  try {
    history = typeof passwordHistory === 'string' 
      ? JSON.parse(passwordHistory) 
      : (Array.isArray(passwordHistory) ? passwordHistory : []);
  } catch {
    history = [];
  }
  
  // 添加当前密码到历史
  history.unshift(currentHash);
  
  // 只保留最近N个密码
  return history.slice(0, maxHistory);
}

/**
 * 获取角色等级
 */
function getRoleLevel(role) {
  const config = getRoleConfig(role);
  return config ? config.level : 0;
}

/**
 * 比较角色等级
 */
function canManageRole(managerRole, targetRole) {
  const managerLevel = getRoleLevel(managerRole);
  const targetLevel = getRoleLevel(targetRole);
  return managerLevel > targetLevel;
}

/**
 * 生成安全的令牌
 */
function generateSecureToken(length = 32) {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  ADMIN_PERMISSIONS,
  ADMIN_ROLES,
  getRoleConfig,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hashPassword,
  verifyPassword,
  generate2FASecret,
  generate2FAQRCode,
  verify2FAToken,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  validatePasswordStrength,
  isPasswordInHistory,
  updatePasswordHistory,
  getRoleLevel,
  canManageRole,
  generateSecureToken,
};

