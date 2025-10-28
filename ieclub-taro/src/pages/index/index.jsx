import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

/**
 * 小程序首页
 * 展示 IEClub 主要功能入口和导航
 */
export default class Index extends Component {

  state = {
    userInfo: null
  }

  /**
   * 页面加载时执行
   */
  componentDidMount() {
    const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development'
    if (isDev) {
      console.log('[Index] Page mounted')
    }
    this.loadUserInfo()
  }

  /**
   * 页面显示时执行
   */
  componentDidShow() {
    const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development'
    if (isDev) {
      console.log('[Index] Page show')
    }
  }

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    try {
      const { data } = await Taro.getStorage({ key: 'userInfo' })
      if (data) {
        this.setState({ userInfo: data })
      }
    } catch (error) {
      // 用户未登录
      const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development'
      if (isDev) {
        console.log('[Index] No user info found')
      }
    }
  }

  /**
   * 通用导航方法
   * @param {string} url 目标页面路径
   */
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

  /**
   * 菜单项配置
   */
  menuItems = [
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

  /**
   * 渲染菜单项
   */
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
    const { userInfo } = this.state

    return (
      <View className="index-container">
        {/* 页面头部 */}
        <View className="header">
          <Text className="title">欢迎来到 IEClub</Text>
          <Text className="subtitle">连接兴趣，发现精彩</Text>
          {userInfo && (
            <Text className="user-greeting">你好，{userInfo.nickname || '用户'}</Text>
          )}
        </View>

        {/* 功能菜单 */}
        <View className="menu-list">
          {this.menuItems.map(this.renderMenuItem)}
        </View>

        {/* 页面底部 */}
        <View className="footer">
          <Text className="footer-text">Powered by Taro</Text>
        </View>
      </View>
    )
  }
}

// Taro 4.x 配置必须独立导出
Index.config = {
  navigationBarTitleText: 'IEClub',
  enablePullDownRefresh: false,
  navigationBarBackgroundColor: '#ffffff',
  navigationBarTextStyle: 'black'
}
