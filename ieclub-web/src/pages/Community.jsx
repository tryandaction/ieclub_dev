import { useState } from 'react'

const mockUsers = [
  {
    id: 1,
    name: '张三',
    avatar: '👨‍💻',
    major: '计算机科学',
    grade: '大三',
    level: 12,
    score: 1420,
    isFollowing: false,
  },
  {
    id: 2,
    name: '李四',
    avatar: '👩‍🎓',
    major: '数学系',
    grade: '大二',
    level: 9,
    score: 820,
    isFollowing: true,
  },
]

export default function Community() {
  const [users, setUsers] = useState(mockUsers)

  const toggleFollow = (userId) => {
    setUsers(users.map(u =>
      u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
    ))
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-gradient-primary text-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">发现伙伴</h1>
        <p className="text-white/90">找到志同道合的学习伙伴</p>
      </div>

      {/* 用户网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {users.map((user) => (
          <div key={user.id} className="card text-center space-y-4">
            {/* 头像 */}
            <div className="text-6xl">{user.avatar}</div>

            {/* 用户信息 */}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {user.major} · {user.grade}
              </p>
            </div>

            {/* 等级和积分 */}
            <div className="flex items-center justify-center space-x-3">
              <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-lg text-sm font-bold">
                LV{user.level}
              </span>
              <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-lg text-sm font-bold">
                ⭐ {user.score}
              </span>
            </div>

            {/* 关注按钮 */}
            <button
              onClick={() => toggleFollow(user.id)}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                user.isFollowing
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gradient-primary text-white hover:shadow-lg hover:scale-105'
              }`}
            >
              {user.isFollowing ? '已关注' : '+ 关注'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

