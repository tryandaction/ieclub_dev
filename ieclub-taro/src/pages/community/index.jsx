/**
 * IEClub 社区页面 
 * 参考小红书风格 + 旧版优秀设计
 */
import React, { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import MainLayout from '../../components/layout/MainLayout'
import { useUserStore } from '../../store/userStore'
import { getUserLevel, formatNumber } from '../../utils'

const CommunityPage = () => {
  const { 
    users, 
    isLoading, 
    hasMore,
    fetchUsers,
    followUser,
    unfollowUser 
  } = useUserStore()
  
  const [viewMode, setViewMode] = useState('grid') // grid | list
  const [sortBy, setSortBy] = useState('level') // level | followers | activity
  
  // 页面加载时获取用户 - 使用模拟数据
  useEffect(() => {
    // 如果没有用户数据，使用模拟数据
    if (!users || users.length === 0) {
      console.log('社区页面：暂无用户数据，显示空状态')
    } else {
      fetchUsers(true)
    }
  }, [])
  
  // 加载更多
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchUsers(false)
    }
  }
  
  // 关注/取消关注
  const handleFollow = async (userId, isFollowing) => {
    if (isFollowing) {
      await unfollowUser(userId)
    } else {
      await followUser(userId)
    }
  }
  
  // 用户点击
  const handleUserClick = (user) => {
    Taro.showToast({
      title: `查看${user.name}的主页`,
      icon: 'none'
    })
    // TODO: 跳转到用户详情页
  }
  
  // 排序用户
  const sortedUsers = [...(users || [])].sort((a, b) => {
    switch (sortBy) {
      case 'level':
        return (b.level || 0) - (a.level || 0)
      case 'followers':
        return (b.followersCount || 0) - (a.followersCount || 0)
      case 'activity':
        return (b.activityScore || 0) - (a.activityScore || 0)
      default:
        return 0
    }
  })
  
  //模拟数据
  const mockUsers = [
    {
      id: 1,
      name: '张明',
      avatar: '👨‍💻',
      major: '计算机科学与工程系',
      level: 15,
      score: 2580,
      followersCount: 128,
      postsCount: 45,
      isFollowing: false
    },
    {
      id: 2,
      name: '李思',
      avatar: '👩‍🔬',
      major: '生物医学工程系',
      level: 12,
      score: 1890,
      followersCount: 95,
      postsCount: 32,
      isFollowing: true
    },
    {
      id: 3,
      name: '王浩',
      avatar: '🧑‍🎨',
      major: '工业设计',
      level: 10,
      score: 1520,
      followersCount: 76,
      postsCount: 28,
      isFollowing: false
    },
    {
      id: 4,
      name: '刘强',
      avatar: '👨‍🏫',
      major: '数据科学与大数据技术',
      level: 14,
      score: 2210,
      followersCount: 112,
      postsCount: 38,
      isFollowing: false
    },
    {
      id: 5,
      name: '赵敏',
      avatar: '👩‍💼',
      major: '金融学',
      level: 11,
      score: 1650,
      followersCount: 88,
      postsCount: 25,
      isFollowing: true
    },
    {
      id: 6,
      name: '孙琪',
      avatar: '🧑‍🔬',
      major: '物理学',
      level: 13,
      score: 2050,
      followersCount: 102,
      postsCount: 35,
      isFollowing: false
    }
  ]
  
  const displayUsers = sortedUsers.length > 0 ? sortedUsers : mockUsers
  
  return (
    <MainLayout title="社区">
      <div className="max-w-screen-2xl mx-auto p-4 lg:p-6">
        {/* 欢迎横幅 */}
        <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-3xl p-6 lg:p-8 mb-6 text-white shadow-2xl shadow-purple-500/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="relative">
            <h2 className="text-2xl lg:text-3xl font-extrabold mb-2">发现志同道合的伙伴 👋</h2>
            <p className="text-sm lg:text-base opacity-90">连接思想 · 激发创新 · 共同成长</p>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                网格
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                列表
              </button>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="level">按等级</option>
              <option value="followers">按粉丝数</option>
              <option value="activity">按活跃度</option>
            </select>
          </div>
        </div>
        
        {/* 用户网格 */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {displayUsers.map((user) => {
              const userLevel = getUserLevel(user.score || 0)
              return (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => handleUserClick(user)}
                >
                  {/* 头像 */}
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
                      {user.avatar || user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    
                    {/* 用户名 */}
                    <h3 className="font-bold text-gray-900 mb-1 text-base">{user.name}</h3>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-1">{user.major}</p>
                    
                    {/* 等级徽章 */}
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <span className="px-2.5 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-bold">
                        LV{user.level || 1}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {formatNumber(user.score || 0)}分
                      </span>
                    </div>
                  </div>
                  
                  {/* 统计 */}
                  <div className="flex items-center justify-around py-3 border-t border-gray-100 mb-3">
                    <div className="text-center">
                      <div className="text-sm font-extrabold text-gray-900">{formatNumber(user.followersCount || 0)}</div>
                      <div className="text-[10px] text-gray-500">粉丝</div>
                    </div>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="text-center">
                      <div className="text-sm font-extrabold text-gray-900">{formatNumber(user.postsCount || 0)}</div>
                      <div className="text-[10px] text-gray-500">帖子</div>
                    </div>
                  </div>
                  
                  {/* 关注按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFollow(user.id, user.isFollowing)
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                      user.isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                    }`}
                  >
                    {user.isFollowing ? '已关注' : '+ 关注'}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          // 列表视图
          <div className="space-y-3">
            {displayUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => handleUserClick(user)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-2xl shadow-md">
                      {user.avatar || user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base mb-1">{user.name}</h3>
                      <p className="text-xs text-gray-600 mb-2">{user.major}</p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="font-medium">LV{user.level}</span>
                        <span>·</span>
                        <span>{formatNumber(user.followersCount || 0)} 粉丝</span>
                        <span>·</span>
                        <span>{formatNumber(user.postsCount || 0)} 帖子</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFollow(user.id, user.isFollowing)
                    }}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                      user.isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                    }`}
                  >
                    {user.isFollowing ? '已关注' : '+ 关注'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 加载更多 */}
        {hasMore && displayUsers.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-8 py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-2xl font-bold hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
        
        {/* 空状态 */}
        {displayUsers.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="text-7xl mb-6">👥</div>
            <p className="text-xl font-bold text-gray-900 mb-2">暂无用户</p>
            <p className="text-gray-500">快来成为第一个加入的成员吧！</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default CommunityPage
