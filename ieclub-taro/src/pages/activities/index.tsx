// src/pages/activities/index.tsx - 活动模块（小红书式排版）

import { View, Text, Image, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
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

// 模拟活动数据
const MOCK_ACTIVITIES = [
  {
    id: '1',
    title: 'AI技术分享会',
    description: '探讨最新AI技术趋势，分享实践经验',
    cover: 'https://via.placeholder.com/300x200/667eea/ffffff?text=AI+Tech',
    author: {
      id: 'u1',
      nickname: '张工程师',
      avatar: 'https://via.placeholder.com/40/667eea/ffffff?text=Z'
    },
    startTime: '2024-01-15 14:00',
    endTime: '2024-01-15 16:00',
    location: '南科大图书馆报告厅',
    maxParticipants: 50,
    currentParticipants: 23,
    price: 0,
    tags: ['AI', '技术分享', '免费'],
    status: 'open', // open, full, closed, ended
    isRegistered: false,
    likesCount: 45,
    commentsCount: 12,
    viewsCount: 156
  },
  {
    id: '2',
    title: '创业项目路演',
    description: '展示创新项目，寻找投资机会',
    cover: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Startup',
    author: {
      id: 'u2',
      nickname: '李创业者',
      avatar: 'https://via.placeholder.com/40/3b82f6/ffffff?text=L'
    },
    startTime: '2024-01-20 10:00',
    endTime: '2024-01-20 12:00',
    location: '南科大创业园',
    maxParticipants: 30,
    currentParticipants: 30,
    price: 0,
    tags: ['创业', '路演', '投资'],
    status: 'full',
    isRegistered: false,
    likesCount: 78,
    commentsCount: 25,
    viewsCount: 234
  },
  {
    id: '3',
    title: '设计思维工作坊',
    description: '学习设计思维方法，提升创新能力',
    cover: 'https://via.placeholder.com/300x200/9333ea/ffffff?text=Design',
    author: {
      id: 'u3',
      nickname: '王设计师',
      avatar: 'https://via.placeholder.com/40/9333ea/ffffff?text=W'
    },
    startTime: '2024-01-25 09:00',
    endTime: '2024-01-25 17:00',
    location: '南科大设计学院',
    maxParticipants: 20,
    currentParticipants: 15,
    price: 50,
    tags: ['设计', '工作坊', '创新'],
    status: 'open',
    isRegistered: true,
    likesCount: 32,
    commentsCount: 8,
    viewsCount: 89
  }
]

export default function ActivitiesPage() {
  const [activities, setActivities] = useState(MOCK_ACTIVITIES)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'my'>('all')

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '活动' })
    loadActivities()
  }, [])

  const loadActivities = async () => {
    setLoading(true)
    try {
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/activities`,
        method: 'GET',
        data: {
          page: 1,
          limit: 20,
          filter
        }
      })

      if (res.data.success) {
        setActivities(res.data.data || [])
      }
    } catch (error) {
      console.error('加载活动列表失败:', error)
      // 使用模拟数据
      setActivities(MOCK_ACTIVITIES)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (activityId: string) => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const res = await Taro.request({
        url: `${getApiBaseUrl()}/activities/${activityId}/register`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.data.success) {
        Taro.showToast({ title: '报名成功', icon: 'success' })
        // 更新活动状态
        setActivities(activities.map(activity => 
          activity.id === activityId 
            ? { 
                ...activity, 
                isRegistered: true, 
                currentParticipants: activity.currentParticipants + 1,
                status: activity.currentParticipants + 1 >= activity.maxParticipants ? 'full' : 'open'
              }
            : activity
        ))
      } else {
        Taro.showToast({ title: res.data.message || '报名失败', icon: 'none' })
      }
    } catch (error) {
      console.error('报名失败:', error)
      Taro.showToast({ title: '报名失败', icon: 'none' })
    }
  }

  const handleLike = async (activityId: string) => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const res = await Taro.request({
        url: `${getApiBaseUrl()}/activities/${activityId}/like`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.data.success) {
        // 更新点赞状态
        setActivities(activities.map(activity => 
          activity.id === activityId 
            ? { ...activity, likesCount: activity.likesCount + 1 }
            : activity
        ))
      }
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const goToActivityDetail = (activityId: string) => {
    Taro.navigateTo({
      url: `/pages/activities/detail/index?id=${activityId}`
    })
  }

  const goToCreateActivity = () => {
    Taro.navigateTo({
      url: '/pages/activities/create/index'
    })
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      open: '报名中',
      full: '已满员',
      closed: '已关闭',
      ended: '已结束'
    }
    return statusMap[status] || '未知'
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      open: '#10b981',
      full: '#f59e0b',
      closed: '#6b7280',
      ended: '#ef4444'
    }
    return colorMap[status] || '#6b7280'
  }

  const renderActivityCard = (activity: any) => (
    <View
      key={activity.id}
      className='activity-card'
      onClick={() => goToActivityDetail(activity.id)}
    >
      {/* 活动封面 */}
      <View className='activity-cover'>
        <Image
          className='cover-image'
          src={activity.cover}
          mode='aspectFill'
        />
        <View className='status-badge' style={{ backgroundColor: getStatusColor(activity.status) }}>
          {getStatusText(activity.status)}
        </View>
        {activity.price > 0 && (
          <View className='price-badge'>
            ¥{activity.price}
          </View>
        )}
      </View>

      {/* 活动信息 */}
      <View className='activity-info'>
        <Text className='activity-title'>{activity.title}</Text>
        <Text className='activity-description'>{activity.description}</Text>

        {/* 作者信息 */}
        <View className='author-info'>
          <Image
            className='author-avatar'
            src={activity.author.avatar}
            mode='aspectFill'
          />
          <Text className='author-name'>{activity.author.nickname}</Text>
        </View>

        {/* 活动详情 */}
        <View className='activity-details'>
          <View className='detail-item'>
            <Text className='detail-icon'>📅</Text>
            <Text className='detail-text'>{activity.startTime}</Text>
          </View>
          <View className='detail-item'>
            <Text className='detail-icon'>📍</Text>
            <Text className='detail-text'>{activity.location}</Text>
          </View>
          <View className='detail-item'>
            <Text className='detail-icon'>👥</Text>
            <Text className='detail-text'>
              {activity.currentParticipants}/{activity.maxParticipants}人
            </Text>
          </View>
        </View>

        {/* 标签 */}
        <View className='activity-tags'>
          {activity.tags.map((tag: string, index: number) => (
            <Text key={index} className='tag-item'>#{tag}</Text>
          ))}
        </View>

        {/* 互动数据 */}
        <View className='activity-stats'>
          <View className='stat-item'>
            <Text className='stat-icon'>👁</Text>
            <Text className='stat-text'>{activity.viewsCount}</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-icon'>❤️</Text>
            <Text className='stat-text'>{activity.likesCount}</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-icon'>💬</Text>
            <Text className='stat-text'>{activity.commentsCount}</Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View className='activity-actions'>
          {activity.status === 'open' && !activity.isRegistered ? (
            <Button
              className='register-btn'
              onClick={(e) => {
                e.stopPropagation()
                handleRegister(activity.id)
              }}
            >
              立即报名
            </Button>
          ) : activity.isRegistered ? (
            <Button className='registered-btn' disabled>
              已报名
            </Button>
          ) : (
            <Button className='disabled-btn' disabled>
              {getStatusText(activity.status)}
            </Button>
          )}
          
          <View
            className='like-btn'
            onClick={(e) => {
              e.stopPropagation()
              handleLike(activity.id)
            }}
          >
            <Text className='like-icon'>❤️</Text>
          </View>
        </View>
      </View>
    </View>
  )

  return (
    <View className='activities-page'>
      {/* 顶部筛选栏 */}
      <View className='filter-bar'>
        <View className='filter-tabs'>
          <View
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部活动
          </View>
          <View
            className={`filter-tab ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            可报名
          </View>
          <View
            className={`filter-tab ${filter === 'my' ? 'active' : ''}`}
            onClick={() => setFilter('my')}
          >
            我的活动
          </View>
        </View>
        <View className='create-btn' onClick={goToCreateActivity}>
          <Text className='create-icon'>+</Text>
        </View>
      </View>

      {/* 活动列表 */}
      <ScrollView className='activities-scroll' scrollY>
        {loading ? (
          <View className='loading'>
            <View className='loading-spinner'></View>
            <View className='loading-text'>加载中...</View>
          </View>
        ) : activities.length > 0 ? (
          <View className='activities-grid'>
            {activities.map(renderActivityCard)}
          </View>
        ) : (
          <View className='empty-state'>
            <View className='empty-icon'>🎉</View>
            <View className='empty-text'>暂无活动</View>
            <View className='empty-hint'>快来创建第一个活动吧</View>
            <Button className='create-first-btn' onClick={goToCreateActivity}>
              创建活动
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
