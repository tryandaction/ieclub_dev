/**
 * IEClub 个人中心页面
 * 展示用户信息、统计数据、菜单等
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../components/layout/MainLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Icon from '../../components/common/Icon'
import { useAuthStore } from '../../store/authStore'
import { getUserLevel } from '../../utils'

const ProfilePage = () => {
  const navigate = useNavigate()
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
      icon: 'mdi:post',
      label: '我的帖子',
      path: '/my-posts',
      count: userData.postsCount
    },
    {
      icon: 'mdi:teach',
      label: '我的话题',
      path: '/my-topics',
      count: 8
    },
    {
      icon: 'mdi:calendar-star',
      label: '我的活动',
      path: '/my-activities',
      count: 15
    },
    {
      icon: 'mdi:bookmark-check',
      label: '我的收藏',
      path: '/my-bookmarks',
      count: 32
    },
    {
      icon: 'mdi:trophy',
      label: '我的成就',
      path: '/my-achievements',
      count: 12
    },
    {
      icon: 'mdi:cog',
      label: '设置',
      path: '/settings'
    }
  ]
  
  // 处理菜单点击
  const handleMenuClick = (item) => {
    if (item.path) {
      navigate(item.path)
    }
  }
  
  // 处理编辑资料
  const handleEditProfile = () => {
    navigate('/edit-profile')
  }
  
  // 处理登出
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  return (
    <MainLayout title="我的" showSearch={false}>
      <div className="p-4 space-y-4">
        {/* 用户信息卡片 */}
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="text-center py-6">
            {/* 头像 */}
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              {userData.avatar}
            </div>
            
            {/* 用户信息 */}
            <h2 className="text-2xl font-bold mb-2">{userData.name}</h2>
            <p className="text-white text-opacity-90 mb-1">
              {userData.school} · {userData.major}
            </p>
            <p className="text-white text-opacity-80 text-sm mb-4">
              {userData.grade}
            </p>
            
            {/* 等级和积分 */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold">LV{userData.level}</div>
                <div className="text-xs text-white text-opacity-80">{userLevel.name}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{userData.score}</div>
                <div className="text-xs text-white text-opacity-80">积分</div>
              </div>
            </div>
            
            {/* 编辑按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditProfile}
              className="bg-white bg-opacity-20 border-white text-white hover:bg-opacity-30"
            >
              <Icon icon="mdi:pencil" size="sm" className="mr-2" />
              编辑资料
            </Button>
          </div>
        </Card>
        
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
        <Card padding="none">
          {menuItems.map((item, index) => (
            <div key={index}>
              <button
                onClick={() => handleMenuClick(item)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <Icon 
                    icon={item.icon} 
                    size="lg" 
                    color="#6b7280" 
                    className="mr-3" 
                  />
                  <span className="text-gray-800 font-medium">{item.label}</span>
                  {item.count !== undefined && (
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {item.count}
                    </span>
                  )}
                </div>
                <Icon 
                  icon="mdi:chevron-right" 
                  size="sm" 
                  color="#9ca3af" 
                />
              </button>
              {index < menuItems.length - 1 && (
                <div className="border-b border-gray-100 mx-4"></div>
              )}
            </div>
          ))}
        </Card>
        
        {/* 登出按钮 */}
        <Button
          variant="danger"
          className="w-full"
          onClick={handleLogout}
        >
          <Icon icon="mdi:logout" size="sm" className="mr-2" />
          退出登录
        </Button>
      </div>
    </MainLayout>
  )
}

export default ProfilePage
