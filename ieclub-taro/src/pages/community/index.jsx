/**
 * IEClub 社区页面
 * 展示用户列表、排行榜等
 */
import React, { useState, useEffect } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Icon from '../../components/common/Icon'
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
  
  // 页面加载时获取用户
  useEffect(() => {
    fetchUsers(true)
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
    console.log('点击用户:', user.name)
    // TODO: 跳转到用户详情页
  }
  
  // 筛选和排序用户
  const sortedUsers = [...users].sort((a, b) => {
    switch (sortBy) {
      case 'level':
        return b.level - a.level
      case 'followers':
        return b.followersCount - a.followersCount
      case 'activity':
        return b.activityScore - a.activityScore
      default:
        return 0
    }
  })
  
  return (
    <MainLayout title="社区">
      <div className="p-4 space-y-4">
        {/* 筛选栏 */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Icon icon="mdi:view-grid" size="sm" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <Icon icon="mdi:view-list" size="sm" />
              </Button>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="level">按等级</option>
              <option value="followers">按粉丝数</option>
              <option value="activity">按活跃度</option>
            </select>
          </div>
        </Card>
        
        {/* 用户列表 */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4">
            {sortedUsers.map((user) => {
              const userLevel = getUserLevel(user.score || 0)
              return (
                <Card
                  key={user.id}
                  className="text-center hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => handleUserClick(user)}
                >
                  {/* 头像 */}
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xl font-semibold mx-auto mb-3">
                    {user.avatar || user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  
                  {/* 用户信息 */}
                  <h3 className="font-semibold text-gray-800 mb-1">{user.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{user.major}</p>
                  
                  {/* 等级和积分 */}
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
                      LV{user.level || 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatNumber(user.score || 0)}分
                    </span>
                  </div>
                  
                  {/* 统计信息 */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{formatNumber(user.followersCount || 0)}粉丝</span>
                    <span>{formatNumber(user.postsCount || 0)}帖子</span>
                  </div>
                  
                  {/* 关注按钮 */}
                  <Button
                    variant={user.isFollowing ? 'secondary' : 'primary'}
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFollow(user.id, user.isFollowing)
                    }}
                  >
                    {user.isFollowing ? '已关注' : '关注'}
                  </Button>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedUsers.map((user) => {
              const userLevel = getUserLevel(user.score || 0)
              return (
                <Card
                  key={user.id}
                  className="flex items-center p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => handleUserClick(user)}
                >
                  {/* 头像 */}
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    {user.avatar || user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  
                  {/* 用户信息 */}
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h3 className="font-semibold text-gray-800 mr-2">{user.name}</h3>
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
                        LV{user.level || 1}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{user.major}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatNumber(user.followersCount || 0)}粉丝</span>
                      <span>{formatNumber(user.postsCount || 0)}帖子</span>
                      <span>{formatNumber(user.score || 0)}积分</span>
                    </div>
                  </div>
                  
                  {/* 关注按钮 */}
                  <Button
                    variant={user.isFollowing ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFollow(user.id, user.isFollowing)
                    }}
                  >
                    {user.isFollowing ? '已关注' : '关注'}
                  </Button>
                </Card>
              )
            })}
          </div>
        )}
        
        {/* 加载更多 */}
        {hasMore && (
          <div className="text-center">
            <Button
              variant="outline"
              loading={isLoading}
              onClick={handleLoadMore}
              className="w-full"
            >
              {isLoading ? '加载中...' : '加载更多'}
            </Button>
          </div>
        )}
        
        {/* 空状态 */}
        {!isLoading && sortedUsers.length === 0 && (
          <div className="text-center py-12">
            <Icon icon="mdi:account-group-outline" size="2xl" color="#9ca3af" className="mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">暂无用户</p>
            <p className="text-gray-400 text-sm">快来发现更多有趣的用户吧！</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default CommunityPage
