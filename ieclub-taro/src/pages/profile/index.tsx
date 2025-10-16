// ==================== 个人中心页面（增强版） ====================

import { View, Image, Text, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../store/user'
import { getUserStats } from '../../services/user'
import './index.scss'

export default function ProfilePage() {
  const { userInfo, isLogin, logout } = useUserStore()
  const [stats, setStats] = useState({
    topicsCount: 0,
    commentsCount: 0,
    likesCount: 0,
    followersCount: 0,
    followingCount: 0
  })

  const loadStats = async () => {
    if (!userInfo) return

    try {
      const data = await getUserStats(userInfo.id)
      setStats(data)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  useEffect(() => {
    if (isLogin && userInfo) {
      loadStats()
    }
  }, [isLogin, userInfo, loadStats])

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
        }
      }
    })
  }

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const goToEdit = () => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }

  if (!isLogin || !userInfo) {
    return (
      <View className='profile-page'>
        <View className='not-login'>
          <View className='icon'>👤</View>
          <Text className='text'>请先登录</Text>
          <Button className='login-btn' onClick={goToLogin}>
            立即登录
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className='profile-page'>
      {/* 用户信息卡片 */}
      <View className='user-card'>
        <View className='card-bg'></View>
        <View className='user-info'>
          <Image className='avatar' src={userInfo.avatar} mode='aspectFill' />
          <View className='info'>
            <Text className='nickname'>{userInfo.nickname}</Text>
            <Text className='bio'>{userInfo.bio || '这个人很懒，什么都没写~'}</Text>
          </View>
          <View className='edit-btn' onClick={goToEdit}>
            编辑
          </View>
        </View>

        {/* 统计数据 */}
        <View className='stats'>
          <View className='stat-item'>
            <Text className='value'>{stats.topicsCount}</Text>
            <Text className='label'>话题</Text>
          </View>
          <View className='stat-item'>
            <Text className='value'>{stats.likesCount}</Text>
            <Text className='label'>获赞</Text>
          </View>
          <View className='stat-item'>
            <Text className='value'>{stats.followersCount}</Text>
            <Text className='label'>粉丝</Text>
          </View>
          <View className='stat-item'>
            <Text className='value'>{stats.followingCount}</Text>
            <Text className='label'>关注</Text>
          </View>
        </View>
      </View>

      {/* 功能菜单 */}
      <View className='menu-section'>
        <View className='menu-item'>
          <View className='menu-icon'>📝</View>
          <Text className='menu-label'>我的话题</Text>
          <View className='menu-arrow'>›</View>
        </View>
        <View className='menu-item'>
          <View className='menu-icon'>❤️</View>
          <Text className='menu-label'>我的收藏</Text>
          <View className='menu-arrow'>›</View>
        </View>
        <View className='menu-item'>
          <View className='menu-icon'>💬</View>
          <Text className='menu-label'>我的评论</Text>
          <View className='menu-arrow'>›</View>
        </View>
      </View>

      <View className='menu-section'>
        <View className='menu-item'>
          <View className='menu-icon'>⚙️</View>
          <Text className='menu-label'>设置</Text>
          <View className='menu-arrow'>›</View>
        </View>
        <View className='menu-item'>
          <View className='menu-icon'>❓</View>
          <Text className='menu-label'>帮助与反馈</Text>
          <View className='menu-arrow'>›</View>
        </View>
      </View>

      {/* 退出登录 */}
      <View className='logout-section'>
        <Button className='logout-btn' onClick={handleLogout}>
          退出登录
        </Button>
      </View>
    </View>
  )
}