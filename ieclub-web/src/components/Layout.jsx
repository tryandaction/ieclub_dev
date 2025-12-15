import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import FeedbackButton from './FeedbackButton'
import NotificationBadge from './NotificationBadge'
import Avatar from './Avatar'

const navItems = [
  { path: '/plaza', label: '广场', icon: '✨' },
  { path: '/community', label: '社区', icon: '👥' },
  { path: '/publish', label: '发布', icon: '+', isPublish: true },
  { path: '/activities', label: '活动', icon: '🎉' },
  { path: '/personal-center', label: '我的', icon: '👤', requiresAuth: true },
]

export default function Layout() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  
  // 获取导航路径，对于需要用户ID的路径进行处理
  const getNavPath = (item) => {
    if (item.path === '/personal-center' && !isAuthenticated) {
      return '/login'
    }
    return item.path
  }

  // 处理需要登录的按钮点击
  const handleProtectedClick = (e, item) => {
    if (item.requiresAuth && !isAuthenticated) {
      e.preventDefault()
      navigate('/login')
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }
  
  const handlePublishClick = (e, path) => {
    if (!isAuthenticated && path === '/publish') {
      e.preventDefault()
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 桌面端左侧导航栏 */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex-col z-50">
        {/* Logo区域 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white text-xl font-bold">
              IE
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                IEClub
              </h1>
              <p className="text-xs text-gray-500">学习·科研·项目·创业</p>
            </div>
          </div>
          
          {/* 用户登录状态 */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-xl">
              <Avatar 
                src={user.avatar} 
                name={user.nickname || user.username || '用户'} 
                size={40}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.nickname || user.username || '用户'}
                </p>
                <p className="text-xs text-gray-500">LV{user.level || 1}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 py-2 px-3 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium"
              >
                登录
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex-1 py-2 px-3 text-sm bg-gradient-primary text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                注册
              </button>
            </div>
          )}
        </div>

        {/* 搜索框和通知 */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <NotificationBadge />
          </div>
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索..."
                className="w-full px-4 py-2 pr-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                🔍
              </button>
            </div>
          </form>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={getNavPath(item)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  item.isPublish
                    ? 'bg-gradient-primary text-white shadow-lg hover:shadow-xl'
                    : isActive
                    ? 'bg-purple-50 text-purple-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {item.isPublish ? (
                // 发布按钮特殊样式 - 优化设计
                <>
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-semibold">{item.label}</span>
                </>
              ) : (
                <>
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 底部用户操作区 */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-around">
            <button 
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
              title="通知"
            >
              <span className="text-xl">🔔</span>
            </button>
            <button 
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
              title="搜索"
            >
              <span className="text-xl">🔍</span>
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
              title="设置"
            >
              <span className="text-xl">⚙️</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容区 - 桌面端需要左侧留出空间 */}
      <main className="min-h-screen md:ml-64 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* 移动端底部导航 - 响应式 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={getNavPath(item)}
              className={({ isActive }) =>
                item.isPublish
                  ? 'flex flex-col items-center justify-center'
                  : `flex flex-col items-center justify-center py-1.5 px-2 ${
                      isActive ? 'text-purple-600' : 'text-gray-500'
                    }`
              }
            >
              {item.isPublish ? (
                // 移动端发布按钮 - 优化设计
                <div className="relative -top-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-300/50 rotate-0 hover:rotate-90 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-purple-200 rounded-full"></div>
                </div>
              ) : (
                <>
                  <span className="icon-sm">{item.icon}</span>
                  <span className="text-caption mt-0.5">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* 反馈按钮 */}
      <FeedbackButton />
    </div>
  )
}

