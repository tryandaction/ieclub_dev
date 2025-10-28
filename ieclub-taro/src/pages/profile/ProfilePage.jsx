import { Component } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './ProfilePage.scss'

/**
 * 个人主页 - 小程序版本
 * 展示用户个人信息、统计数据和项目列表
 */
export default class ProfilePage extends Component {
  state = {
    userInfo: null,
    stats: {
      posts: 12,
      followers: 23,
      following: 45,
      reputation: 156
    },
    projects: [
      {
        id: 1,
        title: 'AI学习助手',
        description: '基于大模型的个性化学习推荐系统',
        status: 'ongoing',
        tags: ['AI', 'Python', 'Education'],
        stars: 23
      },
      {
        id: 2,
        title: '跨学科知识图谱',
        description: '连接不同学科知识点的可视化平台',
        status: 'completed',
        tags: ['知识图谱', 'D3.js'],
        stars: 45
      }
    ],
    loading: true
  }

  componentDidMount() {
    this.loadUserInfo()
  }

  onPullDownRefresh() {
    this.loadUserInfo()
  }

  async loadUserInfo() {
    try {
      // 尝试从缓存加载用户信息
      const { data } = await Taro.getStorage({ key: 'userInfo' }).catch(() => ({ data: null }))
      
      // 如果没有缓存，使用默认数据
      const defaultUser = {
        username: '张明',
        avatar: '👨‍💻',
        major: '计算机科学与工程系',
        school: '南方科技大学',
        grade: '大三',
        bio: '热爱编程和跨学科交流',
        verified: true
      }
      
      this.setState({
        userInfo: data || defaultUser,
        loading: false
      })
      
      Taro.stopPullDownRefresh()
    } catch (error) {
      console.error('[ProfilePage] Load failed:', error)
      this.setState({ loading: false })
      Taro.stopPullDownRefresh()
    }
  }

  handleBack = () => {
    Taro.navigateBack()
  }

  handleEditProfile = () => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 2000
    })
  }

  render() {
    const { loading, userInfo, stats, projects } = this.state

    if (loading) {
      return (
        <View className="profile-page loading">
          <View className="loading-spinner"></View>
          <Text className="loading-text">加载中...</Text>
        </View>
      )
    }

    return (
      <View className="profile-page">
        {/* 用户信息卡片 */}
        <View className="profile-header">
          <View className="user-avatar">
            <Text className="avatar-emoji">{userInfo?.avatar || '👤'}</Text>
            {userInfo?.verified && <View className="verified-badge">✓</View>}
          </View>
          <Text className="username">{userInfo?.username || '用户'}</Text>
          <Text className="major">{userInfo?.major || '未设置专业'}</Text>
          <Text className="school">{userInfo?.school || ''} · {userInfo?.grade || ''}</Text>
          {userInfo?.bio && <Text className="bio">{userInfo.bio}</Text>}
          
          <View className="edit-btn" onClick={this.handleEditProfile} hoverClass="btn-hover">
            <Text className="btn-text">✏️ 编辑资料</Text>
          </View>
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
            <Text className="stat-value">{stats.reputation}</Text>
            <Text className="stat-label">声望</Text>
          </View>
        </View>

        {/* 我的项目 */}
        <View className="projects-section">
          <View className="section-header">
            <Text className="section-title">我的项目</Text>
          </View>
          
          {projects.map(project => (
            <View key={project.id} className="project-card">
              <View className="project-header">
                <Text className="project-title">{project.title}</Text>
                <View className={`project-status ${project.status}`}>
                  <Text className="status-text">
                    {project.status === 'ongoing' ? '进行中' : '已完成'}
                  </Text>
                </View>
              </View>
              
              <Text className="project-description">{project.description}</Text>
              
              <View className="project-tags">
                {project.tags.map((tag, index) => (
                  <View key={index} className="tag">
                    <Text className="tag-text">{tag}</Text>
                  </View>
                ))}
              </View>
              
              <View className="project-footer">
                <Text className="project-stars">⭐ {project.stars}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 返回按钮 */}
        <View className="back-btn" onClick={this.handleBack} hoverClass="btn-hover">
          <Text className="btn-text">返回</Text>
        </View>
      </View>
    )
  }
}

// Taro 4.x 配置必须独立导出
ProfilePage.config = {
  navigationBarTitleText: '个人主页',
  enablePullDownRefresh: true,
  navigationBarBackgroundColor: '#ffffff',
  navigationBarTextStyle: 'black'
}
