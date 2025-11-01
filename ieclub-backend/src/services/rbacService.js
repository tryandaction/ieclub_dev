// ieclub-backend/src/services/rbacService.js
// 基于角色的访问控制(RBAC)服务

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const { getRedis } = require('../utils/redis');

const prisma = require('../config/database');
const redis = getRedis();

class RBACService {
  /**
   * 创建角色
   */
  async createRole(data) {
    try {
      const { name, displayName, description, level, type = 'custom', permissions = [] } = data;

      // 检查角色名是否已存在
      const existing = await prisma.role.findUnique({
        where: { name }
      });

      if (existing) {
        throw new Error('角色名称已存在');
      }

      // 创建角色
      const role = await prisma.role.create({
        data: {
          name,
          displayName,
          description,
          level: level || 0,
          type
        }
      });

      // 分配权限
      if (permissions.length > 0) {
        await this.assignPermissionsToRole(role.id, permissions);
      }

      logger.info(`创建角色: ${role.name}`, { roleId: role.id });

      return this.getRoleById(role.id);
    } catch (error) {
      logger.error('创建角色失败:', error);
      throw error;
    }
  }

  /**
   * 更新角色
   */
  async updateRole(roleId, data) {
    try {
      const { displayName, description, level, isActive, permissions } = data;

      // 检查角色是否存在
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        throw new Error('角色不存在');
      }

      // 系统内置角色不允许修改名称和类型
      if (role.type === 'system' && data.name) {
        throw new Error('系统内置角色不允许修改名称');
      }

      // 更新角色
      const updated = await prisma.role.update({
        where: { id: roleId },
        data: {
          displayName,
          description,
          level,
          isActive
        }
      });

      // 更新权限
      if (permissions !== undefined) {
        // 删除现有权限
        await prisma.rolePermission.deleteMany({
          where: { roleId }
        });

        // 分配新权限
        if (permissions.length > 0) {
          await this.assignPermissionsToRole(roleId, permissions);
        }
      }

      // 清除相关缓存
      await this.clearRoleCache(roleId);

      logger.info(`更新角色: ${updated.name}`, { roleId });

      return this.getRoleById(roleId);
    } catch (error) {
      logger.error('更新角色失败:', error);
      throw error;
    }
  }

  /**
   * 删除角色
   */
  async deleteRole(roleId) {
    try {
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        throw new Error('角色不存在');
      }

      // 系统内置角色不允许删除
      if (role.type === 'system') {
        throw new Error('系统内置角色不允许删除');
      }

      // 检查是否有用户使用该角色
      const userCount = await prisma.userRole.count({
        where: { roleId }
      });

      if (userCount > 0) {
        throw new Error(`该角色正在被 ${userCount} 个用户使用，无法删除`);
      }

      // 删除角色
      await prisma.role.delete({
        where: { id: roleId }
      });

      // 清除缓存
      await this.clearRoleCache(roleId);

      logger.info(`删除角色: ${role.name}`, { roleId });

      return { success: true };
    } catch (error) {
      logger.error('删除角色失败:', error);
      throw error;
    }
  }

  /**
   * 获取角色详情
   */
  async getRoleById(roleId) {
    try {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true
            }
          },
          userRoles: {
            select: {
              userId: true
            }
          }
        }
      });

      if (!role) {
        throw new Error('角色不存在');
      }

      return {
        ...role,
        permissions: role.permissions.map(rp => rp.permission),
        userCount: role.userRoles.length
      };
    } catch (error) {
      logger.error('获取角色失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有角色列表
   */
  async getAllRoles(filters = {}) {
    try {
      const { type, isActive, search } = filters;

      const where = {};

      if (type) {
        where.type = type;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { displayName: { contains: search } },
          { description: { contains: search } }
        ];
      }

      const roles = await prisma.role.findMany({
        where,
        include: {
          permissions: {
            include: {
              permission: true
            }
          },
          _count: {
            select: {
              userRoles: true
            }
          }
        },
        orderBy: [
          { level: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return roles.map(role => ({
        ...role,
        permissions: role.permissions.map(rp => rp.permission),
        userCount: role._count.userRoles
      }));
    } catch (error) {
      logger.error('获取角色列表失败:', error);
      throw error;
    }
  }

  /**
   * 创建权限
   */
  async createPermission(data) {
    try {
      const { name, displayName, description, module, action, resource } = data;

      // 检查权限名是否已存在
      const existing = await prisma.permission.findUnique({
        where: { name }
      });

      if (existing) {
        throw new Error('权限名称已存在');
      }

      const permission = await prisma.permission.create({
        data: {
          name,
          displayName,
          description,
          module,
          action,
          resource
        }
      });

      logger.info(`创建权限: ${permission.name}`, { permissionId: permission.id });

      return permission;
    } catch (error) {
      logger.error('创建权限失败:', error);
      throw error;
    }
  }

  /**
   * 批量创建权限
   */
  async createPermissionsBatch(permissions) {
    try {
      const created = [];

      for (const perm of permissions) {
        try {
          const existing = await prisma.permission.findUnique({
            where: { name: perm.name }
          });

          if (!existing) {
            const permission = await prisma.permission.create({
              data: perm
            });
            created.push(permission);
          }
        } catch (error) {
          logger.warn(`创建权限 ${perm.name} 失败:`, error.message);
        }
      }

      logger.info(`批量创建权限完成，成功: ${created.length}`);

      return created;
    } catch (error) {
      logger.error('批量创建权限失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有权限列表
   */
  async getAllPermissions(filters = {}) {
    try {
      const { module, action, isActive, search } = filters;

      const where = {};

      if (module) {
        where.module = module;
      }

      if (action) {
        where.action = action;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { displayName: { contains: search } },
          { description: { contains: search } }
        ];
      }

      const permissions = await prisma.permission.findMany({
        where,
        orderBy: [
          { module: 'asc' },
          { action: 'asc' },
          { name: 'asc' }
        ]
      });

      return permissions;
    } catch (error) {
      logger.error('获取权限列表失败:', error);
      throw error;
    }
  }

  /**
   * 为角色分配权限
   */
  async assignPermissionsToRole(roleId, permissionIds) {
    try {
      // 检查角色是否存在
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        throw new Error('角色不存在');
      }

      // 批量创建角色-权限关联
      const rolePermissions = permissionIds.map(permissionId => ({
        roleId,
        permissionId
      }));

      await prisma.rolePermission.createMany({
        data: rolePermissions,
        skipDuplicates: true
      });

      // 清除缓存
      await this.clearRoleCache(roleId);

      logger.info(`为角色 ${role.name} 分配 ${permissionIds.length} 个权限`);

      return { success: true };
    } catch (error) {
      logger.error('分配权限失败:', error);
      throw error;
    }
  }

  /**
   * 移除角色的权限
   */
  async removePermissionsFromRole(roleId, permissionIds) {
    try {
      await prisma.rolePermission.deleteMany({
        where: {
          roleId,
          permissionId: { in: permissionIds }
        }
      });

      // 清除缓存
      await this.clearRoleCache(roleId);

      logger.info(`从角色移除 ${permissionIds.length} 个权限`, { roleId });

      return { success: true };
    } catch (error) {
      logger.error('移除权限失败:', error);
      throw error;
    }
  }

  /**
   * 为用户分配角色
   */
  async assignRoleToUser(userId, roleId, assignedBy = null, expiresAt = null) {
    try {
      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查角色是否存在
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        throw new Error('角色不存在');
      }

      // 创建用户-角色关联
      const userRole = await prisma.userRole.create({
        data: {
          userId,
          roleId,
          assignedBy,
          expiresAt
        }
      });

      // 清除用户权限缓存
      await this.clearUserPermissionsCache(userId);

      logger.info(`为用户分配角色: ${role.name}`, { userId, roleId });

      return userRole;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('用户已拥有该角色');
      }
      logger.error('分配角色失败:', error);
      throw error;
    }
  }

  /**
   * 移除用户的角色
   */
  async removeRoleFromUser(userId, roleId) {
    try {
      const result = await prisma.userRole.deleteMany({
        where: {
          userId,
          roleId
        }
      });

      if (result.count === 0) {
        throw new Error('用户没有该角色');
      }

      // 清除用户权限缓存
      await this.clearUserPermissionsCache(userId);

      logger.info(`移除用户角色`, { userId, roleId });

      return { success: true };
    } catch (error) {
      logger.error('移除角色失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有角色
   */
  async getUserRoles(userId) {
    try {
      const now = new Date();

      const userRoles = await prisma.userRole.findMany({
        where: {
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } }
          ]
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });

      return userRoles.map(ur => ({
        ...ur.role,
        permissions: ur.role.permissions.map(rp => rp.permission),
        expiresAt: ur.expiresAt
      }));
    } catch (error) {
      logger.error('获取用户角色失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有权限
   */
  async getUserPermissions(userId) {
    try {
      // 尝试从缓存获取
      const cacheKey = `user:${userId}:permissions`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // 从数据库获取
      const roles = await this.getUserRoles(userId);

      // 合并所有角色的权限（去重）
      const permissionsMap = new Map();

      for (const role of roles) {
        if (role.isActive && role.permissions) {
          for (const permission of role.permissions) {
            if (permission.isActive) {
              permissionsMap.set(permission.id, permission);
            }
          }
        }
      }

      const permissions = Array.from(permissionsMap.values());

      // 缓存 5 分钟
      await redis.setex(cacheKey, 300, JSON.stringify(permissions));

      return permissions;
    } catch (error) {
      logger.error('获取用户权限失败:', error);
      throw error;
    }
  }

  /**
   * 检查用户是否有特定权限
   */
  async userHasPermission(userId, permissionName) {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.some(p => p.name === permissionName);
    } catch (error) {
      logger.error('检查用户权限失败:', error);
      return false;
    }
  }

  /**
   * 检查用户是否有特定角色
   */
  async userHasRole(userId, roleName) {
    try {
      const roles = await this.getUserRoles(userId);
      return roles.some(r => r.name === roleName);
    } catch (error) {
      logger.error('检查用户角色失败:', error);
      return false;
    }
  }

  /**
   * 检查用户是否有任一权限
   */
  async userHasAnyPermission(userId, permissionNames) {
    try {
      const permissions = await this.getUserPermissions(userId);
      const userPermissionNames = permissions.map(p => p.name);
      return permissionNames.some(name => userPermissionNames.includes(name));
    } catch (error) {
      logger.error('检查用户权限失败:', error);
      return false;
    }
  }

  /**
   * 检查用户是否有所有权限
   */
  async userHasAllPermissions(userId, permissionNames) {
    try {
      const permissions = await this.getUserPermissions(userId);
      const userPermissionNames = permissions.map(p => p.name);
      return permissionNames.every(name => userPermissionNames.includes(name));
    } catch (error) {
      logger.error('检查用户权限失败:', error);
      return false;
    }
  }

  /**
   * 清除角色缓存
   */
  async clearRoleCache(roleId) {
    try {
      // 获取拥有该角色的所有用户
      const userRoles = await prisma.userRole.findMany({
        where: { roleId },
        select: { userId: true }
      });

      // 清除所有相关用户的权限缓存
      for (const ur of userRoles) {
        await this.clearUserPermissionsCache(ur.userId);
      }
    } catch (error) {
      logger.error('清除角色缓存失败:', error);
    }
  }

  /**
   * 清除用户权限缓存
   */
  async clearUserPermissionsCache(userId) {
    try {
      const cacheKey = `user:${userId}:permissions`;
      await redis.del(cacheKey);
    } catch (error) {
      logger.error('清除用户权限缓存失败:', error);
    }
  }

  /**
   * 初始化系统默认角色和权限
   */
  async initializeDefaultRolesAndPermissions() {
    try {
      logger.info('开始初始化系统默认角色和权限...');

      // 1. 创建默认权限
      const defaultPermissions = this.getDefaultPermissions();
      await this.createPermissionsBatch(defaultPermissions);

      // 2. 创建默认角色
      const defaultRoles = await this.getDefaultRoles();

      for (const roleData of defaultRoles) {
        const existing = await prisma.role.findUnique({
          where: { name: roleData.name }
        });

        if (!existing) {
          await this.createRole(roleData);
          logger.info(`创建默认角色: ${roleData.name}`);
        } else {
          logger.info(`默认角色已存在: ${roleData.name}`);
        }
      }

      logger.info('系统默认角色和权限初始化完成');

      return { success: true };
    } catch (error) {
      logger.error('初始化默认角色和权限失败:', error);
      throw error;
    }
  }

  /**
   * 获取默认权限定义
   */
  getDefaultPermissions() {
    return [
      // 用户管理权限
      { name: 'user.create', displayName: '创建用户', module: 'user', action: 'create' },
      { name: 'user.read', displayName: '查看用户', module: 'user', action: 'read' },
      { name: 'user.update', displayName: '更新用户', module: 'user', action: 'update' },
      { name: 'user.delete', displayName: '删除用户', module: 'user', action: 'delete' },
      { name: 'user.ban', displayName: '封禁用户', module: 'user', action: 'ban' },

      // 话题管理权限
      { name: 'topic.create', displayName: '创建话题', module: 'topic', action: 'create' },
      { name: 'topic.read', displayName: '查看话题', module: 'topic', action: 'read' },
      { name: 'topic.update', displayName: '更新话题', module: 'topic', action: 'update' },
      { name: 'topic.delete', displayName: '删除话题', module: 'topic', action: 'delete' },
      { name: 'topic.delete.any', displayName: '删除任何话题', module: 'topic', action: 'delete', resource: 'any' },

      // 评论管理权限
      { name: 'comment.create', displayName: '创建评论', module: 'comment', action: 'create' },
      { name: 'comment.read', displayName: '查看评论', module: 'comment', action: 'read' },
      { name: 'comment.update', displayName: '更新评论', module: 'comment', action: 'update' },
      { name: 'comment.delete', displayName: '删除评论', module: 'comment', action: 'delete' },
      { name: 'comment.delete.any', displayName: '删除任何评论', module: 'comment', action: 'delete', resource: 'any' },

      // 内容审核权限
      { name: 'moderation.review', displayName: '审核内容', module: 'moderation', action: 'review' },
      { name: 'moderation.approve', displayName: '批准内容', module: 'moderation', action: 'approve' },
      { name: 'moderation.reject', displayName: '拒绝内容', module: 'moderation', action: 'reject' },

      // 管理后台权限
      { name: 'admin.access', displayName: '访问管理后台', module: 'admin', action: 'access' },
      { name: 'admin.dashboard', displayName: '查看控制面板', module: 'admin', action: 'dashboard' },
      { name: 'admin.users', displayName: '管理用户', module: 'admin', action: 'users' },
      { name: 'admin.content', displayName: '管理内容', module: 'admin', action: 'content' },
      { name: 'admin.settings', displayName: '系统设置', module: 'admin', action: 'settings' },

      // 角色权限管理
      { name: 'role.create', displayName: '创建角色', module: 'role', action: 'create' },
      { name: 'role.read', displayName: '查看角色', module: 'role', action: 'read' },
      { name: 'role.update', displayName: '更新角色', module: 'role', action: 'update' },
      { name: 'role.delete', displayName: '删除角色', module: 'role', action: 'delete' },
      { name: 'role.assign', displayName: '分配角色', module: 'role', action: 'assign' },

      // 权限管理
      { name: 'permission.create', displayName: '创建权限', module: 'permission', action: 'create' },
      { name: 'permission.read', displayName: '查看权限', module: 'permission', action: 'read' },
      { name: 'permission.update', displayName: '更新权限', module: 'permission', action: 'update' },
      { name: 'permission.delete', displayName: '删除权限', module: 'permission', action: 'delete' },

      // 系统管理权限
      { name: 'system.backup', displayName: '系统备份', module: 'system', action: 'backup' },
      { name: 'system.restore', displayName: '系统恢复', module: 'system', action: 'restore' },
      { name: 'system.logs', displayName: '查看日志', module: 'system', action: 'logs' },
      { name: 'system.monitoring', displayName: '系统监控', module: 'system', action: 'monitoring' }
    ];
  }

  /**
   * 获取默认角色定义
   */
  async getDefaultRoles() {
    // 获取所有权限
    const allPermissions = await prisma.permission.findMany();

    // 定义角色及其权限
    return [
      {
        name: 'super_admin',
        displayName: '超级管理员',
        description: '拥有系统所有权限',
        level: 100,
        type: 'system',
        permissions: allPermissions.map(p => p.id) // 所有权限
      },
      {
        name: 'admin',
        displayName: '管理员',
        description: '拥有大部分管理权限',
        level: 80,
        type: 'system',
        permissions: allPermissions
          .filter(p => !p.name.startsWith('system.') && !p.name.startsWith('role.') && !p.name.startsWith('permission.'))
          .map(p => p.id)
      },
      {
        name: 'moderator',
        displayName: '版主',
        description: '负责内容审核和管理',
        level: 50,
        type: 'system',
        permissions: allPermissions
          .filter(p => ['moderation', 'topic', 'comment'].includes(p.module))
          .map(p => p.id)
      },
      {
        name: 'vip',
        displayName: 'VIP用户',
        description: 'VIP会员用户',
        level: 20,
        type: 'system',
        permissions: allPermissions
          .filter(p => ['topic.create', 'comment.create', 'topic.read', 'comment.read'].includes(p.name))
          .map(p => p.id)
      },
      {
        name: 'user',
        displayName: '普通用户',
        description: '注册用户默认角色',
        level: 10,
        type: 'system',
        permissions: allPermissions
          .filter(p => ['topic.create', 'topic.read', 'comment.create', 'comment.read', 'user.read'].includes(p.name))
          .map(p => p.id)
      }
    ];
  }
}

module.exports = new RBACService();

