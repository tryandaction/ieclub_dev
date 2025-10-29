/**
 * IEClub 个人中心页面
 * 展示用户信息、统计数据、菜单等
 */
import React from 'react'
import Taro from '@tarojs/taro'
import { View } from '@tarojs/components'
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
    {
      emoji: '📝',
      label: '我的帖子',
      path: '/my-posts',
      count: userData.postsCount
    },
    {
      emoji: '💬',
      label: '我的话题',
      path: '/my-topics',
      count: 8
    },
    {
      emoji: '📅',
      label: '我的活动',
      path: '/my-activities',
      count: 15
    },
    {
      emoji: '⭐',
      label: '我的收藏',
      path: '/my-bookmarks',
      count: 32
    },
    {
      emoji: '🏆',
      label: '我的成就',
      path: '/my-achievements',
      count: 12
    },
    {
      emoji: '⚙️',
      label: '设置',
      path: '/settings'
    }
  ]
  
  // 处理菜单点击
  const handleMenuClick = (item) => {
    if (item.path) {
      Taro.showToast({
        title: `跳转到${item.label}`,
        icon: 'none'
      })
      // TODO: 实现页面跳转
      // Taro.navigateTo({ url: item.path })
    }
  }
  
  // 处理编辑资料
  const handleEditProfile = () => {
    Taro.showToast({
      title: '编辑资料功能开发中',
      icon: 'none'
    })
  }
  
  // 处理登出
  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
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
      <div className="max-w-screen-2xl mx-auto p-4 lg:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
        {/* 用户信息卡片 */}
        <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-3xl text-white shadow-2xl shadow-purple-500/30 overflow-hidden">
          <div className="relative text-center py-8 px-6">
            {/* 装饰性背景 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl"></div>
            </div>
            
            {/* 头像 */}
            <div className="relative w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 backdrop-blur-sm border-4 border-white/30 shadow-xl">
              {userData.avatar}
            </div>
            
            {/* 用户信息 */}
            <div className="relative">
              <h2 className="text-2xl font-extrabold mb-3 drop-shadow-lg">{userData.name}</h2>
              <p className="text-white opacity-95 mb-1.5 font-medium">
                {userData.school} · {userData.major}
              </p>
              <p className="text-white opacity-85 text-sm mb-4 font-medium">
                {userData.grade}
              </p>
              
              {/* 等级和积分 */}
              <div className="flex items-center justify-center space-x-6 mb-4">
                <div className="text-center">
                  <div className="text-xl font-extrabold drop-shadow-lg">LV{userData.level}</div>
                  <div className="text-xs text-white opacity-80 font-medium">{userLevel.name}</div>
                </div>
                <div className="w-px h-10 bg-white/30"></div>
                <div className="text-center">
                  <div className="text-xl font-extrabold drop-shadow-lg">{userData.score}</div>
                  <div className="text-xs text-white opacity-80 font-medium">积分</div>
                </div>
              </div>
            </div>
            
            {/* 编辑按钮 */}
            <div className="relative mt-6">
              <button
                onClick={handleEditProfile}
                className="px-6 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white rounded-full font-bold text-sm hover:bg-white/30 transition-all duration-300 shadow-lg"
              >
                ✏️ 编辑资料
              </button>
            </div>
          </div>
        </div>
        
        {/* 统计数据 */}
        <Card>
          <div className="grid grid-cols-4 gap-4 py-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userData.postsCount}</div>
              <div className="text-sm text-gray-600">帖子</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userData.followersCount}</div>
              <div className="text-sm text-gray-600">粉丝</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userData.followingCount}</div>
              <div className="text-sm text-gray-600">关注</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userData.likesCount}</div>
              <div className="text-sm text-gray-600">获赞</div>
            </div>
          </div>
        </Card>
        
        {/* 菜单列表 */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <div key={index}>
              <button
                onClick={() => handleMenuClick(item)}
                className="w-full flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 group"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-4 transform group-hover:scale-110 transition-transform duration-300">{item.emoji}</span>
                  <span className="text-gray-800 font-bold text-[15px]">{item.label}</span>
                  {item.count !== undefined && (
                    <span className="ml-3 px-2.5 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs rounded-full font-bold">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="text-gray-300 text-2xl group-hover:text-purple-500 transition-colors">›</span>
              </button>
              {index < menuItems.length - 1 && (
                <div className="border-b border-gray-50 mx-5"></div>
              )}
            </div>
          ))}
        </div>
        
        {/* 登出按钮 */}
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300"
        >
          🚪 退出登录
        </button>
        </div>
      </div>
    </MainLayout>
  )
}

export default ProfilePage
