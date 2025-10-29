/**
 * IEClub MainLayout 组件
 * 主布局组件，包含导航栏和底部TabBar
 */
import React from 'react'
import Navbar from './Navbar'
import TabBar from './TabBar'

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
      
      {/* 主要内容区域 */}
      <main className="pb-20">
        {children}
      </main>
      
      {/* 底部导航栏 */}
      <TabBar />
    </div>
  )
}

export default MainLayout
