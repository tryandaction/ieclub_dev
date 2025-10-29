/**
 * IEClub TabBar 组件
 * 底部导航栏组件
 */
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from '../common/Icon'
import { ICONS } from '../../constants'

const TabBar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const tabs = [
    {
      key: 'plaza',
      label: '广场',
      icon: ICONS.square,
      path: '/plaza',
      activeIcon: ICONS.square
    },
    {
      key: 'community',
      label: '社区',
      icon: ICONS.community,
      path: '/community',
      activeIcon: ICONS.community
    },
    {
      key: 'activities',
      label: '活动',
      icon: ICONS.activities,
      path: '/activities',
      activeIcon: ICONS.activities
    },
    {
      key: 'profile',
      label: '我的',
      icon: ICONS.profile,
      path: '/profile',
      activeIcon: ICONS.profile
    }
  ]
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }
  
  const handleTabClick = (tab) => {
    navigate(tab.path)
  }
  
  const handlePublishClick = () => {
    // TODO: 打开发布页面
    console.log('发布功能')
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab)}
            className={`flex flex-col items-center py-2 px-3 transition-colors duration-200 ${
              isActive(tab.path) 
                ? 'text-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon 
              icon={tab.icon} 
              size="lg" 
              color={isActive(tab.path) ? '#8b5cf6' : '#9ca3af'}
            />
            <span className="text-xs mt-1 font-medium">{tab.label}</span>
          </button>
        ))}
        
        {/* 发布按钮 */}
        <button
          onClick={handlePublishClick}
          className="flex flex-col items-center py-2 px-3"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <Icon icon={ICONS.publish} size="lg" color="white" />
          </div>
          <span className="text-xs mt-1 font-medium text-gray-500">发布</span>
        </button>
      </div>
    </div>
  )
}

export default TabBar
