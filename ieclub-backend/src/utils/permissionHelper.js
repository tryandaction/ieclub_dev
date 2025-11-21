/**
 * 权限检查辅助工具
 * 统一权限检查逻辑
 */

const prisma = require('../config/database');
const logger = require('./logger');
const { withCache } = require('./cacheHelper');

/**
 * 检查用户是否有指定角色
 * @param {string} userId - 用户ID
 * @param {string|string[]} roleNames - 角色名称（单个或数组）
 * @returns {Promise<boolean>}
 */
async function hasRole(userId, roleNames) {
  if (!userId) return false;
  
  const roles = Array.isArray(roleNames) ? roleNames : [roleNames];
  
  try {
    const cacheKey = `user:${userId}:roles`;
    
    const userRoles = await withCache(cacheKey, 300, async () => {
      const result = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            select: { name: true, level: true, isActive: true }
          }
        }
      });
      
      return result.map(ur => ({
        name: ur.role.name,
        level: ur.role.level,
        isActive: ur.role.isActive
      }));
    });
    
    // 检查是否有任一指定角色
    return userRoles.some(role => 
      role.isActive && roles.includes(role.name)
    );
  } catch (error) {
    logger.error('Check role error:', { userId, roleNames, error: error.message });
    return false;
  }
}

/**
 * 检查用户是否是管理员
 * @param {string} userId - 用户ID
 * @returns {Promise<boolean>}
 */
async function isAdmin(userId) {
  return await hasRole(userId, ['admin', 'super_admin']);
}

/**
 * 检查用户是否有指定权限
 * @param {string} userId - 用户ID
 * @param {string} permission - 权限名称（如 'topic.delete'）
 * @returns {Promise<boolean>}
 */
async function hasPermission(userId, permission) {
  if (!userId || !permission) return false;
  
  try {
    // 管理员拥有所有权限
    if (await isAdmin(userId)) {
      return true;
    }
    
    const cacheKey = `user:${userId}:permissions`;
    
    const permissions = await withCache(cacheKey, 300, async () => {
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: {
                    select: { name: true, isActive: true }
                  }
                }
              }
            }
          }
        }
      });
      
      const allPermissions = new Set();
      userRoles.forEach(ur => {
        if (ur.role.isActive) {
          ur.role.permissions.forEach(rp => {
            if (rp.permission.isActive) {
              allPermissions.add(rp.permission.name);
            }
          });
        }
      });
      
      return Array.from(allPermissions);
    });
    
    return permissions.includes(permission);
  } catch (error) {
    logger.error('Check permission error:', { userId, permission, error: error.message });
    return false;
  }
}

/**
 * 检查用户是否可以操作资源
 * @param {string} userId - 用户ID
 * @param {string} resourceType - 资源类型（如 'topic', 'comment'）
 * @param {string} action - 操作（如 'edit', 'delete'）
 * @param {Object} resource - 资源对象（需包含authorId或userId）
 * @returns {Promise<boolean>}
 */
async function canOperate(userId, resourceType, action, resource) {
  if (!userId) return false;
  
  // 是作者/创建者
  const isOwner = resource.authorId === userId || resource.userId === userId;
  
  // 对于编辑操作，作者可以操作
  if (action === 'edit' && isOwner) {
    return true;
  }
  
  // 对于删除操作，检查权限
  if (action === 'delete') {
    // 作者可以删除自己的内容
    if (isOwner) return true;
    
    // 管理员可以删除所有内容
    if (await isAdmin(userId)) return true;
    
    // 检查特定权限
    return await hasPermission(userId, `${resourceType}.${action}`);
  }
  
  // 其他操作检查权限
  return await hasPermission(userId, `${resourceType}.${action}`);
}

/**
 * 清除用户权限缓存
 * @param {string} userId - 用户ID
 */
async function clearUserPermissionCache(userId) {
  const CacheManager = require('../config/cache');
  await CacheManager.del(`user:${userId}:roles`);
  await CacheManager.del(`user:${userId}:permissions`);
  logger.debug(`Cleared permission cache for user: ${userId}`);
}

module.exports = {
  hasRole,
  isAdmin,
  hasPermission,
  canOperate,
  clearUserPermissionCache
};
