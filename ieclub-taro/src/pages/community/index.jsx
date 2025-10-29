/**
 * IEClub 社区页面
 * 按文档设计 - 帖子卡片瀑布流布局
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
  
  const [viewMode, setViewMode] = useState('posts') // posts | users
  const [sortBy, setSortBy] = useState('latest') // latest | hot
  
  // 模拟帖子数据
  const mockPosts = [
    {
      id: 1,
      author: '张明',
      avatar: '👨‍💻',
      major: '计算机科学与工程系',
      time: '2小时前',
      content: '寻找对AI+教育感兴趣的小伙伴，我正在做一个基于大模型的个性化学习助手项目，需要志同道合的队友一起探索...',
      likes: 23,
      comments: 8,
      isLiked: false
    },
    {
      id: 2,
      author: '李思',
      avatar: '👩‍🔬',
      major: '生物医学工程系',
      time: '5小时前',
      content: '分享一个Python学习路径，适合生物医学背景的同学。从基础语法到数据分析，再到生物信息学应用，内容很全面！',
      likes: 45,
      comments: 15,
      isLiked: true
    },
    {
      id: 3,
      author: '王浩',
      avatar: '🧑‍🎨',
      major: '工业设计',
      time: '1天前',
      content: '【资源分享】超全UI设计工具合集！从Figma到Sketch，从原型到动效，设计师必备的工具都在这里了',
      likes: 67,
      comments: 22,
      isLiked: false
    },
    {
      id: 4,
      author: '刘强',
      avatar: '👨‍💼',
      major: '数据科学与大数据技术',
      time: '3小时前',
      content: '求推荐好用的数据可视化库，最近在做数据分析项目，需要制作交互式图表，有经验的同学分享一下吧',
      likes: 12,
      comments: 5,
      isLiked: false
    },
    {
      id: 5,
      author: '陈佳',
      avatar: '👩‍💻',
      major: '软件工程',
      time: '6小时前',
      content: '有没有人一起学习机器学习算法？可以组建学习小组，一起刷题、做项目、分享心得',
      likes: 34,
      comments: 12,
      isLiked: false
    },
    {
      id: 6,
      author: '林浩',
      avatar: '👨‍🎓',
      major: '电子工程',
      time: '1天前',
      content: '推荐几个好的在线编程平台，LeetCode、牛客、洛谷都很不错，大家还用过哪些？',
      likes: 28,
      comments: 8,
      isLiked: true
    }
  ]
  
  const [posts, setPosts] = useState(mockPosts)
  
  // 模拟用户数据
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
    }
  ]
  
  const displayUsers = users.length > 0 ? users : mockUsers
  
  // 帖子点击
  const handlePostClick = (post) => {
    Taro.showToast({
      title: `查看帖子详情`,
      icon: 'none'
    })
  }
  
  // 点赞帖子
  const handleLikePost = (e, postId) => {
    e.stopPropagation()
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        }
      }
      return post
    }))
  }
  
  // 用户点击
  const handleUserClick = (user) => {
    Taro.showToast({
      title: `查看${user.name}的主页`,
      icon: 'none'
    })
  }
  
  // 关注用户
  const handleFollow = async (e, userId, isFollowing) => {
    e.stopPropagation()
    if (isFollowing) {
      await unfollowUser(userId)
    } else {
      await followUser(userId)
    }
  }
  
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

        {/* 视图切换和筛选 */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* 视图切换 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('posts')}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  viewMode === 'posts'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                帖子
              </button>
              <button
                onClick={() => setViewMode('users')}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  viewMode === 'users'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                用户
              </button>
            </div>
            
            {/* 排序 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="latest">最新</option>
              <option value="hot">最热</option>
            </select>
          </div>
        </div>
        
        {/* 帖子视图 */}
        {viewMode === 'posts' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => handlePostClick(post)}
              >
                {/* 头部 - 用户信息 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-lg">
                      {post.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{post.author}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{post.time}</span>
                </div>
                
                {/* 内容 - 3行截断 */}
                <p className="text-sm text-gray-700 mb-4 line-clamp-3 leading-relaxed">
                  {post.content}
                </p>
                
                {/* 底部 - 点赞评论 */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => handleLikePost(e, post.id)}
                    className={`flex items-center space-x-1 transition-all duration-300 ${
                      post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <span className="text-base">{post.isLiked ? '❤️' : '🤍'}</span>
                    <span className="text-sm font-medium">{post.likes}</span>
                  </button>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <span className="text-base">💬</span>
                    <span className="text-sm font-medium">{post.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 用户视图 */}
        {viewMode === 'users' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {displayUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => handleUserClick(user)}
              >
                {/* 头像 */}
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
                    {user.avatar}
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
                  onClick={(e) => handleFollow(e, user.id, user.isFollowing)}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    user.isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                  }`}
                >
                  {user.isFollowing ? '已关注' : '+ 关注'}
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* 空状态 */}
        {((viewMode === 'posts' && posts.length === 0) || (viewMode === 'users' && displayUsers.length === 0)) && !isLoading && (
          <div className="text-center py-20">
            <div className="text-7xl mb-6">{viewMode === 'posts' ? '💬' : '👥'}</div>
            <p className="text-xl font-bold text-gray-900 mb-2">暂无内容</p>
            <p className="text-gray-500">快来成为第一个吧！</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default CommunityPage
