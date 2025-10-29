/**
 * IEClub 路由配置
 * 使用 React Router v6 配置路由
 */
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

// 页面组件
import PlazaPage from '../pages/plaza'
import CommunityPage from '../pages/community'
import ActivitiesPage from '../pages/activities'
import ProfilePage from '../pages/profile'

// 路由守卫组件
const RouteGuard = ({ children, requireAuth = false }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// 路由配置
const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* 公开路由 */}
        <Route path="/" element={<Navigate to="/plaza" replace />} />
        <Route path="/plaza" element={<PlazaPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        
        {/* 需要登录的路由 */}
        <Route 
          path="/profile" 
          element={
            <RouteGuard requireAuth={true}>
              <ProfilePage />
            </RouteGuard>
          } 
        />
        
        {/* 404 重定向 */}
        <Route path="*" element={<Navigate to="/plaza" replace />} />
      </Routes>
    </Router>
  )
}

export default AppRoutes
