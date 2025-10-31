import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * 需要登录才能访问的路由守卫
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // 保存当前路径，登录后可以返回
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

/**
 * 已登录用户不能访问的路由守卫（如登录页、注册页）
 */
export function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    // 已登录用户访问登录页/注册页，重定向到首页
    return <Navigate to="/plaza" replace />
  }

  return children
}

