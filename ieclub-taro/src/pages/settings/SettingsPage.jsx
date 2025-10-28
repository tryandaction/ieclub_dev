import { Component } from 'react'
import { View, Text, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './SettingsPage.scss'

/**
 * 设置页 - 小程序版本
 * 提供应用设置、通知管理、隐私设置等功能
 */
export default class SettingsPage extends Component {
  state = {
    pushEnabled: true,
    themeMode: 'light'
  }

  handleBack = () => {
    Taro.navigateBack()
  }

  handleClearCache = () => {
    Taro.showModal({
      title: '清除缓存',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.clearStorage()
          Taro.showToast({
            title: '缓存已清除',
            icon: 'success',
            duration: 2000
          })
        }
      }
    })
  }

  handleTogglePush = (e) => {
    const enabled = e.detail.value
    this.setState({ pushEnabled: enabled })
    Taro.showToast({
      title: enabled ? '已开启推送' : '已关闭推送',
      icon: 'none',
      duration: 1500
    })
  }

  handleAbout = () => {
    Taro.showModal({
      title: '关于IEClub',
      content: 'IEClub - 南方科技大学跨学科交流社区\n\n版本：v2.0.0\n开发团队：IEClub Dev Team',
      showCancel: false,
      confirmText: '确定'
    })
  }

  handlePrivacy = () => {
    Taro.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私保护...\n\n详细内容请访问官网查看完整隐私政策。',
      showCancel: false,
      confirmText: '确定'
    })
  }

  render() {
    const { pushEnabled } = this.state

  return (
      <View className="settings-page">
        <View className="page-header">
          <Text className="header-icon">⚙️</Text>
          <Text className="header-title">设置</Text>
        </View>

        {/* 通知设置 */}
        <View className="settings-section">
          <Text className="section-title">通知设置</Text>
          <View className="setting-item">
            <View className="setting-label">
              <Text className="label-icon">🔔</Text>
              <Text className="label-text">推送通知</Text>
            </View>
            <Switch 
              checked={pushEnabled}
              onChange={this.handleTogglePush}
              color="#8b5cf6"
            />
          </View>
        </View>

        {/* 应用设置 */}
        <View className="settings-section">
          <Text className="section-title">应用设置</Text>
          
          <View className="setting-item clickable" onClick={this.handleClearCache} hoverClass="item-hover">
            <View className="setting-label">
              <Text className="label-icon">🗑️</Text>
              <Text className="label-text">清除缓存</Text>
            </View>
            <Text className="setting-arrow">›</Text>
          </View>
        </View>

        {/* 关于 */}
        <View className="settings-section">
          <Text className="section-title">关于</Text>
          
          <View className="setting-item clickable" onClick={this.handleAbout} hoverClass="item-hover">
            <View className="setting-label">
              <Text className="label-icon">📢</Text>
              <Text className="label-text">关于我们</Text>
            </View>
            <Text className="setting-arrow">›</Text>
          </View>

          <View className="setting-item clickable" onClick={this.handlePrivacy} hoverClass="item-hover">
            <View className="setting-label">
              <Text className="label-icon">📄</Text>
              <Text className="label-text">隐私政策</Text>
            </View>
            <Text className="setting-arrow">›</Text>
          </View>
        </View>

        {/* 版本信息 */}
        <View className="version-info">
          <Text className="version-text">IEClub v2.0.0</Text>
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
SettingsPage.config = {
  navigationBarTitleText: '设置',
  enablePullDownRefresh: false,
  navigationBarBackgroundColor: '#ffffff',
  navigationBarTextStyle: 'black'
}
