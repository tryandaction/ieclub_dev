// 认证工具函数
import type { Admin } from '@/types/admin';

/**
 * 检查是否有指定权限
 */
export const hasPermission = (admin: Admin | null, permission: string): boolean => {
  if (!admin) return false;
  if (admin.role === 'super_admin') return true;
  return admin.permissions.includes(permission);
};

/**
 * 检查是否有任一权限
 */
export const hasAnyPermission = (admin: Admin | null, permissions: string[]): boolean => {
  if (!admin) return false;
  if (admin.role === 'super_admin') return true;
  return permissions.some((permission) => admin.permissions.includes(permission));
};

/**
 * 检查是否有所有权限
 */
export const hasAllPermissions = (admin: Admin | null, permissions: string[]): boolean => {
  if (!admin) return false;
  if (admin.role === 'super_admin') return true;
  return permissions.every((permission) => admin.permissions.includes(permission));
};

/**
 * 获取角色显示名称
 */
export const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    super_admin: '超级管理员',
    platform_admin: '平台管理员',
    content_moderator: '内容审核员',
    data_analyst: '数据分析员',
  };
  return roleMap[role] || role;
};

/**
 * 获取角色权限等级
 */
export const getRoleLevel = (role: string): number => {
  const levelMap: Record<string, number> = {
    super_admin: 10,
    platform_admin: 5,
    content_moderator: 3,
    data_analyst: 2,
  };
  return levelMap[role] || 0;
};

