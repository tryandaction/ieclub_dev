/**
 * IEClub 活动页面 - Taro版本
 * 支持小程序和H5
 */
import React, { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import MainLayout from '../../components/layout/MainLayout'
import Card from '../../components/common/Card'
import { formatTime, formatNumber } from '../../utils'

const ActivitiesPage = () => {
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  
  // 模拟数据
  const mockActivities = [
    {
      id: 1,
      title: '跨学科创新论坛',
      subtitle: 'AI时代的教育变革',
      emoji: '🎤',
      time: '2025-10-15 14:00',
      endTime: '2025-10-15 17:00',
      location: '慧园报告厅',
      participants: 45,
      maxParticipants: 100,
      organizer: '学生会',
      description: '探讨人工智能对教育领域的影响，邀请多位专家学者分享见解',
      isJoined: false,
      status: 'upcoming'
    },
    {
      id: 2,
      title: 'Python数据分析工作坊',
      subtitle: '从入门到实战',
      emoji: '💻',
      time: '2025-10-20 19:00',
      endTime: '2025-10-20 21:00',
      location: '图书馆204',
      participants: 28,
      maxParticipants: 30,
      organizer: '计算机系',
      description: '实战演练数据处理、可视化和机器学习基础',
      isJoined: true,
      status: 'upcoming'
    },
    {
      id: 3,
      title: 'UI设计工作坊',
      subtitle: '用户体验设计实践',
      emoji: '🎨',
      time: '2025-10-25 15:00',
      endTime: '2025-10-25 18:00',
      location: '设计学院',
      participants: 15,
      maxParticipants: 20,
      organizer: '设计协会',
      description: '学习Figma工具使用，完成一个完整的APP设计',
      isJoined: false,
      status: 'upcoming'
    }
  ]
  
  useEffect(() => {
    setActivities(mockActivities)
  }, [])
  
  // 活动点击
  const handleActivityClick = (activity) => {
    Taro.showToast({
      title: `查看活动：${activity.title}`,
      icon: 'none'
    })
  }
  
  // 报名
  const handleJoin = (e, activityId) => {
    e.stopPropagation()
    setActivities(activities.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          isJoined: !activity.isJoined,
          participants: activity.isJoined ? activity.participants - 1 : activity.participants + 1
        }
      }
      return activity
    }))
    Taro.showToast({
      title: activities.find(a => a.id === activityId)?.isJoined ? '已取消报名' : '报名成功',
      icon: 'success'
    })
  }
  
  // 加载更多
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        setHasMore(false)
      }, 1000)
    }
  }
  
  return (
    <MainLayout title="活动">
      <View className="w-full mx-auto px-3 py-4 lg:px-8 lg:py-6">
        {/* 活动列表 - Flex布局 */}
        <View className="flex flex-row flex-wrap -mx-2">
          {activities.map((activity) => (
            <View key={activity.id} className="w-full sm:w-1/2 lg:w-1/3 px-2 mb-4">
              <View
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => handleActivityClick(activity)}
              >
              {/* 活动头部 - 带emoji的渐变背景 */}
              <View className="relative h-32 bg-gradient-to-br from-purple-400 via-purple-500 to-pink-500 flex items-center justify-center">
                <Text className="text-6xl opacity-90">{activity.emoji}</Text>
                {activity.isJoined && (
                  <View className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                    <Text className="text-xs font-bold text-purple-600">已报名</Text>
                  </View>
                )}
              </View>
              
              {/* 活动内容 */}
              <View className="p-4">
                {/* 标题 */}
                <Text className="text-base font-bold text-gray-900 mb-1 line-clamp-1 block">
                  {activity.title}
                </Text>
                <Text className="text-xs text-gray-600 mb-3 line-clamp-1 block">
                  {activity.subtitle}
                </Text>
                
                {/* 活动信息 */}
                <View className="space-y-2 mb-4">
                  <View className="flex items-center text-xs text-gray-600">
                    <Text className="mr-2">🕐</Text>
                    <Text className="line-clamp-1">
                      {formatTime(activity.time, 'MM-DD HH:mm')}
                    </Text>
                  </View>
                  <View className="flex items-center text-xs text-gray-600">
                    <Text className="mr-2">📍</Text>
                    <Text className="line-clamp-1">{activity.location}</Text>
                  </View>
                  <View className="flex items-center text-xs text-gray-600">
                    <Text className="mr-2">👥</Text>
                    <Text>
                      {activity.participants}/{activity.maxParticipants}人
                    </Text>
                  </View>
                </View>
                
                {/* 报名按钮 */}
                <View
                  onClick={(e) => handleJoin(e, activity.id)}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-300 text-center ${
                    activity.isJoined
                      ? 'bg-gray-100 text-gray-700'
                      : activity.participants >= activity.maxParticipants
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                  }`}
                >
                  <Text className={
                    activity.isJoined
                      ? 'text-gray-700'
                      : activity.participants >= activity.maxParticipants
                      ? 'text-gray-500'
                      : 'text-white'
                  }>
                    {activity.isJoined
                      ? '✓ 已报名'
                      : activity.participants >= activity.maxParticipants
                      ? '已满员'
                      : '立即报名'}
                  </Text>
                </View>
              </View>
              </View>
            </View>
          ))}
        </View>
        
        {/* 空状态 */}
        {activities.length === 0 && !isLoading && (
          <View className="text-center py-20">
            <Text className="text-7xl mb-6 block">📅</Text>
            <Text className="text-xl font-bold text-gray-900 mb-2 block">暂无活动</Text>
            <Text className="text-gray-500 block">敬请期待精彩活动！</Text>
          </View>
        )}
      </View>
    </MainLayout>
  )
}

export default ActivitiesPage
