// ieclub-backend/src/middleware/permission.js
// 权限检查中间件

const rbacService = require('../services/rbacService');
const logger = require('../utils/logger');

/**
 * 检查用户是否有指定权限
 * @param {string|string[]} permissions - 权限名称或权限名称数组
 * @param {object} options - 选项
 * @param {boolean} options.requireAll - 是否需要所有权限（默认false，即有任一权限即可）
 */
function hasPermission(permissions, options = {}) {
  return async (req, res, next) => {
    try {
      // 确保用户已认证
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录'
          }
        });
      }

      const userId = req.user.id;

      // 转换为数组
      const permissionList = Array.isArray(permissions) ? permissions : [permissions];

      // 检查权限
      let hasAccess;
      if (options.requireAll) {
        // 需要所有权限
        hasAccess = await rbacService.userHasAllPermissions(userId, permissionList);
      } else {
        // 有任一权限即可
        hasAccess = await rbacService.userHasAnyPermission(userId, permissionList);
      }

      if (!hasAccess) {
        logger.warn(`用户权限不足`, {
          userId,
          requiredPermissions: permissionList,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '权限不足'
          }
        });
      }

      // 权限检查通过
      next();
    } catch (error) {
      logger.error('权限检查失败:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '权限验证失败'
        }
      });
    }
  };
}

/**
 * 检查用户是否有指定角色
 * @param {string|string[]} roles - 角色名称或角色名称数组
 */
function hasRole(roles) {
  return async (req, res, next) => {
    try {
      // 确保用户已认证
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录'
          }
        });
      }

      const userId = req.user.id;

      // 转换为数组
      const roleList = Array.isArray(roles) ? roles : [roles];

      // 检查是否有任一角色
      const userRoles = await rbacService.getUserRoles(userId);
      const userRoleNames = userRoles.map(r => r.name);

      const hasAccess = roleList.some(role => userRoleNames.includes(role));

      if (!hasAccess) {
        logger.warn(`用户角色不足`, {
          userId,
          requiredRoles: roleList,
          userRoles: userRoleNames,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '权限不足'
          }
        });
      }

      // 角色检查通过
      next();
    } catch (error) {
      logger.error('角色检查失败:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '角色验证失败'
        }
      });
    }
  };
}

/**
 * 检查用户是否是资源的所有者或有删除任何资源的权限
 * @param {Function} getResourceOwner - 获取资源所有者的函数
 * @param {string} deleteAnyPermission - 删除任何资源的权限名称
 */
function isOwnerOrHasPermission(getResourceOwner, deleteAnyPermission) {
  return async (req, res, next) => {
    try {
      // 确保用户已认证
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录'
          }
        });
      }

      const userId = req.user.id;

      // 获取资源所有者
      const ownerId = await getResourceOwner(req);

      // 检查是否是所有者
      if (ownerId === userId) {
        return next();
      }

      // 检查是否有删除任何资源的权限
      const hasPermission = await rbacService.userHasPermission(userId, deleteAnyPermission);

      if (!hasPermission) {
        logger.warn(`用户无权操作他人资源`, {
          userId,
          ownerId,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '无权操作该资源'
          }
        });
      }

      // 权限检查通过
      next();
    } catch (error) {
      logger.error('资源权限检查失败:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '权限验证失败'
        }
      });
    }
  };
}

/**
 * 检查用户是否是超级管理员
 */
const isSuperAdmin = hasRole('super_admin');

/**
 * 检查用户是否是管理员（超级管理员或管理员）
 */
const isAdmin = hasRole(['super_admin', 'admin']);

/**
 * 检查用户是否是版主或更高权限
 */
const isModerator = hasRole(['super_admin', 'admin', 'moderator']);

/**
 * 检查是否可以访问管理后台
 */
const canAccessAdmin = hasPermission('admin.access');

/**
 * 快捷权限检查函数
 */
const permissions = {
  // 用户管理
  canCreateUser: hasPermission('user.create'),
  canUpdateUser: hasPermission('user.update'),
  canDeleteUser: hasPermission('user.delete'),
  canBanUser: hasPermission('user.ban'),

  // 话题管理
  canDeleteAnyTopic: hasPermission('topic.delete.any'),
  canDeleteAnyComment: hasPermission('comment.delete.any'),

  // 内容审核
  canReviewContent: hasPermission('moderation.review'),
  canApproveContent: hasPermission('moderation.approve'),

  // 角色权限管理
  canManageRoles: hasPermission(['role.create', 'role.update', 'role.delete'], { requireAll: false }),
  canManagePermissions: hasPermission(['permission.create', 'permission.update', 'permission.delete'], { requireAll: false }),

  // 系统管理
  canBackupSystem: hasPermission('system.backup'),
  canViewLogs: hasPermission('system.logs'),
  canViewMonitoring: hasPermission('system.monitoring')
};

module.exports = {
  hasPermission,
  hasRole,
  isOwnerOrHasPermission,
  isSuperAdmin,
  isAdmin,
  isModerator,
  canAccessAdmin,
  permissions
};

