// ieclub-backend/src/controllers/rbacController.js
// RBAC 权限管理控制器

const rbacService = require('../services/rbacService');
const logger = require('../utils/logger');

class RBACController {
  // ==================== 角色管理 ====================

  /**
   * 创建角色
   * POST /api/admin/rbac/roles
   */
  static async createRole(req, res) {
    try {
      const { name, displayName, description, level, permissions } = req.body;

      // 验证必填字段
      if (!name || !displayName) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '角色名称和显示名称为必填项' }
        });
      }

      const role = await rbacService.createRole({
        name,
        displayName,
        description,
        level,
        permissions
      });

      // 记录操作日志
      logger.info(`创建角色: ${name}`, { userId: req.user.id, roleId: role.id });

      return res.status(201).json({
        success: true,
        data: role,
        message: '角色创建成功'
      });
    } catch (error) {
      logger.error('创建角色失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * 获取角色列表
   * GET /api/admin/rbac/roles
   */
  static async getRoles(req, res) {
    try {
      const { type, isActive, search } = req.query;

      const roles = await rbacService.getAllRoles({
        type,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search
      });

      return res.json({
        success: true,
        data: {
          roles,
          total: roles.length
        }
      });
    } catch (error) {
      logger.error('获取角色列表失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * 获取角色详情
   * GET /api/admin/rbac/roles/:id
   */
  static async getRoleById(req, res) {
    try {
      const { id } = req.params;

      const role = await rbacService.getRoleById(id);

      return res.json({
        success: true,
        data: role
      });
    } catch (error) {
      logger.error('获取角色详情失败:', error);
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message }
      });
    }
  }

  /**
   * 更新角色
   * PUT /api/admin/rbac/roles/:id
   */
  static async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { displayName, description, level, isActive, permissions } = req.body;

      const role = await rbacService.updateRole(id, {
        displayName,
        description,
        level,
        isActive,
        permissions
      });

      logger.info(`更新角色: ${id}`, { userId: req.user.id });

      return res.json({
        success: true,
        data: role,
        message: '角色更新成功'
      });
    } catch (error) {
      logger.error('更新角色失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * 删除角色
   * DELETE /api/admin/rbac/roles/:id
   */
  static async deleteRole(req, res) {
    try {
      const { id } = req.params;

      await rbacService.deleteRole(id);

      logger.info(`删除角色: ${id}`, { userId: req.user.id });

      return res.json({
        success: true,
        message: '角色删除成功'
      });
    } catch (error) {
      logger.error('删除角色失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  // ==================== 权限管理 ====================

  /**
   * 创建权限
   * POST /api/admin/rbac/permissions
   */
  static async createPermission(req, res) {
    try {
      const { name, displayName, description, module, action, resource } = req.body;

      // 验证必填字段
      if (!name || !displayName || !module || !action) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '权限名称、显示名称、模块和操作为必填项' }
        });
      }

      const permission = await rbacService.createPermission({
        name,
        displayName,
        description,
        module,
        action,
        resource
      });

      logger.info(`创建权限: ${name}`, { userId: req.user.id });

      return res.status(201).json({
        success: true,
        data: permission,
        message: '权限创建成功'
      });
    } catch (error) {
      logger.error('创建权限失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * 获取权限列表
   * GET /api/admin/rbac/permissions
   */
  static async getPermissions(req, res) {
    try {
      const { module, action, isActive, search } = req.query;

      const permissions = await rbacService.getAllPermissions({
        module,
        action,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search
      });

      // 按模块分组
      const groupedByModule = permissions.reduce((acc, perm) => {
        if (!acc[perm.module]) {
          acc[perm.module] = [];
        }
        acc[perm.module].push(perm);
        return acc;
      }, {});

      return res.json({
        success: true,
        data: {
          permissions,
          groupedByModule,
          total: permissions.length
        }
      });
    } catch (error) {
      logger.error('获取权限列表失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  // ==================== 用户角色分配 ====================

  /**
   * 为用户分配角色
   * POST /api/admin/rbac/users/:userId/roles
   */
  static async assignRoleToUser(req, res) {
    try {
      const { userId } = req.params;
      const { roleId, expiresAt } = req.body;

      if (!roleId) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '角色ID为必填项' }
        });
      }

      const userRole = await rbacService.assignRoleToUser(
        userId,
        roleId,
        req.user.id,
        expiresAt ? new Date(expiresAt) : null
      );

      logger.info(`为用户分配角色`, { userId, roleId, operator: req.user.id });

      return res.status(201).json({
        success: true,
        data: userRole,
        message: '角色分配成功'
      });
    } catch (error) {
      logger.error('分配角色失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * 移除用户的角色
   * DELETE /api/admin/rbac/users/:userId/roles/:roleId
   */
  static async removeRoleFromUser(req, res) {
    try {
      const { userId, roleId } = req.params;

      await rbacService.removeRoleFromUser(userId, roleId);

      logger.info(`移除用户角色`, { userId, roleId, operator: req.user.id });

      return res.json({
        success: true,
        message: '角色移除成功'
      });
    } catch (error) {
      logger.error('移除角色失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * 获取用户的角色列表
   * GET /api/admin/rbac/users/:userId/roles
   */
  static async getUserRoles(req, res) {
    try {
      const { userId } = req.params;

      const roles = await rbacService.getUserRoles(userId);

      return res.json({
        success: true,
        data: {
          roles,
          total: roles.length
        }
      });
    } catch (error) {
      logger.error('获取用户角色失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * 获取用户的权限列表
   * GET /api/admin/rbac/users/:userId/permissions
   */
  static async getUserPermissions(req, res) {
    try {
      const { userId } = req.params;

      const permissions = await rbacService.getUserPermissions(userId);

      return res.json({
        success: true,
        data: {
          permissions,
          total: permissions.length
        }
      });
    } catch (error) {
      logger.error('获取用户权限失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * 获取当前用户的权限
   * GET /api/rbac/my-permissions
   */
  static async getMyPermissions(req, res) {
    try {
      const userId = req.user.id;

      const roles = await rbacService.getUserRoles(userId);
      const permissions = await rbacService.getUserPermissions(userId);

      return res.json({
        success: true,
        data: {
          roles,
          permissions,
          permissionNames: permissions.map(p => p.name)
        }
      });
    } catch (error) {
      logger.error('获取当前用户权限失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  // ==================== 系统初始化 ====================

  /**
   * 初始化默认角色和权限
   * POST /api/admin/rbac/initialize
   */
  static async initializeSystem(req, res) {
    try {
      await rbacService.initializeDefaultRolesAndPermissions();

      logger.info(`初始化RBAC系统`, { userId: req.user.id });

      return res.json({
        success: true,
        message: '系统初始化成功'
      });
    } catch (error) {
      logger.error('初始化系统失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }
}

module.exports = RBACController;

