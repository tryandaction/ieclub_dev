/**
 * IEClub 个人中心页面 - Taro版本
 * 支持小程序和H5
 */
import React from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import MainLayout from '../../components/layout/MainLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useAuthStore } from '../../store/authStore'
import { getUserLevel } from '../../utils'

const ProfilePage = () => {
  const { user, logout } = useAuthStore()
  
  // 模拟用户数据
  const userData = {
    id: 1,
    name: '张明',
    avatar: '👨‍💻',
    school: '南方科技大学',
    major: '计算机科学与工程系',
    grade: '大三',
    level: 12,
    score: 1420,
    postsCount: 23,
    followersCount: 89,
    followingCount: 45,
    likesCount: 156,
    ...user
  }
  
  const userLevel = getUserLevel(userData.score)
  
  // 菜单项
  const menuItems = [
    { emoji: '📝', label: '我的帖子', path: '/my-posts', count: userData.postsCount },
    { emoji: '💬', label: '我的话题', path: '/my-topics', count: 8 },
    { emoji: '📅', label: '我的活动', path: '/my-activities', count: 15 },
    { emoji: '⭐', label: '我的收藏', path: '/my-bookmarks', count: 32 },
    { emoji: '🏆', label: '我的徽章', path: '/my-badges', count: 5 },
    { emoji: '⚙️', label: '设置', path: '/settings' },
    { emoji: '❓', label: '帮助与反馈', path: '/help' }
  ]
  
  // 菜单点击
  const handleMenuClick = (item) => {
    Taro.showToast({
      title: item.label,
      icon: 'none'
    })
  }
  
  // 编辑资料
  const handleEditProfile = () => {
    Taro.showToast({
      title: '编辑资料',
      icon: 'none'
    })
  }
  
  // 退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '您确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  }
  
  return (
    <MainLayout title="我的" showSearch={false}>
      <View className="w-full mx-auto px-3 py-4 lg:px-8 lg:py-6">
        <View className="max-w-4xl mx-auto space-y-4">
          {/* 用户信息卡片 */}
          <View className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-3xl text-white shadow-2xl shadow-purple-500/30 overflow-hidden">
            <View className="relative text-center py-8 px-6">
              {/* 装饰性背景 */}
              <View className="absolute inset-0 opacity-10">
                <View className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></View>
                <View className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl"></View>
              </View>
              
              {/* 头像 */}
              <View className="relative w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 backdrop-blur-sm border-4 border-white/30 shadow-xl">
                <Text>{userData.avatar}</Text>
              </View>
              
              {/* 用户信息 */}
              <View className="relative">
                <Text className="text-2xl font-extrabold mb-3 drop-shadow-lg block text-white">{userData.name}</Text>
                <Text className="text-white opacity-95 mb-1.5 font-medium block">
                  {userData.school} · {userData.major}
                </Text>
                <Text className="text-white opacity-85 text-sm mb-4 font-medium block">
                  {userData.grade}
                </Text>
                
                {/* 等级和积分 */}
                <View className="flex items-center justify-center space-x-6 mb-4">
                  <View className="text-center">
                    <Text className="text-xl font-extrabold drop-shadow-lg block text-white">LV{userData.level}</Text>
                    <Text className="text-xs text-white opacity-80 font-medium block">{userLevel.name}</Text>
                  </View>
                  <View className="w-px h-10 bg-white/30"></View>
                  <View className="text-center">
                    <Text className="text-xl font-extrabold drop-shadow-lg block text-white">{userData.score}</Text>
                    <Text className="text-xs text-white opacity-80 font-medium block">积分</Text>
                  </View>
                </View>
              </View>
              
              {/* 编辑按钮 */}
              <View className="relative mt-6">
                <View
                  onClick={handleEditProfile}
                  className="px-6 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white rounded-full font-bold text-sm hover:bg-white/30 transition-all duration-300 shadow-lg inline-block"
                >
                  <Text className="text-white">✏️ 编辑资料</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* 统计数据 */}
          <Card>
            <View className="grid grid-cols-4 gap-4 py-4">
              <View className="text-center">
                <Text className="text-2xl font-bold text-purple-600 block">{userData.postsCount}</Text>
                <Text className="text-sm text-gray-600 block">帖子</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-purple-600 block">{userData.followersCount}</Text>
                <Text className="text-sm text-gray-600 block">粉丝</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-purple-600 block">{userData.followingCount}</Text>
                <Text className="text-sm text-gray-600 block">关注</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-purple-600 block">{userData.likesCount}</Text>
                <Text className="text-sm text-gray-600 block">获赞</Text>
              </View>
            </View>
          </Card>
          
          {/* 菜单列表 */}
          <View className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {menuItems.map((item, index) => (
              <View key={index}>
                <View
                  onClick={() => handleMenuClick(item)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 group"
                >
                  <View className="flex items-center">
                    <Text className="text-2xl mr-4 transform group-hover:scale-110 transition-transform duration-300">{item.emoji}</Text>
                    <Text className="text-gray-800 font-bold text-[15px]">{item.label}</Text>
                    {item.count !== undefined && (
                      <View className="ml-2 px-2 py-0.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                        <Text className="text-xs font-bold text-purple-700">{item.count}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-400 text-lg">›</Text>
                </View>
                {index < menuItems.length - 1 && (
                  <View className="ml-16 mr-5 h-px bg-gray-100"></View>
                )}
              </View>
            ))}
          </View>
          
          {/* 退出登录 */}
          <View className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <View
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-5 hover:bg-red-50 transition-all duration-300"
            >
              <Text className="text-red-500 font-bold text-[15px]">退出登录</Text>
            </View>
          </View>
        </View>
      </View>
    </MainLayout>
  )
}

export default ProfilePage
