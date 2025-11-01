// ieclub-backend/src/controllers/adminRBACController.js
// 管理后台 RBAC 管理界面专用控制器

const rbacService = require('../services/rbacService');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class AdminRBACController {
  /**
   * 获取角色权限管理概览
   * GET /api/admin/rbac/overview
   */
  static async getOverview(req, res) {
    try {
      // 获取统计数据
      const [
        rolesCount,
        permissionsCount,
        usersWithRoles,
        recentAssignments
      ] = await Promise.all([
        prisma.role.count(),
        prisma.permission.count(),
        prisma.userRole.count(),
        prisma.userRole.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                email: true,
                avatar: true
              }
            },
            role: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        })
      ]);

      // 按模块统计权限
      const permissions = await prisma.permission.findMany();
      const permissionsByModule = permissions.reduce((acc, perm) => {
        acc[perm.module] = (acc[perm.module] || 0) + 1;
        return acc;
      }, {});

      // 统计每个角色的用户数
      const roles = await prisma.role.findMany({
        include: {
          _count: {
            select: {
              userRoles: true
            }
          }
        }
      });

      const roleStats = roles.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        userCount: role._count.userRoles,
        type: role.type,
        level: role.level
      }));

      return res.json({
        success: true,
        data: {
          stats: {
            totalRoles: rolesCount,
            totalPermissions: permissionsCount,
            usersWithRoles,
            permissionsByModule
          },
          roleStats,
          recentAssignments: recentAssignments.map(ra => ({
            id: ra.id,
            user: ra.user,
            role: ra.role,
            assignedAt: ra.createdAt,
            expiresAt: ra.expiresAt
          }))
        }
      });
    } catch (error) {
      logger.error('获取RBAC概览失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * 获取用户的角色和权限信息（用于管理页面）
   * GET /api/admin/rbac/users/:userId/details
   */
  static async getUserRoleDetails(req, res) {
    try {
      const { userId } = req.params;

      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nickname: true,
          avatar: true,
          status: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '用户不存在' }
        });
      }

      // 获取用户角色
      const userRoles = await rbacService.getUserRoles(userId);

      // 获取用户权限
      const userPermissions = await rbacService.getUserPermissions(userId);

      // 获取所有可用角色
      const availableRoles = await rbacService.getAllRoles();

      return res.json({
        success: true,
        data: {
          user,
          currentRoles: userRoles,
          permissions: userPermissions,
          availableRoles: availableRoles.filter(
            role => !userRoles.some(ur => ur.id === role.id)
          )
        }
      });
    } catch (error) {
      logger.error('获取用户角色详情失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * 批量分配角色
   * POST /api/admin/rbac/batch-assign
   */
  static async batchAssignRoles(req, res) {
    try {
      const { userIds, roleIds, expiresAt } = req.body;

      if (!userIds || !userIds.length || !roleIds || !roleIds.length) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '用户ID和角色ID不能为空' }
        });
      }

      const results = {
        success: [],
        failed: []
      };

      const assignedBy = req.user.id;
      const expiresDate = expiresAt ? new Date(expiresAt) : null;

      for (const userId of userIds) {
        for (const roleId of roleIds) {
          try {
            await rbacService.assignRoleToUser(userId, roleId, assignedBy, expiresDate);
            results.success.push({ userId, roleId });
          } catch (error) {
            results.failed.push({ userId, roleId, error: error.message });
          }
        }
      }

      logger.info(`批量分配角色完成`, {
        operator: req.user.id,
        success: results.success.length,
        failed: results.failed.length
      });

      return res.json({
        success: true,
        data: results,
        message: `成功分配 ${results.success.length} 个，失败 ${results.failed.length} 个`
      });
    } catch (error) {
      logger.error('批量分配角色失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * 批量移除角色
   * POST /api/admin/rbac/batch-remove
   */
  static async batchRemoveRoles(req, res) {
    try {
      const { userIds, roleIds } = req.body;

      if (!userIds || !userIds.length || !roleIds || !roleIds.length) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '用户ID和角色ID不能为空' }
        });
      }

      const results = {
        success: [],
        failed: []
      };

      for (const userId of userIds) {
        for (const roleId of roleIds) {
          try {
            await rbacService.removeRoleFromUser(userId, roleId);
            results.success.push({ userId, roleId });
          } catch (error) {
            results.failed.push({ userId, roleId, error: error.message });
          }
        }
      }

      logger.info(`批量移除角色完成`, {
        operator: req.user.id,
        success: results.success.length,
        failed: results.failed.length
      });

      return res.json({
        success: true,
        data: results,
        message: `成功移除 ${results.success.length} 个，失败 ${results.failed.length} 个`
      });
    } catch (error) {
      logger.error('批量移除角色失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * 获取角色权限矩阵（用于可视化）
   * GET /api/admin/rbac/permission-matrix
   */
  static async getPermissionMatrix(req, res) {
    try {
      const roles = await rbacService.getAllRoles();
      const permissions = await rbacService.getAllPermissions();

      // 按模块分组权限
      const permissionsByModule = permissions.reduce((acc, perm) => {
        if (!acc[perm.module]) {
          acc[perm.module] = [];
        }
        acc[perm.module].push(perm);
        return acc;
      }, {});

      // 构建权限矩阵
      const matrix = {};

      for (const role of roles) {
        matrix[role.id] = {
          role: {
            id: role.id,
            name: role.name,
            displayName: role.displayName,
            level: role.level
          },
          permissions: role.permissions.map(p => p.id)
        };
      }

      return res.json({
        success: true,
        data: {
          roles,
          permissions,
          permissionsByModule,
          matrix
        }
      });
    } catch (error) {
      logger.error('获取权限矩阵失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * 搜索用户（用于分配角色）
   * GET /api/admin/rbac/search-users
   */
  static async searchUsers(req, res) {
    try {
      const { keyword, page = 1, pageSize = 20, roleId } = req.query;

      const where = {};

      // 搜索条件
      if (keyword) {
        where.OR = [
          { email: { contains: keyword } },
          { nickname: { contains: keyword } }
        ];
      }

      // 按角色过滤
      if (roleId) {
        where.roles = {
          some: {
            roleId
          }
        };
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            nickname: true,
            avatar: true,
            status: true,
            createdAt: true,
            roles: {
              include: {
                role: {
                  select: {
                    id: true,
                    name: true,
                    displayName: true
                  }
                }
              }
            }
          },
          skip: (page - 1) * pageSize,
          take: parseInt(pageSize),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      return res.json({
        success: true,
        data: {
          users: users.map(user => ({
            ...user,
            roles: user.roles.map(ur => ur.role)
          })),
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        }
      });
    } catch (error) {
      logger.error('搜索用户失败:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }
}

module.exports = AdminRBACController;

