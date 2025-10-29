/**
 * IEClub 个人中心页面 - 最简化测试版本
 */
import React, { Component } from 'react'
import { View, Text } from '@tarojs/components'

class ProfilePage extends Component {
  componentDidMount() {
    console.log('ProfilePage mounted')
  }

  render() {
    return (
      <View className="container">
        <View className="title-box">
          <Text className="title">我的</Text>
        </View>
        
        <View className="content-box">
          <Text className="text">个人中心测试</Text>
        </View>
        
        <View className="card">
          <Text>用户信息</Text>
        </View>
        
        <View className="card">
          <Text>菜单项</Text>
        </View>
      </View>
    )
  }
}

export default ProfilePage
