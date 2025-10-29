const mockUser = {
  name: '张三',
  avatar: '👨‍💻',
  major: '计算机科学与技术',
  grade: '大三',
  level: 12,
  score: 1420,
  stats: { topics: 23, followers: 890, following: 145 },
}

const menuItems = [
  { icon: '📝', label: '我的话题', path: '/my-topics' },
  { icon: '⭐', label: '收藏', path: '/favorites' },
  { icon: '📊', label: '数据统计', path: '/stats' },
  { icon: '⚙️', label: '设置', path: '/settings' },
]

export default function Profile() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 用户信息卡片 */}
      <div className="bg-gradient-primary text-white rounded-2xl p-8 shadow-lg text-center">
        <div className="text-8xl mb-4">{mockUser.avatar}</div>
        <h1 className="text-3xl font-bold mb-2">{mockUser.name}</h1>
        <p className="text-white/90 mb-4">
          {mockUser.major} · {mockUser.grade}
        </p>
        <div className="flex items-center justify-center space-x-4">
          <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl font-bold">
            LV{mockUser.level}
          </span>
          <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl font-bold">
            ⭐ {mockUser.score}
          </span>
        </div>
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {mockUser.stats.topics}
          </div>
          <div className="text-sm text-gray-500">话题</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {mockUser.stats.followers}
          </div>
          <div className="text-sm text-gray-500">粉丝</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {mockUser.stats.following}
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
      </div>
    </div>
  )
}

