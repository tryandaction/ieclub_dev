// src/app.tsx - 应用入口文件

import { Component, PropsWithChildren } from 'react'
import { useUserStore } from './store/user'
import { useNotificationStore } from './store/notification'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  const { checkLoginStatus } = useUserStore()
  const { fetchUnreadCount } = useNotificationStore()

  // 应用启动时检查登录状态
  Component.useEffect(() => {
    const init = async () => {
      const isLogin = await checkLoginStatus()
      
      if (isLogin) {
        // 如果已登录，获取未读消息数
        fetchUnreadCount()
      }
    }
    
    init()
  }, [])

  return children
}

export default App


// ==================== src/app.config.ts - 应用配置 ====================

export default defineAppConfig({
  pages: [
    'pages/topics/index',
    'pages/topic-detail/index',
    'pages/create-topic/index',
    'pages/login/index',
    'pages/profile/index',
    'pages/notifications/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'IEClub',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f5f5'
  },
  tabBar: {
    color: '#999',
    selectedColor: '#667eea',
    backgroundColor: '#fff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/topics/index',
        text: '广场',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png'
      },
      {
        pagePath: 'pages/notifications/index',
        text: '通知',
        iconPath: 'assets/icons/notification.png',
        selectedIconPath: 'assets/icons/notification-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/profile.png',
        selectedIconPath: 'assets/icons/profile-active.png'
      }
    ]
  },
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于小程序位置接口的效果展示'
    }
  }
})


// ==================== src/app.scss - 全局样式 ====================

@import './styles/variables.scss';
@import './styles/mixins.scss';

page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f5f5f5;
  color: #333;
  font-size: 14px;
  line-height: 1.6;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

view, text, image, button {
  box-sizing: border-box;
}

button {
  border: none;
  outline: none;
  background: none;
  font-family: inherit;
}

button::after {
  border: none;
}


// ==================== src/styles/variables.scss - 样式变量 ====================

// 颜色变量
$primary-color: #667eea;
$primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$success-color: #10b981;
$warning-color: #f59e0b;
$error-color: #ef4444;
$info-color: #3b82f6;

$text-primary: #333;
$text-secondary: #666;
$text-tertiary: #999;
$text-white: #fff;

$bg-primary: #fff;
$bg-secondary: #f5f5f5;
$bg-tertiary: #f0f0f0;

$border-color: #e5e7eb;
$border-light: #f0f0f0;

// 间距
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$spacing-xl: 20px;
$spacing-xxl: 24px;

// 字体大小
$font-xs: 12px;
$font-sm: 13px;
$font-md: 14px;
$font-lg: 16px;
$font-xl: 18px;
$font-xxl: 20px;

// 圆角
$radius-sm: 4px;
$radius-md: 8px;
$radius-lg: 12px;
$radius-xl: 16px;
$radius-circle: 50%;

// 阴影
$shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
$shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
$shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.1);

// 过渡
$transition-fast: 0.2s ease;
$transition-base: 0.3s ease;
$transition-slow: 0.5s ease;


// ==================== src/styles/mixins.scss - 样式混入 ====================

// 文本省略
@mixin text-ellipsis($lines: 1) {
  overflow: hidden;
  text-overflow: ellipsis;
  
  @if $lines == 1 {
    white-space: nowrap;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
  }
}

