import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

/**
 * 个人中心 - 用户信息和设置
 */
export default class ProfilePage extends Component {
  
  state = {
    userInfo: {
      username: '张明',
      school: '南方科技大学',
      major: '计算机科学与工程系',
      grade: '大三'
    },
    stats: {
      posts: 12,
      followers: 23,
      following: 45,
      points: 156
    }
  }

  componentDidMount() {
    console.log('[Profile] Page mounted')
  }

  menuItems = [
    { id: 1, icon: '📝', text: '我的帖子', action: 'posts' },
    { id: 2, icon: '🎤', text: '我的话题', action: 'topics' },
    { id: 3, icon: '📅', text: '我的活动', action: 'activities' },
    { id: 4, icon: '⭐', text: '收藏', action: 'bookmarks' },
    { id: 5, icon: '⚙️', text: '设置', action: 'settings' }
  ]

  handleMenuClick = (item) => {
    Taro.showToast({
      title: item.text,
      icon: 'none'
    })
  }

  render() {
    const { userInfo, stats } = this.state

    return (
      <View className="profile-page">
        <ScrollView scrollY className="profile-content">
          {/* 用户信息 */}
          <View className="user-header">
            <View className="avatar">
              <Text className="avatar-text">👨‍💻</Text>
            </View>
            <Text className="username">{userInfo.username}</Text>
            <Text className="user-info">
              {userInfo.school} · {userInfo.major}
            </Text>
            <Text className="user-grade">{userInfo.grade}</Text>
          </View>

          {/* 统计数据 */}
          <View className="stats-container">
            <View className="stat-item">
              <Text className="stat-value">{stats.posts}</Text>
              <Text className="stat-label">帖子</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value">{stats.followers}</Text>
              <Text className="stat-label">粉丝</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value">{stats.following}</Text>
              <Text className="stat-label">关注</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value">{stats.points}</Text>
              <Text className="stat-label">积分</Text>
            </View>
          </View>

          {/* 功能菜单 */}
          <View className="menu-section">
            {this.menuItems.map(item => (
              <View 
                key={item.id}
                className="menu-item"
                onClick={() => this.handleMenuClick(item)}
              >
                <Text className="menu-icon">{item.icon}</Text>
                <Text className="menu-text">{item.text}</Text>
                <Text className="menu-arrow">›</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    )
  }
}

