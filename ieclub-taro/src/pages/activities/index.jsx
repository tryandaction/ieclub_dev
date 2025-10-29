import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { useActivityStore } from '../../store'
import './index.scss'

// 活动卡片组件
function ActivityCard({ activity }) {
  const [registered, setRegistered] = useState(false)

  const handleRegister = () => {
    if (registered) {
      Taro.showToast({
        title: '已取消报名',
        icon: 'success'
      })
    } else {
      Taro.showToast({
        title: '报名成功',
        icon: 'success'
      })
    }
    setRegistered(!registered)
  }

  const progress = (activity.participants.current / activity.participants.max) * 100

  return (
    <View className="activity-card">
      <View className="activity-cover">
        <Text className="activity-emoji">{activity.cover}</Text>
      </View>

      <View className="activity-content">
        <Text className="activity-title">{activity.title}</Text>

        <View className="activity-info">
          <View className="info-item">
            <Text className="info-icon">🕐</Text>
            <Text className="info-text">{activity.time}</Text>
          </View>

          <View className="info-item">
            <Text className="info-icon">📍</Text>
            <Text className="info-text">{activity.location}</Text>
          </View>

          <View className="info-item">
            <Text className="info-icon">👥</Text>
            <Text className="info-text">
              {activity.participants.current}/{activity.participants.max}人
            </Text>
          </View>
        </View>

        <View className="progress-bar">
          <View className="progress-fill" style={{ width: `${progress}%` }} />
        </View>

        <View 
          className={`register-btn ${registered ? 'registered' : ''}`}
          onClick={handleRegister}
        >
          <Text className="register-text">
            {registered ? '已报名' : '立即报名'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default function ActivitiesPage() {
  const { activities } = useActivityStore()

  return (
    <View className="activities-page">
      <View className="activities-header">
        <Text className="page-title">精彩活动</Text>
        <Text className="page-subtitle">发现更多学习与交流的机会</Text>
      </View>

      <ScrollView scrollY className="activities-content">
        <View className="activity-grid">
          {activities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