// 居中
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@mixin flex-start {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

// 清除浮动
@mixin clearfix {
  &::after {
    content: '';
    display: table;
    clear: both;
  }
}

// 渐变背景
@mixin gradient-bg($start, $end, $deg: 135deg) {
  background: linear-gradient($deg, $start 0%, $end 100%);
}

// 响应式
@mixin responsive($breakpoint) {
  @if $breakpoint == mobile {
    @media (max-width: 768px) {
      @content;
    }
  } @else if $breakpoint == tablet {
    @media (min-width: 769px) and (max-width: 1024px) {
      @content;
    }
  } @else if $breakpoint == desktop {
    @media (min-width: 1025px) {
      @content;
    }
  }
}


// ==================== src/pages/login/index.tsx - 登录页面 ====================

import { View, Input, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../store/user'
import './index.scss'

export default function LoginPage() {
  const { login, register } = useUserStore()
  
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    // 验证
    if (!email || !password) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (!isLogin && !nickname) {
      Taro.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        await login({ email, password })
      } else {
        await register({ email, password, nickname })
      }

      // 登录成功后跳转
      Taro.switchTab({ url: '/pages/topics/index' })
    } catch (error) {
      console.error('登录/注册失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='login-header'>
        <View className='logo'>🎓</View>
        <View className='title'>IEClub</View>
        <View className='subtitle'>跨学科交流平台</View>
      </View>

      <View className='login-form'>
        {!isLogin && (
          <View className='form-item'>
            <Input
              className='input'
              placeholder='请输入昵称'
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
            />
          </View>
        )}

        <View className='form-item'>
          <Input
            className='input'
            placeholder='请输入邮箱'
            type='text'
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Input
            className='input'
            placeholder='请输入密码'
            type='password'
            password
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <Button 
          className='submit-btn'
          onClick={handleSubmit}
          loading={loading}
        >
          {isLogin ? '登录' : '注册'}
        </Button>

        <View className='switch-mode' onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? '没有账号？立即注册' : '已有账号？立即登录'}
        </View>
      </View>
    </View>
  )
}


// ==================== src/pages/login/index.config.ts ====================

export default definePageConfig({
  navigationBarTitleText: '登录',
  navigationStyle: 'custom'
})


// ==================== src/pages/login/index.scss ====================

.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 40px;

  .login-header {
    text-align: center;
    margin-bottom: 60px;

    .logo {
      font-size: 80px;
      margin-bottom: 20px;
    }

    .title {
      font-size: 32px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .login-form {
    .form-item {
      margin-bottom: 20px;

      .input {
        width: 100%;
        height: 50px;
        padding: 0 20px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 25px;
        font-size: 16px;
      }
    }

    .submit-btn {
      width: 100%;
      height: 50px;
      border-radius: 25px;
      background: #fff;
      color: #667eea;
      font-size: 16px;
      font-weight: 600;
      margin-top: 30px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .switch-mode {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
    }
  }
}


// ==================== src/pages/profile/index.tsx - 个人中心页面 ====================

import { View, Image, Text, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../store/user'
import { getUserStats } from '../../services/user'
import './index.scss'

export default function ProfilePage() {
  const { userInfo, isLogin, logout } = useUserStore()
  const [stats, setStats] = useState({
    topicsCount: 0,
    commentsCount: 0,
    likesCount: 0,
    followersCount: 0,
    followingCount: 0
  })

  useEffect(() => {
    if (isLogin && userInfo) {
      loadStats()
    }
  }, [isLogin, userInfo])

  const loadStats = async () => {
    if (!userInfo) return

    try {
      const data = await getUserStats(userInfo.id)
      setStats(data)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
        }
      }
    })
  }

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const goToEdit = () => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }

  if (!isLogin || !userInfo) {
    return (
      <View className='profile-page'>
        <View className='not-login'>
          <View className='icon'>👤</View>
          <Text className='text'>请先登录</Text>
          <Button className='login-btn' onClick={goToLogin}>
            立即登录
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className='profile-page'>
      {/* 用户信息卡片 */}
      <View className='user-card'>
        <View className='card-bg'></View>
        <View className='user-info'>
          <Image className='avatar' src={userInfo.avatar} mode='aspectFill' />
          <View className='info'>
            <Text className='nickname'>{userInfo.nickname}</Text>
            <Text className='bio'>{userInfo.bio || '这个人很懒，什么都没写~'}</Text>
          </View>
          <View className='edit-btn' onClick={goToEdit}>
            编辑
          </View>
        </View>

        {/* 统计数据 */}
        <View className='stats'>
          <View className='stat-item'>
            <Text className='value'>{stats.topicsCount}</Text>
            <Text className='label'>话题</Text>
          </View>
          <View className='stat-item'>
            <Text className='value'>{stats.likesCount}</Text>
            <Text className='label'>获赞</Text>
          </View>
          <View className='stat-item'>
            <Text className='value'>{stats.followersCount}</Text>
            <Text className='label'>粉丝</Text>
          </View>
          <View className='stat-item'>
            <Text className='value'>{stats.followingCount}</Text>
            <Text className='label'>关注</Text>
          </View>
        </View>
      </View>

      {/* 功能菜单 */}
      <View className='menu-section'>
        <View className='menu-item'>
          <View className='menu-icon'>📝</View>
          <Text className='menu-label'>我的话题</Text>
          <View className='menu-arrow'>›</View>
        </View>
        <View className='menu-item'>
          <View className='menu-icon'>❤️</View>
          <Text className='menu-label'>我的收藏</Text>
          <View className='menu-arrow'>›</View>
        </View>
        <View className='menu-item'>
          <View className='menu-icon'>💬</View>
          <Text className='menu-label'>我的评论</Text>
          <View className='menu-arrow'>›</View>
        </View>
      </View>

      <View className='menu-section'>
        <View className='menu-item'>
          <View className='menu-icon'>⚙️</View>
          <Text className='menu-label'>设置</Text>
          <View className='menu-arrow'>›</View>
        </View>
        <View className='menu-item'>
          <View className='menu-icon'>❓</View>
          <Text className='menu-label'>帮助与反馈</Text>
          <View className='menu-arrow'>›</View>
        </View>
      </View>

      {/* 退出登录 */}
      <View className='logout-section'>
        <Button className='logout-btn' onClick={handleLogout}>
          退出登录
        </Button>
      </View>
    </View>
  )
}


// ==================== src/pages/profile/index.config.ts ====================

export default definePageConfig({
  navigationBarTitleText: '我的',
  enablePullDownRefresh: false
})


// ==================== src/pages/profile/index.scss ====================

.profile-page {
  min-height: 100vh;
  background: #f5f5f5;

  .not-login {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;

    .icon {
      font-size: 80px;
      margin-bottom: 20px;
    }

    .text {
      font-size: 16px;
      color: #999;
      margin-bottom: 30px;
    }

    .login-btn {
      padding: 12px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border-radius: 25px;
      font-size: 16px;
    }
  }

  .user-card {
    position: relative;
    margin-bottom: 12px;
    background: #fff;
    overflow: hidden;

    .card-bg {
      height: 120px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .user-info {
      display: flex;
      align-items: flex-start;
      padding: 0 20px 20px;
      margin-top: -40px;
      position: relative;

      .avatar {
        width: 80px;
        height: 80px;
        border-radius: 40px;
        border: 4px solid #fff;
        margin-right: 16px;
      }

      .info {
        flex: 1;
        padding-top: 50px;

        .nickname {
          display: block;
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .bio {
          font-size: 14px;
          color: #999;
          line-height: 1.5;
        }
      }

      .edit-btn {
        padding: 6px 16px;
        background: #f5f5f5;
        border-radius: 15px;
        font-size: 14px;
        color: #666;
        margin-top: 50px;
      }
    }

    .stats {
      display: flex;
      padding: 20px;
      border-top: 1px solid #f0f0f0;

      .stat-item {
        flex: 1;
        text-align: center;

        .value {
          display: block;
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .label {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }

  .menu-section {
    margin-bottom: 12px;
    background: #fff;

    .menu-item {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .menu-icon {
        font-size: 24px;
        margin-right: 12px;
      }

      .menu-label {
        flex: 1;
        font-size: 15px;
        color: #333;
      }

      .menu-arrow {
        font-size: 20px;
        color: #ccc;
      }
    }
  }

  .logout-section {
    padding: 20px;

    .logout-btn {
      width: 100%;
      height: 48px;
      border-radius: 24px;
      background: #fff;
      color: #ef4444;
      font-size: 16px;
      border: 1px solid #ef4444;
    }
  }
}


// ==================== src/pages/notifications/index.tsx - 通知页面 ====================

import { View, ScrollView, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useNotificationStore } from '../../store/notification'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatRelativeTime } from '../../utils/format'
import './index.scss'

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount,
    hasMore,
    loading,
    fetchNotifications,
    markAllRead
  } = useNotificationStore()

  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      await fetchNotifications(1)
    } catch (error) {
      console.error('加载通知失败:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchNotifications(1)
    } finally {
      setRefreshing(false)
    }
  }

  const onLoadMore = async () => {
    if (!hasMore || loading) return

    try {
      const currentPage = Math.ceil(notifications.length / 20)
      await fetchNotifications(currentPage + 1, true)
    } catch (error) {
      console.error('加载更多失败:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const handleNotificationClick = (notification: any) => {
    // 根据通知类型跳转到相应页面
    if (notification.topicId) {
      Taro.navigateTo({
        url: `/pages/topic-detail/index?id=${notification.topicId}`
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    const icons = {
      like: '❤️',
      comment: '💬',
      reply: '↩️',
      follow: '👤',
      system: '🔔'
    }
    return icons[type] || '📢'
  }

  return (
    <View className='notifications-page'>
      {/* 头部操作栏 */}
      {unreadCount > 0 && (
        <View className='header-actions'>
          <Text className='unread-count'>{unreadCount} 条未读</Text>
          <View className='mark-read-btn' onClick={handleMarkAllRead}>
            全部已读
          </View>
        </View>
      )}

      {/* 通知列表 */}
      <ScrollView
        className='notifications-scroll'
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={onRefresh}
        onScrollToLower={onLoadMore}
        lowerThreshold={100}
      >
        {loading && notifications.length === 0 ? (
          <LoadingSpinner />
        ) : notifications.length === 0 ? (
          <EmptyState 
            title='暂无通知'
            description='你还没有收到任何通知'
          />
        ) : (
          <View className='notifications-list'>
            {notifications.map(notification => (
              <View
                key={notification.id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <View className='notification-icon'>
                  {getNotificationIcon(notification.type)}
                </View>

                <View className='notification-content'>
                  <Text className='title'>{notification.title}</Text>
                  <Text className='content'>{notification.content}</Text>
                  <Text className='time'>
                    {formatRelativeTime(notification.createdAt)}
                  </Text>
                </View>

                {!notification.isRead && (
                  <View className='unread-dot'></View>
                )}
              </View>
            ))}

            {hasMore && (
              <View className='load-more'>
                {loading ? '加载中...' : '上拉加载更多'}
              </View>
            )}

            {!hasMore && notifications.length > 0 && (
              <View className='no-more'>没有更多了</View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}


// ==================== src/pages/notifications/index.config.ts ====================

export default definePageConfig({
  navigationBarTitleText: '通知',
  enablePullDownRefresh: false
})


// ==================== src/pages/notifications/index.scss ====================

.notifications-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;

  .header-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;

    .unread-count {
      font-size: 14px;
      color: #666;
    }

    .mark-read-btn {
      padding: 6px 16px;
      background: #f5f5f5;
      border-radius: 12px;
      font-size: 13px;
      color: #667eea;
    }
  }

  .notifications-scroll {
    flex: 1;
    height: 0;
  }

  .notifications-list {
    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      background: #fff;
      border-bottom: 1px solid #f5f5f5;
      position: relative;

      &.unread {
        background: #f8f9ff;
      }

      .notification-icon {
        font-size: 32px;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .notification-content {
        flex: 1;

        .title {
          display: block;
          font-size: 15px;
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
        }

        .content {
          display: block;
          font-size: 14px;
          color: #666;
          line-height: 1.5;
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .time {
          font-size: 12px;
          color: #999;
        }
      }

      .unread-dot {
        width: 8px;
        height: 8px;
        border-radius: 4px;
        background: #ef4444;
        position: absolute;
        right: 16px;
        top: 20px;
      }
    }

    .load-more,
    .no-more {
      text-align: center;
      padding: 20px;
      font-size: 14px;
      color: #999;
    }
  }
}