// src/pages/activities/detail/index.tsx - 活动详情页面

import { View, Text, Image, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
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

// 模拟活动详情数据
const MOCK_ACTIVITY_DETAIL = {
  id: '1',
  title: 'AI技术分享会',
  description: `本次分享会将深入探讨最新AI技术趋势，包括：

1. 大语言模型的最新发展
2. AI在教育和科研中的应用
3. 开源AI工具的使用经验
4. AI伦理和未来发展

适合人群：
- 对AI技术感兴趣的师生
- 希望了解AI应用场景的研究者
- 想要学习AI工具使用的开发者

分享嘉宾：
- 张工程师：AI领域资深专家，拥有10年行业经验
- 李博士：机器学习研究员，发表多篇顶级论文

活动安排：
14:00-14:30 签到入场
14:30-15:30 主题分享
15:30-16:00 互动问答
16:00-16:30 自由交流

注意事项：
- 请提前15分钟到场
- 可携带笔记本电脑进行实践
- 活动提供茶歇和纪念品`,
  cover: 'https://via.placeholder.com/400x300/667eea/ffffff?text=AI+Tech',
  images: [
    'https://via.placeholder.com/400x300/3b82f6/ffffff?text=AI+1',
    'https://via.placeholder.com/400x300/9333ea/ffffff?text=AI+2'
  ],
  author: {
    id: 'u1',
    nickname: '张工程师',
    avatar: 'https://via.placeholder.com/60/667eea/ffffff?text=Z',
    bio: 'AI领域资深专家，拥有10年行业经验',
    isCertified: true,
    level: 5
  },
  startTime: '2024-01-15 14:00',
  endTime: '2024-01-15 16:00',
  location: '南科大图书馆报告厅',
  address: '深圳市南山区学苑大道1088号',
  maxParticipants: 50,
  currentParticipants: 23,
  price: 0,
  tags: ['AI', '技术分享', '免费', '教育'],
  status: 'open',
  isRegistered: false,
  likesCount: 45,
  commentsCount: 12,
  viewsCount: 156,
  createdAt: '2024-01-10 10:00',
  updatedAt: '2024-01-12 15:30'
}

export default function ActivityDetailPage() {
  const router = useRouter()
  const activityId = router.params.id

  const [activity, setActivity] = useState(MOCK_ACTIVITY_DETAIL)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '活动详情' })
    loadActivityDetail()
  }, [activityId])

  const loadActivityDetail = async () => {
    setLoading(true)
    try {
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/activities/${activityId}`,
        method: 'GET'
      })

      if (res.data.success) {
        setActivity(res.data.data)
      }
    } catch (error) {
      console.error('加载活动详情失败:', error)
      // 使用模拟数据
      setActivity(MOCK_ACTIVITY_DETAIL)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
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
        setActivity({
          ...activity,
          isRegistered: true,
          currentParticipants: activity.currentParticipants + 1,
          status: activity.currentParticipants + 1 >= activity.maxParticipants ? 'full' : 'open'
        })
      } else {
        Taro.showToast({ title: res.data.message || '报名失败', icon: 'none' })
      }
    } catch (error) {
      console.error('报名失败:', error)
      Taro.showToast({ title: '报名失败', icon: 'none' })
    }
  }

  const handleLike = async () => {
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
        setActivity({
          ...activity,
          likesCount: activity.likesCount + 1
        })
        Taro.showToast({ title: '点赞成功', icon: 'success' })
      }
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const handleShare = () => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  }

  const goToAuthorProfile = () => {
    Taro.navigateTo({
      url: `/pages/profile/user/index?id=${activity.author.id}`
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

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    })
  }

  if (loading) {
    return (
      <View className='activity-detail-page'>
        <View className='loading'>
          <View className='loading-spinner'></View>
          <View className='loading-text'>加载中...</View>
        </View>
      </View>
    )
  }

  return (
    <View className='activity-detail-page'>
      <ScrollView className='content-scroll' scrollY>
        {/* 活动封面 */}
        <View className='activity-cover'>
          <Image
            className='cover-image'
            src={activity.cover}
            mode='aspectFill'
          />
          <View className='cover-overlay'>
            <View className='status-badge' style={{ backgroundColor: getStatusColor(activity.status) }}>
              {getStatusText(activity.status)}
            </View>
            {activity.price > 0 && (
              <View className='price-badge'>
                ¥{activity.price}
              </View>
            )}
          </View>
        </View>

        {/* 活动基本信息 */}
        <View className='activity-header'>
          <Text className='activity-title'>{activity.title}</Text>
          
          {/* 作者信息 */}
          <View className='author-section' onClick={goToAuthorProfile}>
            <Image
              className='author-avatar'
              src={activity.author.avatar}
              mode='aspectFill'
            />
            <View className='author-info'>
              <View className='author-name-row'>
                <Text className='author-name'>{activity.author.nickname}</Text>
                {activity.author.isCertified && (
                  <Text className='certified-badge'>✓</Text>
                )}
                <Text className='level-badge'>Lv.{activity.author.level}</Text>
              </View>
              <Text className='author-bio'>{activity.author.bio}</Text>
            </View>
          </View>

          {/* 活动统计 */}
          <View className='activity-stats'>
            <View className='stat-item'>
              <Text className='stat-icon'>👁</Text>
              <Text className='stat-text'>{activity.viewsCount} 浏览</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-icon'>❤️</Text>
              <Text className='stat-text'>{activity.likesCount} 点赞</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-icon'>💬</Text>
              <Text className='stat-text'>{activity.commentsCount} 评论</Text>
            </View>
          </View>
        </View>

        {/* 活动详情 */}
        <View className='activity-details'>
          <View className='detail-section'>
            <Text className='section-title'>📅 活动时间</Text>
            <Text className='detail-text'>{formatTime(activity.startTime)}</Text>
            <Text className='detail-subtext'>至 {formatTime(activity.endTime)}</Text>
          </View>

          <View className='detail-section'>
            <Text className='section-title'>📍 活动地点</Text>
            <Text className='detail-text'>{activity.location}</Text>
            <Text className='detail-subtext'>{activity.address}</Text>
          </View>

          <View className='detail-section'>
            <Text className='section-title'>👥 参与人数</Text>
            <Text className='detail-text'>
              {activity.currentParticipants}/{activity.maxParticipants}人
            </Text>
            <View className='progress-bar'>
              <View
                className='progress-fill'
                style={{ width: `${(activity.currentParticipants / activity.maxParticipants) * 100}%` }}
              />
            </View>
          </View>

          {activity.price > 0 && (
            <View className='detail-section'>
              <Text className='section-title'>💰 活动费用</Text>
              <Text className='detail-text price-text'>¥{activity.price}</Text>
            </View>
          )}
        </View>

        {/* 活动描述 */}
        <View className='activity-description'>
          <Text className='section-title'>📝 活动介绍</Text>
          <Text className='description-text'>{activity.description}</Text>
        </View>

        {/* 活动图片 */}
        {activity.images && activity.images.length > 0 && (
          <View className='activity-images'>
            <Text className='section-title'>🖼️ 活动图片</Text>
            <View className='images-grid'>
              {activity.images.map((img, index) => (
                <Image
                  key={index}
                  className='activity-image'
                  src={img}
                  mode='aspectFill'
                  onClick={() => {
                    Taro.previewImage({
                      urls: activity.images,
                      current: img
                    })
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* 活动标签 */}
        <View className='activity-tags'>
          <Text className='section-title'>🏷️ 活动标签</Text>
          <View className='tags-list'>
            {activity.tags.map((tag, index) => (
              <Text key={index} className='tag-item'>#{tag}</Text>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className='bottom-actions'>
        <View className='action-buttons'>
          <View className='like-btn' onClick={handleLike}>
            <Text className='action-icon'>❤️</Text>
            <Text className='action-text'>{activity.likesCount}</Text>
          </View>
          
          <View className='share-btn' onClick={handleShare}>
            <Text className='action-icon'>📤</Text>
            <Text className='action-text'>分享</Text>
          </View>
        </View>

        {activity.status === 'open' && !activity.isRegistered ? (
          <Button className='register-btn' onClick={handleRegister}>
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
      </View>
    </View>
  )
}
