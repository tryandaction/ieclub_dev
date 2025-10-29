/**
 * IEClub 活动页面 - 最简化测试版本
 */
import React, { Component } from 'react'
import { View, Text } from '@tarojs/components'
import './index.scss'

class ActivitiesPage extends Component {
  componentDidMount() {
    console.log('ActivitiesPage mounted')
  }

  render() {
    return (
      <View className="container">
        <View className="title-box">
          <Text className="title">活动</Text>
        </View>
        
        <View className="content-box">
          <Text className="text">活动页面测试</Text>
        </View>
        
        <View className="card">
          <Text>活动卡片1</Text>
        </View>
        
        <View className="card">
          <Text>活动卡片2</Text>
        </View>
      </View>
    )
  }
}

export default ActivitiesPage
