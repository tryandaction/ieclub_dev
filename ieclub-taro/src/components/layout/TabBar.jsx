/**
 * IEClub TabBar 组件
 * 底部导航栏组件
 */
import React from 'react'
import Taro from '@tarojs/taro'
import Icon from '../common/Icon'
import { ICONS } from '../../constants'

const TabBar = () => {
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB
  const [currentPath, setCurrentPath] = React.useState('plaza')
  
  const tabs = [
    {
      key: 'plaza',
      label: '广场',
      icon: ICONS.square,
      path: 'pages/plaza/index',
      h5Path: '/plaza',
      activeIcon: ICONS.square
    },
    {
      key: 'community',
      label: '社区',
      icon: ICONS.community,
      path: 'pages/community/index',
      h5Path: '/community',
      activeIcon: ICONS.community
    },
    {
      key: 'activities',
      label: '活动',
      icon: ICONS.activities,
      path: 'pages/activities/index',
      h5Path: '/activities',
      activeIcon: ICONS.activities
    },
    {
      key: 'profile',
      label: '我的',
      icon: ICONS.profile,
      path: 'pages/profile/index',
      h5Path: '/profile',
      activeIcon: ICONS.profile
    }
  ]
  
  React.useEffect(() => {
    // 获取当前路径
    const pages = Taro.getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      const route = currentPage.route || ''
      const matchTab = tabs.find(tab => route.includes(tab.key))
      if (matchTab) {
        setCurrentPath(matchTab.key)
      }
    }
  }, [])
  
  const isActive = (key) => {
    return currentPath === key
  }
  
  const handleTabClick = (tab) => {
    setCurrentPath(tab.key)
    if (isH5 && window.__POWERED_BY_TARO__) {
      // H5 模式下需要特殊处理
      window.location.hash = tab.h5Path
    } else {
      // 小程序模式使用 Taro switchTab
      Taro.switchTab({
        url: `/${tab.path}`
      })
    }
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
              isActive(tab.key) 
                ? 'text-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon 
              icon={tab.icon} 
              size="lg" 
              color={isActive(tab.key) ? '#8b5cf6' : '#9ca3af'}
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
