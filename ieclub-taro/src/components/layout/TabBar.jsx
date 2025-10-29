/**
 * IEClub TabBar 底部导航栏组件
 * 完全按照设计文档实现 - 中间突出的圆形发布按钮
 */
import React from 'react'
import Taro from '@tarojs/taro'
import { View } from '@tarojs/components'

const TabBar = () => {
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB
  const [currentPath, setCurrentPath] = React.useState('plaza')
  
  // 导航标签
  const tabs = [
    { key: 'plaza', label: '广场', path: '/pages/plaza/index', h5Path: '/plaza' },
    { key: 'community', label: '社区', path: '/pages/community/index', h5Path: '/community' },
    { key: 'publish', label: '发布', path: null, h5Path: null }, // 中间发布按钮
    { key: 'activities', label: '活动', path: '/pages/activities/index', h5Path: '/activities' },
    { key: 'profile', label: '我的', path: '/pages/profile/index', h5Path: '/profile' }
  ]
  
  // 获取当前路径
  React.useEffect(() => {
    const pages = Taro.getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      const route = currentPage.route || ''
      
      if (route.includes('plaza')) setCurrentPath('plaza')
      else if (route.includes('community')) setCurrentPath('community')
      else if (route.includes('activities')) setCurrentPath('activities')
      else if (route.includes('profile')) setCurrentPath('profile')
    }
  }, [])
  
  // 判断是否激活
  const isActive = (key) => currentPath === key
  
  // Tab点击处理
  const handleTabClick = (tab) => {
    if (tab.key === 'publish') {
      handlePublishClick()
      return
    }
    
    setCurrentPath(tab.key)
    
    // H5环境使用hash路由
    if (isH5) {
      if (typeof window !== 'undefined') {
        window.location.hash = `#${tab.h5Path}`
      }
    } else {
      // 小程序环境使用Taro导航
      Taro.switchTab({
        url: tab.path
      })
    }
  }
  
  // 发布按钮点击
  const handlePublishClick = () => {
    Taro.showToast({
      title: '发布功能开发中',
      icon: 'none'
    })
    // TODO: 打开发布页面或模态框
  }
  
  return (
    <View className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-bottom z-50 shadow-2xl" style={{height: '100px'}}>
      <View className="flex items-center justify-around h-full relative">
        {tabs.map((tab, index) => {
          // 中间发布按钮特殊处理
          if (tab.key === 'publish') {
            return (
              <View
                key={tab.key}
                onClick={handlePublishClick}
                className="flex flex-col items-center justify-center relative"
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  top: '-20px', // 向上突出20px
                  zIndex: 10
                }}
              >
                <View 
                  className="bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 transition-all duration-300"
                  style={{
                    width: '80px',
                    height: '80px',
                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.5)'
                  }}
                >
                  <View className="text-4xl font-light leading-none">+</View>
                </View>
              </View>
            )
          }
          
          // 普通Tab按钮
          return (
            <View
              key={tab.key}
              onClick={() => handleTabClick(tab)}
              className={`flex flex-col items-center justify-center transition-all duration-300 ${
                index < 2 ? 'flex-1' : index > 2 ? 'flex-1' : ''
              }`}
            >
              <View className={`text-base font-bold transition-all duration-300 ${
                isActive(tab.key) 
                  ? 'text-purple-600 scale-110' 
                  : 'text-gray-500'
              }`}>
                {tab.label}
              </View>
              {isActive(tab.key) && (
                <View className="mt-1.5 w-5 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default TabBar
