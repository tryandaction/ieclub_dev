/**
 * IEClub Navbar 组件
 * 顶部导航栏组件
 */
import React from 'react'
import Taro from '@tarojs/taro'
import { View } from '@tarojs/components'

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
    <View className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-area-top shadow-sm">
      <View className="flex items-center justify-between px-4 lg:px-6 py-4 max-w-screen-2xl mx-auto">
        {/* 左侧 */}
        <View className="flex items-center">
          {showBack && (
            <View
              onClick={handleBack}
              className="mr-3 px-3 py-2 hover:bg-purple-50 rounded-xl transition-all duration-200 text-gray-700 text-lg font-medium"
            >
              ←
            </View>
          )}
          
          <View className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {title}
          </View>
        </View>
        
        {/* 右侧 */}
        <View className="flex items-center space-x-1">
          {showSearch && (
            <View
              onClick={handleSearch}
              className="px-4 py-2 hover:bg-purple-50 rounded-xl transition-all duration-200 text-gray-700 text-sm font-medium"
            >
              🔍
            </View>
          )}
          
          {showNotification && (
            <View
              onClick={handleNotification}
              className="px-4 py-2 hover:bg-purple-50 rounded-xl transition-all duration-200 relative text-gray-700 text-sm font-medium"
            >
              🔔
              {/* 未读通知红点 */}
              <View className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></View>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

export default Navbar
