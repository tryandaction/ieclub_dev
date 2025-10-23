// src/pages/community/index.tsx - 社区页面（第一版社区）

import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

// 使用统一的API配置
import { getApiBaseUrl } from '@/utils/api-config'

// 模拟社区用户数据
const MOCK_USERS = [
  {
    id: 'u1',
    nickname: '张工程师',
    avatar: 'https://via.placeholder.com/60/667eea/ffffff?text=Z',
    bio: 'AI领域资深专家，拥有10年行业经验',
    level: 5,
    isCertified: true,
    topicsCount: 12,
    likesCount: 156,
    followersCount: 89,
    lastActiveAt: '2小时前',
    isOnline: true
  },
  {
    id: 'u2',
    nickname: '李创业者',
    avatar: 'https://via.placeholder.com/60/3b82f6/ffffff?text=L',
    bio: '连续创业者，专注教育科技领域',
    level: 4,
    isCertified: true,
    topicsCount: 8,
    likesCount: 234,
    followersCount: 156,
    lastActiveAt: '5小时前',
    isOnline: false
  },
  {
    id: 'u3',
    nickname: '王设计师',
    avatar: 'https://via.placeholder.com/60/9333ea/ffffff?text=W',
    bio: 'UI/UX设计师，热爱创新设计',
    level: 3,
    isCertified: false,
    topicsCount: 15,
    likesCount: 98,
    followersCount: 67,
    lastActiveAt: '1天前',
    isOnline: false
  },
  {
    id: 'u4',
    nickname: '陈研究员',
    avatar: 'https://via.placeholder.com/60/10b981/ffffff?text=C',
    bio: '机器学习研究员，发表多篇顶级论文',
    level: 6,
    isCertified: true,
    topicsCount: 20,
    likesCount: 345,
    followersCount: 234,
    lastActiveAt: '30分钟前',
    isOnline: true
  },
  {
    id: 'u5',
    nickname: '刘产品经理',
    avatar: 'https://via.placeholder.com/60/f59e0b/ffffff?text=L',
    bio: '产品经理，专注用户体验优化',
    level: 4,
    isCertified: true,
    topicsCount: 6,
    likesCount: 123,
    followersCount: 78,
    lastActiveAt: '3小时前',
    isOnline: false
  }
]

export default function CommunityPage() {
  const [users, setUsers] = useState(MOCK_USERS)
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'time' | 'popularity'>('time')

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '社区' })
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/users`,
        method: 'GET',
        data: {
          page: 1,
          limit: 20,
          sortBy
        }
      })

      if (res.data.success) {
        setUsers(res.data.data || [])
      }
    } catch (error) {
      console.error('加载用户列表失败:', error)
      // 使用模拟数据
      setUsers(MOCK_USERS)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const res = await Taro.request({
        url: `${getApiBaseUrl()}/users/${userId}/follow`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.data.success) {
        Taro.showToast({ title: '关注成功', icon: 'success' })
        // 更新用户状态
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, followersCount: user.followersCount + 1 }
            : user
        ))
      } else {
        Taro.showToast({ title: res.data.message || '关注失败', icon: 'none' })
      }
    } catch (error) {
      console.error('关注失败:', error)
      Taro.showToast({ title: '关注失败', icon: 'none' })
    }
  }

  const goToUserProfile = (userId: string) => {
    Taro.navigateTo({
      url: `/pages/profile/user/index?id=${userId}`
    })
  }

  const getLevelColor = (level: number) => {
    if (level >= 5) return '#ef4444' // 红色
    if (level >= 4) return '#f59e0b' // 橙色
    if (level >= 3) return '#10b981' // 绿色
    if (level >= 2) return '#3b82f6' // 蓝色
    return '#6b7280' // 灰色
  }

  const renderUserCard = (user: any) => (
    <View
      key={user.id}
      className='user-card'
      onClick={() => goToUserProfile(user.id)}
    >
      <View className='user-avatar-section'>
        <Image
          className='user-avatar'
          src={user.avatar}
          mode='aspectFill'
        />
        {user.isOnline && <View className='online-indicator' />}
            </View>

      <View className='user-info'>
        <View className='user-header'>
          <Text className='user-nickname'>{user.nickname}</Text>
          {user.isCertified && (
            <Text className='certified-badge'>✓</Text>
          )}
          <View 
            className='level-badge'
            style={{ backgroundColor: getLevelColor(user.level) }}
          >
            Lv.{user.level}
          </View>
        </View>

        <Text className='user-bio'>{user.bio}</Text>

        <View className='user-stats'>
          <View className='stat-item'>
            <Text className='stat-value'>{user.topicsCount}</Text>
            <Text className='stat-label'>话题</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{user.likesCount}</Text>
            <Text className='stat-label'>获赞</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{user.followersCount}</Text>
            <Text className='stat-label'>粉丝</Text>
        </View>
      </View>

        <View className='user-footer'>
          <Text className='last-active'>{user.lastActiveAt}</Text>
          <View 
            className='follow-btn'
            onClick={(e) => {
              e.stopPropagation()
              handleFollow(user.id)
            }}
          >
            <Text className='follow-text'>+ 关注</Text>
          </View>
        </View>
      </View>
    </View>
  )

  return (
    <View className='community-page'>
      {/* 顶部筛选栏 */}
      <View className='filter-bar'>
        <View className='filter-tabs'>
        <View
            className={`filter-tab ${sortBy === 'time' ? 'active' : ''}`}
            onClick={() => {
              setSortBy('time')
              loadUsers()
            }}
          >
            最新活跃
        </View>
        <View
            className={`filter-tab ${sortBy === 'popularity' ? 'active' : ''}`}
            onClick={() => {
              setSortBy('popularity')
              loadUsers()
            }}
          >
            人气排行
          </View>
        </View>
      </View>

      {/* 用户列表 */}
      <ScrollView className='users-scroll' scrollY>
        {loading ? (
          <View className='loading'>
            <View className='loading-spinner'></View>
            <View className='loading-text'>加载中...</View>
              </View>
        ) : users.length > 0 ? (
          <View className='users-list'>
            {users.map(renderUserCard)}
          </View>
        ) : (
          <View className='empty-state'>
            <View className='empty-icon'>👥</View>
            <View className='empty-text'>暂无用户</View>
            <View className='empty-hint'>快来发现更多有趣的用户吧</View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}