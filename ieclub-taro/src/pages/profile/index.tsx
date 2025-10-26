import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Profile() {
  const [user, setUser] = useState({
    nickname: '游客',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
    credits: 0,
    level: 1,
    followingCount: 0,
    followersCount: 0,
    topicsCount: 0
  })

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    const token = Taro.getStorageSync('token')
    if (!token) {
      return
    }
    // TODO: 加载用户信息
  }

  const goToNotifications = () => {
    Taro.navigateTo({ url: '/pages/notifications/index' })
  }

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const menuItems = [
    { icon: 'mdi:heart-outline', text: '我的收藏', url: '/pages/profile/bookmarks/index' },
    { icon: 'mdi:history', text: '浏览历史', url: '/pages/profile/history/index' },
    { icon: 'mdi:calendar-check', text: '我的活动', url: '/pages/profile/activities/index' },
    { icon: 'mdi:account-edit', text: '编辑资料', url: '/pages/profile/edit/index' },
    { icon: 'mdi:cog-outline', text: '设置', url: '/pages/profile/settings/index' },
    { icon: 'mdi:help-circle-outline', text: '帮助与反馈', url: '/pages/profile/help/index' }
  ]

  return (
    <View className='profile-page'>
      <View className='nav-bar'>
        <Text className='title'>我的</Text>
        <View className='nav-right'>
          <View className='nav-icon' onClick={goToNotifications}>
            <View className='iconify-icon' data-icon='mdi:bell-outline' />
            <View className='badge'>5</View>
          </View>
        </View>
      </View>

      <View className='user-card'>
        <View className='user-info'>
          <Image 
            src={user.avatar} 
            className='avatar'
            mode='aspectFill'
          />
          <View className='info'>
            <Text className='nickname'>{user.nickname}</Text>
            <View className='level'>
              <View className='iconify-icon' data-icon='mdi:star' />
              <Text>LV{user.level}</Text>
            </View>
          </View>
          <View className='login-btn' onClick={goToLogin}>
            <Text>登录</Text>
          </View>
        </View>

        <View className='stats'>
          <View className='stat-item'>
            <Text className='number'>{user.topicsCount}</Text>
            <Text className='label'>话题</Text>
          </View>
          <View className='divider' />
          <View className='stat-item'>
            <Text className='number'>{user.followingCount}</Text>
            <Text className='label'>关注</Text>
          </View>
          <View className='divider' />
          <View className='stat-item'>
            <Text className='number'>{user.followersCount}</Text>
            <Text className='label'>粉丝</Text>
          </View>
          <View className='divider' />
          <View className='stat-item'>
            <Text className='number'>{user.credits}</Text>
            <Text className='label'>积分</Text>
          </View>
        </View>
      </View>

      <View className='menu-list'>
        {menuItems.map((item, index) => (
          <View 
            key={index}
            className='menu-item'
            onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}
          >
            <View className='menu-left'>
              <View className='iconify-icon' data-icon={item.icon} />
              <Text className='menu-text'>{item.text}</Text>
            </View>
            <View className='iconify-icon arrow' data-icon='mdi:chevron-right' />
          </View>
        ))}
      </View>

      <View className='footer'>
        <Text className='version'>IEClub v2.0.0</Text>
        <Text className='copyright'>© 2024 南方科技大学</Text>
      </View>
    </View>
  )
}
