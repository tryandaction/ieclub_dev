/**
 * 路由守卫组件
 * 处理认证、权限检查、页面标题等
 */
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * 路由守卫
 * @param {ReactNode} children - 子组件
 * @param {boolean} requireAuth - 是否需要认证
 * @param {string} title - 页面标题
 */
export const RouteGuard = ({ children, requireAuth = false, title }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  // 更新页面标题
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  // 检查认证
  if (requireAuth && !isAuthenticated) {
    // 保存当前路径，登录后返回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RouteGuard;

