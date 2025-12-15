import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  User, FileText, Heart, Calendar, TrendingUp, 
  Users, UserPlus, Settings, MessageSquare, 
  Info, Edit, Award
} from 'lucide-react'

export default function PersonalCenter() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated || !user) {
    navigate('/login')
    return null
  }

  const menuItems = [
    {
      icon: User,
      label: '个人主页',
      desc: '查看我的主页',
      path: `/profile/${user.id}`,
      color: 'purple'
    },
    {
      icon: Edit,
      label: '编辑资料',
      desc: '修改个人信息',
      path: `/profile/${user.id}/edit`,
      color: 'blue'
    },
    {
      icon: FileText,
      label: '我的话题',
      desc: '查看发布的话题',
      path: '/my-topics',
      color: 'green'
    },
    {
      icon: Heart,
      label: '我的收藏',
      desc: '查看收藏内容',
      path: '/my-favorites',
      color: 'red'
    },
    {
      icon: Calendar,
      label: '我的活动',
      desc: '参与的活动',
      path: '/my-activities',
      color: 'orange'
    },
    {
      icon: TrendingUp,
      label: '数据统计',
      desc: '查看个人数据',
      path: '/my-stats',
      color: 'indigo'
    },
    {
      icon: Users,
      label: '关注列表',
      desc: '我关注的人',
      path: `/my-following/${user.id}`,
      color: 'cyan'
    },
    {
      icon: UserPlus,
      label: '粉丝列表',
      desc: '关注我的人',
      path: `/my-followers/${user.id}`,
      color: 'pink'
    },
    {
      icon: Settings,
      label: '设置',
      desc: '账号设置',
      path: '/settings',
      color: 'gray'
    },
    {
      icon: MessageSquare,
      label: '意见反馈',
      desc: '提交反馈',
      path: '/feedback',
      color: 'yellow'
    },
    {
      icon: Info,
      label: '关于我们',
      desc: '了解IEClub',
      path: '/about',
      color: 'teal'
    }
  ]

  const colorClasses = {
    purple: 'from-purple-500 to-purple-600 hover:shadow-purple-200',
    blue: 'from-blue-500 to-blue-600 hover:shadow-blue-200',
    green: 'from-green-500 to-green-600 hover:shadow-green-200',
    red: 'from-red-500 to-red-600 hover:shadow-red-200',
    orange: 'from-orange-500 to-orange-600 hover:shadow-orange-200',
    indigo: 'from-indigo-500 to-indigo-600 hover:shadow-indigo-200',
    cyan: 'from-cyan-500 to-cyan-600 hover:shadow-cyan-200',
    pink: 'from-pink-500 to-pink-600 hover:shadow-pink-200',
    gray: 'from-gray-500 to-gray-600 hover:shadow-gray-200',
    yellow: 'from-yellow-500 to-yellow-600 hover:shadow-yellow-200',
    teal: 'from-teal-500 to-teal-600 hover:shadow-teal-200'
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 用户信息卡片 - 移动端优化 */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 sm:p-8 mb-4 sm:mb-6">
        <div className="max-w-6xl mx-auto">
          {/* 移动端：居中垂直布局 */}
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-4 sm:gap-6">
            <img
              src={user.avatar || '/default-avatar.png'}
              alt={user.nickname}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 sm:mb-2">
                <h1 className="text-xl sm:text-3xl font-bold truncate">{user.nickname || '用户'}</h1>
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs whitespace-nowrap">
                  Lv.{user.level || 1}
                </span>
              </div>
              <p className="text-white/90 text-sm sm:text-base line-clamp-2 mb-2 sm:mb-3">
                {user.bio || '这个人很懒，什么都没写'}
              </p>
              {user.email && (
                <p className="text-white/70 text-xs sm:text-sm truncate hidden sm:block">
                  📧 {user.email}
                </p>
              )}
            </div>
            <button
              onClick={logout}
              className="px-4 py-1.5 sm:px-6 sm:py-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition text-sm sm:text-base whitespace-nowrap"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>

      {/* 功能菜单 - 移动端方块布局 */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-6">个人中心</h2>
        
        {/* 移动端3列方块，平板2列，桌面4列 */}
        <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`bg-gradient-to-br ${colorClasses[item.color]} p-3 sm:p-6 rounded-xl sm:rounded-2xl cursor-pointer transform hover:scale-105 transition-all shadow-md hover:shadow-xl text-white aspect-square sm:aspect-auto flex flex-col items-center justify-center sm:items-start sm:justify-start`}
              >
                {/* 移动端：居中图标+标签 */}
                <Icon size={24} className="opacity-90 sm:hidden mb-2" />
                {/* 桌面端：左上角图标 */}
                <div className="hidden sm:flex items-start justify-between mb-4 w-full">
                  <Icon size={32} className="opacity-90" />
                  {item.badge && (
                    <span className="px-2 py-1 bg-white/30 rounded-full text-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-xs sm:text-lg font-bold sm:mb-1 text-center sm:text-left">{item.label}</h3>
                <p className="text-xs text-white/80 hidden sm:block">{item.desc}</p>
              </div>
            )
          })}
        </div>

        {/* 快捷操作 - 移动端优化 */}
        <div className="mt-4 sm:mt-8 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
          <h3 className="text-base sm:text-xl font-bold mb-3 sm:mb-4">快捷操作</h3>
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/publish')}
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-3 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition text-xs sm:text-base"
            >
              <span>✨</span>
              <span>发布话题</span>
            </button>
            <button
              onClick={() => navigate('/activities')}
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-3 sm:px-6 sm:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition text-xs sm:text-base"
            >
              <span>🎉</span>
              <span>浏览活动</span>
            </button>
            <button
              onClick={() => navigate('/community')}
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-3 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition text-xs sm:text-base"
            >
              <span>👥</span>
              <span>发现社区</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
