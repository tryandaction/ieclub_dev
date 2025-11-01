// ieclub-backend/src/routes/rbac.js
// RBAC 权限管理路由

const express = require('express');
const router = express.Router();
const rbacController = require('../controllers/rbacController');
const { authenticate } = require('../middleware/auth');
const { isSuperAdmin, hasPermission } = require('../middleware/permission');

// ==================== 公开接口（需要认证） ====================

/**
 * 获取当前用户的权限
 * GET /api/rbac/my-permissions
 */
router.get('/my-permissions', authenticate, rbacController.getMyPermissions);

// ==================== 管理员接口 ====================

// 角色管理（需要超级管理员或有角色管理权限）
router.post(
  '/roles',
  authenticate,
  hasPermission(['role.create', 'admin.access']),
  rbacController.createRole
);

router.get(
  '/roles',
  authenticate,
  hasPermission(['role.read', 'admin.access']),
  rbacController.getRoles
);

router.get(
  '/roles/:id',
  authenticate,
  hasPermission(['role.read', 'admin.access']),
  rbacController.getRoleById
);

router.put(
  '/roles/:id',
  authenticate,
  hasPermission(['role.update', 'admin.access']),
  rbacController.updateRole
);

router.delete(
  '/roles/:id',
  authenticate,
  hasPermission(['role.delete', 'admin.access']),
  rbacController.deleteRole
);

// 权限管理（需要超级管理员或有权限管理权限）
router.post(
  '/permissions',
  authenticate,
  hasPermission(['permission.create', 'admin.access']),
  rbacController.createPermission
);

router.get(
  '/permissions',
  authenticate,
  hasPermission(['permission.read', 'admin.access']),
  rbacController.getPermissions
);

// 用户角色分配（需要管理员权限）
router.post(
  '/users/:userId/roles',
  authenticate,
  hasPermission(['role.assign', 'admin.access']),
  rbacController.assignRoleToUser
);

router.delete(
  '/users/:userId/roles/:roleId',
  authenticate,
  hasPermission(['role.assign', 'admin.access']),
  rbacController.removeRoleFromUser
);

router.get(
  '/users/:userId/roles',
  authenticate,
  hasPermission(['role.read', 'admin.access']),
  rbacController.getUserRoles
);

router.get(
  '/users/:userId/permissions',
  authenticate,
  hasPermission(['permission.read', 'admin.access']),
  rbacController.getUserPermissions
);

// 系统初始化（仅超级管理员）
router.post(
  '/initialize',
  authenticate,
  isSuperAdmin,
  rbacController.initializeSystem
);

module.exports = router;

