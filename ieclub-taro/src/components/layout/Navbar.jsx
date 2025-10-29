/**
 * IEClub Navbar 组件
 * 顶部导航栏组件
 */
import React from 'react'
import Taro from '@tarojs/taro'
import Icon from '../common/Icon'
import { ICONS } from '../../constants'

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
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* 左侧 */}
        <div className="flex items-center">
          {showBack && (
            <button
              onClick={handleBack}
              className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <Icon icon="mdi:arrow-left" size="lg" color="#374151" />
            </button>
          )}
          
          <h1 className="text-xl font-bold text-gray-800">
            {title}
          </h1>
        </div>
        
        {/* 右侧 */}
        <div className="flex items-center space-x-2">
          {showSearch && (
            <button
              onClick={handleSearch}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <Icon icon={ICONS.search} size="lg" color="#6b7280" />
            </button>
          )}
          
          {showNotification && (
            <button
              onClick={handleNotification}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 relative"
            >
              <Icon icon={ICONS.notification} size="lg" color="#6b7280" />
              {/* 未读通知红点 */}
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </button>
          )}
          
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
            <Icon icon={ICONS.settings} size="lg" color="#6b7280" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Navbar
