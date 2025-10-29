/**
 * IEClub MainLayout 组件
 * 主布局组件，响应式设计：PC端左侧导航，移动端底部导航
 */
import React from 'react'
import Navbar from './Navbar'
import TabBar from './TabBar'
import Sidebar from './Sidebar'

const MainLayout = ({ 
  children,
  title,
  showBack = false,
  showSearch = true,
  showNotification = true,
  onBack,
  onSearch,
  onNotification
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* PC端侧边栏 */}
      <Sidebar />
      
      {/* 主要内容区域 */}
      <div className="lg:ml-64">
        {/* 顶部导航栏 */}
        <Navbar
          title={title}
          showBack={showBack}
          showSearch={showSearch}
          showNotification={showNotification}
          onBack={onBack}
          onSearch={onSearch}
          onNotification={onNotification}
        />
        
        {/* 内容区域 */}
        <main className="pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      
      {/* 移动端底部导航栏 */}
      <TabBar />
    </div>
  )
}

export default MainLayout
