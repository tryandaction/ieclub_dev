// Taro 应用配置
// H5环境使用 React Router，小程序环境使用分包配置
export default {
  pages: [
    'pages/index/index' // 主包入口页面
  ],
  // 小程序分包配置（H5环境会忽略）
  subPackages: [
    {
      root: 'pages/events',
      pages: [
        'EventDetailPage'
      ]
    },
    {
      root: 'pages/profile',
      pages: [
        'ProfilePage'
      ]
    },
    {
      root: 'pages/settings',
      pages: [
        'SettingsPage'
      ]
    },
    {
      root: 'pages/notifications',
      pages: [
        'NotificationsPage'
      ]
    }
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'IEClub',
    navigationBarTextStyle: 'black'
  }
}