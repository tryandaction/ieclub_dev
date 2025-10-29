/**
 * IEClub MainLayout 组件
 * 主布局组件，响应式设计：PC端左侧导航，移动端底部导航
 */
import React from 'react'
import Taro from '@tarojs/taro'
import { View } from '@tarojs/components'
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
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
  
  return (
    <View className="min-h-screen bg-gray-50">
      {/* PC端侧边栏 - 仅H5显示 */}
      {!isWeapp && <Sidebar />}
      
      {/* 主要内容区域 */}
      <View className="lg:ml-64">
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
        
        {/* 内容区域 - 增加最大宽度和居中 */}
        <View className="pb-20 lg:pb-6 min-h-screen">
          {children}
        </View>
      </View>
      
      {/* 移动端底部导航栏 - 仅H5显示（小程序用原生tabBar） */}
      {!isWeapp && <TabBar />}
    </View>
  )
}

export default MainLayout
