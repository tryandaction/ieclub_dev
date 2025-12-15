import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, followUser, unfollowUser } from '../api/community'
import { showToast } from '../components/Toast'
import Avatar from '../components/Avatar'

export default function Community() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  // 跳转到用户个人主页
  const goToUserProfile = (userId) => {
    navigate(`/profile/${userId}`)
  }

  // 加载用户列表
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await getUsers()
      
      // 如果后端返回数据，使用后端数据；否则使用mock数据
      if (data && Array.isArray(data)) {
        setUsers(data)
      } else if (data && data.users && Array.isArray(data.users)) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('❌ 加载用户列表失败:', error)
      showToast('加载用户列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleFollow = async (userId) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录', 'warning')
      navigate('/login')
      return
    }

    try {
      if (user.isFollowing) {
        await unfollowUser(userId)
        setUsers(users.map(u =>
          u.id === userId ? { ...u, isFollowing: false } : u
        ))
        showToast('已取消关注', 'success')
      } else {
        await followUser(userId)
        setUsers(users.map(u =>
          u.id === userId ? { ...u, isFollowing: true } : u
        ))
        showToast('关注成功 ✨', 'success')
      }
    } catch (error) {
      console.error('操作失败:', error)
      const errorMsg = error.response?.data?.message || error.message || ''
      
      // 处理状态不同步：后端返回已关注/未关注时同步本地状态
      if (errorMsg.includes('已经关注')) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, isFollowing: true } : u
        ))
        showToast('已关注该用户', 'info')
      } else if (errorMsg.includes('未关注')) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, isFollowing: false } : u
        ))
        showToast('未关注该用户', 'info')
      } else {
        showToast(errorMsg || '操作失败', 'error')
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 页面标题 - 响应式 */}
      <div className="page-header">
        <h1>发现伙伴</h1>
        <p>找到志同道合的学习伙伴</p>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      )}

      {/* 用户网格 - 小红书风格双列 */}
      {!loading && users.length > 0 && (
        <div className="card-grid">
          {users.map((user) => (
          <div key={user.id} className="card text-center space-y-2 sm:space-y-3">
            {/* 头像 - 点击跳转到用户主页 */}
            <div 
              className="flex justify-center cursor-pointer"
              onClick={() => goToUserProfile(user.id)}
            >
              <Avatar 
                src={user.avatar} 
                name={user.nickname || user.name || '用户'} 
                size={56}
                className="w-14 h-14 sm:w-16 sm:h-16"
              />
            </div>

            {/* 用户信息 - 点击跳转到用户主页 */}
            <div 
              className="cursor-pointer"
              onClick={() => goToUserProfile(user.id)}
            >
              <h3 className="title-sm text-gray-900 hover:text-purple-600 transition-colors truncate">{user.nickname || user.name || '用户'}</h3>
              {user.bio && (
                <p className="text-caption text-gray-500 mt-0.5 line-clamp-2">{user.bio}</p>
              )}
            </div>

            {/* 统计数据 */}
            <div className="stats-row justify-center">
              <span>📝 {user.topicsCount || 0}</span>
              <span>❤️ {user.likesCount || 0}</span>
            </div>

            {/* 关注按钮 */}
            <button
              onClick={() => toggleFollow(user.id)}
              className={`w-full btn ${
                user.isFollowing ? 'btn-secondary' : 'btn-primary'
              }`}
            >
              {user.isFollowing ? '已关注' : '+ 关注'}
            </button>
          </div>
          ))}
        </div>
      )}

      {/* 空状态 - 响应式 */}
      {!loading && users.length === 0 && (
        <div className="text-center py-12 sm:py-20">
          <div className="icon-lg mb-3 sm:mb-4">👥</div>
          <h3 className="title-md text-gray-900 mb-1 sm:mb-2">暂无用户</h3>
          <p className="text-body text-gray-500">社区正在成长中...</p>
        </div>
      )}
    </div>
  )
}

