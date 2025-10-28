import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default class Index extends Component {
  state = {
    userInfo: null
  }

  navigateTo = (url) => {
    Taro.navigateTo({ url }).catch(err => {
      console.error('[Index] Navigation failed:', err)
      Taro.showToast({
        title: '页面跳转失败',
        icon: 'none',
        duration: 2000
      })
    })
  }

  menuItems = [
    {
      id: 'test',
      icon: '🧪',
      text: '测试页',
      url: '/pages/test/TestPage'
    },
    {
      id: 'events',
      icon: '📅',
      text: '活动详情',
      url: '/pages/events/EventDetailPage'
    },
    {
      id: 'profile',
      icon: '👤',
      text: '个人主页',
      url: '/pages/profile/ProfilePage'
    },
    {
      id: 'settings',
      icon: '⚙️',
      text: '设置',
      url: '/pages/settings/SettingsPage'
    },
    {
      id: 'notifications',
      icon: '🔔',
      text: '通知',
      url: '/pages/notifications/NotificationsPage'
    }
  ]

  renderMenuItem = (item) => {
    return (
      <View 
        key={item.id}
        className="menu-item" 
        onClick={() => this.navigateTo(item.url)}
        hoverClass="menu-item-hover"
      >
        <Text className="menu-icon">{item.icon}</Text>
        <Text className="menu-text">{item.text}</Text>
      </View>
    )
  }

  render() {
    return (
      <View className="index-container">
        <View className="header">
          <Text className="title">欢迎来到 IEClub</Text>
          <Text className="subtitle">连接兴趣，发现精彩</Text>
        </View>

        <View className="menu-list">
          {this.menuItems.map(this.renderMenuItem)}
        </View>

        <View className="footer">
          <Text className="footer-text">Powered by Taro</Text>
        </View>
      </View>
    )
  }
}
