import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'

const menuItems = [
  { icon: '📝', label: '我的话题', path: '/my-topics' },
  { icon: '⭐', label: '收藏', path: '/favorites' },
  { icon: '📊', label: '数据统计', path: '/stats' },
  { icon: '⚙️', label: '设置', path: '/settings' },
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, loading } = useAuth()

  const handleLogout = () => {
    logout()
    showToast('已退出登录', 'success')
    navigate('/plaza')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 未登录状态
  if (!user) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card text-center p-12 space-y-6">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-900">欢迎来到IEClub</h2>
          <p className="text-gray-600">登录后可以发布话题、参与讨论、结识伙伴</p>
          
          <div className="space-y-3 pt-4">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full py-3 text-lg"
            >
              登录
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-secondary w-full py-3 text-lg"
            >
              注册新账号
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 已登录状态
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 用户信息卡片 */}
      <div className="bg-gradient-primary text-white rounded-2xl p-8 shadow-lg">
        <div className="text-center">
          <div className="text-8xl mb-4">{user.avatar || '👤'}</div>
          <h1 className="text-3xl font-bold mb-2">{user.nickname || user.username || '未设置昵称'}</h1>
          <p className="text-white/90 mb-2">{user.email}</p>
          <p className="text-white/80 mb-4">
            {user.major || '未设置专业'} {user.grade ? `· ${user.grade}` : ''}
          </p>
          <div className="flex items-center justify-center space-x-4">
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl font-bold">
              LV{user.level || 1}
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl font-bold">
              ⭐ {user.score || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center p-6">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {user.topicsCount || 0}
          </div>
          <div className="text-sm text-gray-500">话题</div>
        </div>
        <div className="card text-center p-6">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {user.followersCount || 0}
          </div>
          <div className="text-sm text-gray-500">粉丝</div>
        </div>
        <div className="card text-center p-6">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {user.followingCount || 0}
          </div>
          <div className="text-sm text-gray-500">关注</div>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="card divide-y divide-gray-100">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className="w-full flex items-center justify-between py-4 px-2 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium text-gray-900">{item.label}</span>
            </div>
            <span className="text-gray-400 text-xl">›</span>
          </button>
        ))}
        
        {/* 退出登录 */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between py-4 px-2 hover:bg-gray-50 transition-colors text-red-600"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🚪</span>
            <span className="font-medium">退出登录</span>
          </div>
          <span className="text-gray-400 text-xl">›</span>
        </button>
      </div>
    </div>
  )
}

