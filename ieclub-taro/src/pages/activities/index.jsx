import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

/**
 * 活动页 - 线下活动和讲座
 */
export default class ActivitiesPage extends Component {
  
  state = {
    activities: []
  }

  componentDidMount() {
    console.log('[Activities] Page mounted')
    this.loadActivities()
  }

  loadActivities() {
    const mockActivities = [
      {
        id: 1,
        title: '跨学科创新论坛：AI时代的教育变革',
        date: '2025-10-15 14:00',
        location: '慧园行政楼报告厅',
        participants: 45,
        maxParticipants: 100,
        status: 'upcoming'
      },
      {
        id: 2,
        title: 'Python数据分析工作坊',
        date: '2025-10-20 15:00',
        location: '图书馆204',
        participants: 28,
        maxParticipants: 30,
        status: 'upcoming'
      }
    ]
    
    this.setState({ activities: mockActivities })
  }

  handleRegister = (activity) => {
    Taro.showToast({
      title: '报名成功',
      icon: 'success'
    })
  }

  render() {
    const { activities } = this.state

    return (
      <View className="activities-page">
        <ScrollView scrollY className="activity-list">
          {activities.map(activity => (
            <View key={activity.id} className="activity-card">
              <Text className="activity-title">{activity.title}</Text>
              
              <View className="activity-info">
                <View className="info-row">
                  <Text className="info-label">🕐 时间</Text>
                  <Text className="info-value">{activity.date}</Text>
                </View>
                <View className="info-row">
                  <Text className="info-label">📍 地点</Text>
                  <Text className="info-value">{activity.location}</Text>
                </View>
                <View className="info-row">
                  <Text className="info-label">👥 人数</Text>
                  <Text className="info-value">
                    {activity.participants}/{activity.maxParticipants}
                  </Text>
                </View>
              </View>

              <View 
                className="register-btn"
                onClick={() => this.handleRegister(activity)}
              >
                <Text className="btn-text">立即报名</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    )
  }
}
