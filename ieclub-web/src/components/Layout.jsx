import { Outlet, NavLink } from 'react-router-dom'

const navItems = [
  { path: '/plaza', label: '广场', icon: '✨' },
  { path: '/community', label: '社区', icon: '👥' },
  { path: '/publish', label: '发布', icon: '✍️' },
  { path: '/activities', label: '活动', icon: '🎉' },
  { path: '/profile', label: '我的', icon: '👤' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center text-white text-xl font-bold">
                IE
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  IEClub
                </h1>
                <p className="text-xs text-gray-500">学习·科研·创业</p>
              </div>
            </div>

            {/* 导航菜单 */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-primary text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* 用户操作区 */}
            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                🔔
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                🔍
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>

      {/* 移动端底部导航 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-4 ${
                  isActive ? 'text-purple-600' : 'text-gray-500'
                }`
              }
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

