import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './EventDetailPage.scss'

/**
 * 活动详情页 - 小程序版本
 * 展示活动的详细信息，包括时间、地点、描述等
 */
export default class EventDetailPage extends Component {
  state = {
    eventId: null,
    event: null,
    loading: true
  }

  componentDidMount() {
    // 获取路由参数
    const params = this.$router?.params || {}
    const eventId = params.id || '1'
    this.setState({ eventId })
    this.loadEventDetail(eventId)
  }

  async loadEventDetail(id) {
    try {
      // 模拟加载活动详情数据
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockEvent = {
        id,
        title: '跨学科创新论坛：AI时代的教育变革',
        organizer: '王教授团队',
        date: '2025-10-15 14:00',
        location: '慧园行政楼报告厅',
        participants: 45,
        maxParticipants: 100,
        description: '邀请教育学、计算机科学、心理学等多领域专家，探讨AI如何重塑教育形态。本次论坛将深入探讨人工智能技术对教育领域的影响，以及如何利用跨学科知识推动教育创新。',
        tags: ['学术讲座', '跨学科', 'AI'],
        icon: '🎤'
      }
      
      this.setState({ 
        event: mockEvent,
        loading: false 
      })
    } catch (error) {
      console.error('[EventDetailPage] Load failed:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      })
      this.setState({ loading: false })
    }
  }

  handleBack = () => {
    Taro.navigateBack()
  }

  handleRegister = () => {
    Taro.showToast({
      title: '报名成功！',
      icon: 'success',
      duration: 2000
    })
  }

  render() {
    const { loading, event } = this.state

    if (loading) {
      return (
        <View className="event-detail-page loading">
          <View className="loading-spinner"></View>
          <Text className="loading-text">加载中...</Text>
        </View>
      )
    }

    if (!event) {
      return (
        <View className="event-detail-page error">
          <Text className="error-icon">😕</Text>
          <Text className="error-text">活动不存在</Text>
          <View className="back-btn" onClick={this.handleBack}>
            <Text className="btn-text">返回</Text>
          </View>
        </View>
      )
    }

    const progress = (event.participants / event.maxParticipants) * 100
    const isFull = event.participants >= event.maxParticipants

    return (
      <View className="event-detail-page">
        {/* 活动头部 */}
        <View className="event-header">
          <View className="event-icon">{event.icon}</View>
          <Text className="event-title">{event.title}</Text>
        </View>

        {/* 活动信息 */}
        <View className="event-info">
          <View className="info-item">
            <Text className="info-label">👤 主办方</Text>
            <Text className="info-value">{event.organizer}</Text>
          </View>
          <View className="info-item">
            <Text className="info-label">🕐 时间</Text>
            <Text className="info-value">{event.date}</Text>
          </View>
          <View className="info-item">
            <Text className="info-label">📍 地点</Text>
            <Text className="info-value">{event.location}</Text>
          </View>
        </View>

        {/* 报名进度 */}
        <View className="event-progress">
          <View className="progress-header">
            <Text className="progress-label">报名进度</Text>
            <Text className="progress-count">{event.participants}/{event.maxParticipants}人</Text>
          </View>
          <View className="progress-bar">
            <View 
              className={`progress-fill ${progress >= 80 ? 'full' : ''}`}
              style={{ width: `${progress}%` }}
            ></View>
          </View>
        </View>

        {/* 活动描述 */}
        <View className="event-description">
          <Text className="description-title">活动介绍</Text>
          <Text className="description-text">{event.description}</Text>
        </View>

        {/* 活动标签 */}
        <View className="event-tags">
          {event.tags.map((tag, index) => (
            <View key={index} className="tag">
              <Text className="tag-text">{tag}</Text>
            </View>
          ))}
        </View>

        {/* 操作按钮 */}
        <View className="event-actions">
          <View 
            className={`register-btn ${isFull ? 'disabled' : ''}`}
            onClick={isFull ? null : this.handleRegister}
            hoverClass={isFull ? '' : 'btn-hover'}
          >
            <Text className="btn-text">{isFull ? '活动已满' : '立即报名'}</Text>
          </View>
          <View className="back-btn" onClick={this.handleBack} hoverClass="btn-hover">
            <Text className="btn-text">返回</Text>
          </View>
        </View>
      </View>
    )
  }
}
