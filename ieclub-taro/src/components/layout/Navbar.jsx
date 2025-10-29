/**
 * IEClub Navbar 组件
 * 顶部导航栏组件
 */
import React from 'react'
import Taro from '@tarojs/taro'

const Navbar = ({ 
  title = 'IEClub',
  showBack = false,
  showSearch = true,
  showNotification = true,
  onBack,
  onSearch,
  onNotification
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      Taro.navigateBack()
    }
  }
  
  const handleSearch = () => {
    if (onSearch) {
      onSearch()
    } else {
      Taro.showToast({
        title: '搜索功能开发中',
        icon: 'none'
      })
      // TODO: 实现搜索功能
      // Taro.navigateTo({ url: '/pages/search/index' })
    }
  }
  
  const handleNotification = () => {
    if (onNotification) {
      onNotification()
    } else {
      Taro.showToast({
        title: '通知功能开发中',
        icon: 'none'
      })
      // TODO: 实现通知功能
      // Taro.navigateTo({ url: '/pages/notifications/index' })
    }
  }
  
  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-area-top shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4 max-w-screen-2xl mx-auto">
        {/* 左侧 */}
        <div className="flex items-center">
          {showBack && (
            <button
              onClick={handleBack}
              className="mr-3 px-3 py-2 hover:bg-purple-50 rounded-xl transition-all duration-200 text-gray-700 text-lg font-medium"
            >
              ←
            </button>
          )}
          
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {title}
          </h1>
        </div>
        
        {/* 右侧 */}
        <div className="flex items-center space-x-1">
          {showSearch && (
            <button
              onClick={handleSearch}
              className="px-4 py-2 hover:bg-purple-50 rounded-xl transition-all duration-200 text-gray-700 text-sm font-medium"
            >
              🔍
            </button>
          )}
          
          {showNotification && (
            <button
              onClick={handleNotification}
              className="px-4 py-2 hover:bg-purple-50 rounded-xl transition-all duration-200 relative text-gray-700 text-sm font-medium"
            >
              🔔
              {/* 未读通知红点 */}
              <div className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Navbar
