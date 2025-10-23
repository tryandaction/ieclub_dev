// ==================== 个人中心页面（增强版） ====================

import { View, Image, Text, Button } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/user'
import { getUserStats } from '@/services/user'
import './index.scss'

// 获取API基础URL
function getApiBaseUrl(): string {
  const env = Taro.getEnv()
  
  switch (env) {
    case 'WEAPP':
      return 'https://api.ieclub.online/api'
    case 'H5':
      return '/api'
    case 'RN':
      return 'https://api.ieclub.online/api'
    default:
      return 'http://localhost:3000/api'
  }
}

export default function ProfilePage() {
  const { userInfo, isLogin, logout } = useUserStore()
  const [stats, setStats] = useState({
    topicsCount: 0,
    commentsCount: 0,
    likesCount: 0,
    followersCount: 0,
    followingCount: 0
  })
  const [unreadCount, setUnreadCount] = useState(0)

  const loadStats = useCallback(async () => {
    if (!userInfo) return

    try {
      const data = await getUserStats(userInfo.id)
      setStats(data)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }, [userInfo])

  const loadUnreadCount = useCallback(async () => {
    if (!userInfo) return

    try {
      const token = Taro.getStorageSync('token')
      if (!token) return

      const res = await Taro.request({
        url: `${getApiBaseUrl()}/notifications/unread-count`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.data.success) {
        setUnreadCount(res.data.data.count || 0)
      }
    } catch (error) {
      console.error('加载未读消息数失败:', error)
    }
  }, [userInfo])

  useEffect(() => {
    if (isLogin && userInfo) {
      loadStats()
      loadUnreadCount()
    }
  }, [isLogin, userInfo, loadStats, loadUnreadCount])

  // 设置当前 TabBar 选中项 - 在小程序中通常自动管理
  useEffect(() => {
    // TabBar选中状态在小程序环境中由框架自动管理
    // 这里可以添加其他页面初始化逻辑
    console.log('个人中心页面加载完成');
  }, [])

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

  const goToNotifications = () => {
    Taro.navigateTo({ url: '/pages/notifications/index' })
  }

  const goToMyTopics = () => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }

  const goToMyBookmarks = () => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }

  const goToMyComments = () => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }

  const goToSettings = () => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }

  const goToHelp = () => {
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
        <View className='menu-item' onClick={goToNotifications}>
          <View className='menu-icon'>🔔</View>
          <Text className='menu-label'>消息通知</Text>
          {unreadCount > 0 && (
            <View className='unread-badge'>{unreadCount}</View>
          )}
          <View className='menu-arrow'>›</View>
        </View>
        <View className='menu-item' onClick={goToMyTopics}>
          <View className='menu-icon'>📝</View>
          <Text className='menu-label'>我的话题</Text>
          <View className='menu-arrow'>›</View>
        </View>
        <View className='menu-item' onClick={goToMyBookmarks}>
          <View className='menu-icon'>❤️</View>
          <Text className='menu-label'>我的收藏</Text>
          <View className='menu-arrow'>›</View>
        </View>
        <View className='menu-item' onClick={goToMyComments}>
          <View className='menu-icon'>💬</View>
          <Text className='menu-label'>我的评论</Text>
          <View className='menu-arrow'>›</View>
        </View>
      </View>

      <View className='menu-section'>
        <View className='menu-item' onClick={goToSettings}>
          <View className='menu-icon'>⚙️</View>
          <Text className='menu-label'>设置</Text>
          <View className='menu-arrow'>›</View>
        </View>
        <View className='menu-item' onClick={goToHelp}>
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