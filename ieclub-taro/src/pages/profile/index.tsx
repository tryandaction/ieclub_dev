import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Icon from '../../components/Icon'
import { IconConfig } from '../../config/icon.config'
import './index.scss'

export default function Profile() {
  const [userInfo, setUserInfo] = useState({
    nickname: '游客',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
    bio: '这个人很懒，还没有个性签名',
    followersCount: 0,
    followingCount: 0,
    topicsCount: 0,
    likesCount: 0
  })

  const [isLogin, setIsLogin] = useState(false)

  useEffect(() => {
    // 组件挂载时的逻辑
  }, [])

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const menuItems = [
    {
      icon: IconConfig.interaction.like,
      title: '我的点赞',
      path: '/pages/user/likes',
      color: '#FF6B9D'
    },
    {
      icon: IconConfig.interaction.favorite,
      title: '我的收藏',
      path: '/pages/user/favorites',
      color: '#FFA500'
    },
    {
      icon: IconConfig.content.event,
      title: '我的活动',
      path: '/pages/user/activities',
      color: '#5B7FFF'
    },
    {
      icon: IconConfig.social.community,
      title: '我的社区',
      path: '/pages/user/communities',
      color: '#7C4DFF'
    }
  ]

  const settingItems = [
    {
      icon: IconConfig.user.edit,
      title: '编辑资料',
      path: '/pages/settings/profile'
    },
    {
      icon: IconConfig.user.settings,
      title: '设置',
      path: '/pages/settings/index'
    },
    {
      icon: IconConfig.interaction.help,
      title: '帮助与反馈',
      path: '/pages/help/index'
    },
    {
      icon: IconConfig.content.info,
      title: '关于我们',
      path: '/pages/about/index'
    }
  ]

  const handleMenuClick = (path: string) => {
    if (!isLogin) {
      goToLogin()
      return
    }
    console.log('导航到', path)
  }

  return (
    <View className='profile-page'>
      {/* 用户信息区域 */}
      <View className='user-header'>
        <View className='background-gradient' />
        
        <View className='user-info'>
          <Image 
            src={userInfo.avatar}
            className='avatar'
            mode='aspectFill'
            onClick={!isLogin ? goToLogin : undefined}
          />
          
          {isLogin ? (
            <>
              <Text className='nickname'>{userInfo.nickname}</Text>
              <Text className='bio'>{userInfo.bio}</Text>
            </>
          ) : (
            <>
              <Text className='nickname'>点击登录</Text>
              <Text className='bio' onClick={goToLogin}>登录后查看更多内容</Text>
            </>
          )}
        </View>

        {/* 数据统计 */}
        <View className='stats'>
          <View className='stat-item'>
            <Text className='stat-value'>{userInfo.topicsCount}</Text>
            <Text className='stat-label'>话题</Text>
          </View>
          <View className='stat-divider' />
          <View className='stat-item'>
            <Text className='stat-value'>{userInfo.followersCount}</Text>
            <Text className='stat-label'>粉丝</Text>
          </View>
          <View className='stat-divider' />
          <View className='stat-item'>
            <Text className='stat-value'>{userInfo.followingCount}</Text>
            <Text className='stat-label'>关注</Text>
          </View>
          <View className='stat-divider' />
          <View className='stat-item'>
            <Text className='stat-value'>{userInfo.likesCount}</Text>
            <Text className='stat-label'>获赞</Text>
          </View>
        </View>
      </View>

      {/* 功能菜单 */}
      <View className='menu-grid'>
        {menuItems.map((item, index) => (
          <View 
            key={index}
            className='menu-item'
            onClick={() => handleMenuClick(item.path)}
          >
            <View 
              className='icon-wrapper'
              style={{ background: item.color }}
            >
              <Icon icon={item.icon} size={24} color="#fff" />
            </View>
            <Text className='menu-title'>{item.title}</Text>
          </View>
        ))}
      </View>

      {/* 设置列表 */}
      <View className='setting-list'>
        {settingItems.map((item, index) => (
          <View 
            key={index}
            className='setting-item'
            onClick={() => handleMenuClick(item.path)}
          >
            <View className='item-left'>
              <Icon icon={item.icon} size={20} color="#666" />
              <Text>{item.title}</Text>
            </View>
            <Icon icon={IconConfig.nav.right} size={20} color="#999" />
          </View>
        ))}
      </View>

      {/* 退出登录按钮 */}
      {isLogin && (
        <View className='logout-btn' onClick={() => setIsLogin(false)}>
          <Text>退出登录</Text>
        </View>
      )}
    </View>
  )
}
