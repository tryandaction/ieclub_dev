/**
 * IEClub 侧边栏导航组件
 * 仅在PC端显示，参考小红书左侧导航设计
 */
import React from 'react'
import Taro from '@tarojs/taro'
import { ICONS } from '../../constants'

const Sidebar = () => {
  const [currentPath, setCurrentPath] = React.useState('plaza')
  
  // 主导航菜单
  const mainMenus = [
    { key: 'plaza', label: '广场', path: 'pages/plaza/index' },
    { key: 'community', label: '社区', path: 'pages/community/index' },
    { key: 'activities', label: '活动', path: 'pages/activities/index' },
    { key: 'profile', label: '我的', path: 'pages/profile/index' }
  ]
  
  React.useEffect(() => {
    // 获取当前路径
    const pages = Taro.getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      const route = currentPage.route || ''
      const matchMenu = mainMenus.find(menu => route.includes(menu.key))
      if (matchMenu) {
        setCurrentPath(matchMenu.key)
      }
    }
  }, [])
  
  const handleMenuClick = (menu) => {
    setCurrentPath(menu.key)
    if (typeof window !== 'undefined' && window.__POWERED_BY_TARO__) {
      window.location.hash = `#/${menu.key}`
    } else {
      Taro.switchTab({ url: `/${menu.path}` })
    }
  }
  
  const handlePublishClick = () => {
    Taro.showToast({
      title: '发布功能开发中',
      icon: 'none'
    })
  }
  
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:bg-white lg:border-r lg:border-gray-100 lg:shadow-sm">
      {/* Logo */}
      <div className="flex items-center justify-center h-20 px-6 border-b border-gray-100">
        <div className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent">
          IEClub
        </div>
      </div>
      
      {/* 主导航 */}
      <nav className="flex-1 py-8 px-4 space-y-2">
        {mainMenus.map((menu) => (
          <button
            key={menu.key}
            onClick={() => handleMenuClick(menu)}
            className={`w-full px-6 py-3.5 rounded-2xl text-left font-bold text-[15px] transition-all duration-300 transform ${
              currentPath === menu.key
                ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'text-gray-700 hover:bg-gray-50 hover:scale-102'
            }`}
          >
            {menu.label}
          </button>
        ))}
        
        {/* 发布按钮 */}
        <button
          onClick={handlePublishClick}
          className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white rounded-2xl font-bold text-[15px] hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-300 transform hover:scale-105"
        >
          ✨ 发布
        </button>
      </nav>
      
      {/* 底部信息 */}
      <div className="p-6 border-t border-gray-100">
        <div className="text-xs text-gray-400 text-center font-medium">
          IEClub v2.0
        </div>
      </div>
    </div>
  )
}

export default Sidebar

