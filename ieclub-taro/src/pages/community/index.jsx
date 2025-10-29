/**
 * IEClub 社区页面 - Taro版本
 * 支持小程序和H5
 */
import React, { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image, Picker } from '@tarojs/components'
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
  const [sortBy, setSortBy] = useState(0) // 0: latest, 1: hot
  const [posts, setPosts] = useState([])
  
  const sortOptions = ['最新', '最热']
  
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
    }
  ]
  
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
    }
  ]
  
  useEffect(() => {
    setPosts(mockPosts)
  }, [])
  
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
      <View className="w-full mx-auto px-3 py-4 lg:px-8 lg:py-6">
        {/* 欢迎横幅 */}
        <View className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-3xl p-6 lg:p-8 mb-6 text-white shadow-2xl shadow-purple-500/30 overflow-hidden relative">
          <View className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></View>
          <View className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></View>
          <View className="relative">
            <Text className="text-2xl lg:text-3xl font-extrabold mb-2 block text-white">发现志同道合的伙伴 👋</Text>
            <Text className="text-sm lg:text-base opacity-90 block text-white">连接思想 · 激发创新 · 共同成长</Text>
          </View>
        </View>

        {/* 视图切换和筛选 */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
          <View className="flex items-center justify-between flex-wrap gap-3">
            {/* 视图切换 */}
            <View className="flex items-center space-x-2">
              <View
                onClick={() => setViewMode('posts')}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  viewMode === 'posts'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Text className={viewMode === 'posts' ? 'text-white' : 'text-gray-700'}>帖子</Text>
              </View>
              <View
                onClick={() => setViewMode('users')}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  viewMode === 'users'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Text className={viewMode === 'users' ? 'text-white' : 'text-gray-700'}>用户</Text>
              </View>
            </View>
            
            {/* 排序 */}
            <Picker
              mode="selector"
              range={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.detail.value)}
            >
              <View className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium">
                <Text>{sortOptions[sortBy]}</Text>
              </View>
            </Picker>
          </View>
        </View>
        
        {/* 帖子视图 - Flex布局 */}
        {viewMode === 'posts' && (
          <View className="flex flex-row flex-wrap -mx-2">
            {posts.map((post) => (
              <View key={post.id} className="w-1/2 lg:w-1/4 px-2 mb-4">
                <View
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => handlePostClick(post)}
                >
                {/* 头部 - 用户信息 */}
                <View className="flex items-center justify-between mb-3">
                  <View className="flex items-center space-x-2">
                    <View className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-lg">
                      <Text>{post.avatar}</Text>
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-bold text-gray-900 truncate block">{post.author}</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-400 whitespace-nowrap">{post.time}</Text>
                </View>
                
                {/* 内容 - 3行截断 */}
                <Text className="text-sm text-gray-700 mb-4 line-clamp-3 leading-relaxed block">
                  {post.content}
                </Text>
                
                {/* 底部 - 点赞评论 */}
                <View className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <View
                    onClick={(e) => handleLikePost(e, post.id)}
                    className={`flex items-center space-x-1 transition-all duration-300 ${
                      post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Text className="text-base">{post.isLiked ? '❤️' : '🤍'}</Text>
                    <Text className="text-sm font-medium">{post.likes}</Text>
                  </View>
                  <View className="flex items-center space-x-1 text-gray-500">
                    <Text className="text-base">💬</Text>
                    <Text className="text-sm font-medium">{post.comments}</Text>
                  </View>
                </View>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* 用户视图 - Flex布局 */}
        {viewMode === 'users' && (
          <View className="flex flex-row flex-wrap -mx-1.5">
            {displayUsers.map((user) => (
              <View key={user.id} className="w-1/2 lg:w-1/3 px-1.5 mb-3">
                <View
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => handleUserClick(user)}
                >
                {/* 头像 */}
                <View className="text-center mb-4">
                  <View className="w-20 h-20 bg-gradient-to-br from-purple-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
                    <Text>{user.avatar}</Text>
                  </View>
                  
                  {/* 用户名 */}
                  <Text className="font-bold text-gray-900 mb-1 text-base block">{user.name}</Text>
                  <Text className="text-xs text-gray-600 mb-3 line-clamp-1 block">{user.major}</Text>
                  
                  {/* 等级徽章 */}
                  <View className="flex items-center justify-center space-x-2 mb-3">
                    <View className="px-2.5 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full">
                      <Text className="text-xs font-bold text-purple-700">LV{user.level || 1}</Text>
                    </View>
                    <Text className="text-xs text-gray-500 font-medium">
                      {formatNumber(user.score || 0)}分
                    </Text>
                  </View>
                </View>
                
                {/* 统计 */}
                <View className="flex items-center justify-around py-3 border-t border-gray-100 mb-3">
                  <View className="text-center">
                    <Text className="text-sm font-extrabold text-gray-900 block">{formatNumber(user.followersCount || 0)}</Text>
                    <Text className="text-[10px] text-gray-500 block">粉丝</Text>
                  </View>
                  <View className="w-px h-6 bg-gray-200"></View>
                  <View className="text-center">
                    <Text className="text-sm font-extrabold text-gray-900 block">{formatNumber(user.postsCount || 0)}</Text>
                    <Text className="text-[10px] text-gray-500 block">帖子</Text>
                  </View>
                </View>
                
                {/* 关注按钮 */}
                <View
                  onClick={(e) => handleFollow(e, user.id, user.isFollowing)}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-300 text-center ${
                    user.isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                  }`}
                >
                  <Text className={user.isFollowing ? 'text-gray-700' : 'text-white'}>
                    {user.isFollowing ? '已关注' : '+ 关注'}
                  </Text>
                </View>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* 空状态 */}
        {((viewMode === 'posts' && posts.length === 0) || (viewMode === 'users' && displayUsers.length === 0)) && !isLoading && (
          <View className="text-center py-20">
            <Text className="text-7xl mb-6 block">{viewMode === 'posts' ? '💬' : '👥'}</Text>
            <Text className="text-xl font-bold text-gray-900 mb-2 block">暂无内容</Text>
            <Text className="text-gray-500 block">快来成为第一个吧！</Text>
          </View>
        )}
      </View>
    </MainLayout>
  )
}

export default CommunityPage
