// src/app.config.ts - 应用配置和路由定义

export default defineAppConfig({
  // ===== 页面路由配置 =====
  // 注意：只包含 tabBar 页面和独立页面，话题相关页面通过导航跳转访问
  pages: [
    'pages/index/index',              // 首页（话题广场）- tabBar 第1项
    'pages/square/index',             // 话题广场（新版）- tabBar 第1项（替代首页）
    'pages/notifications/index',      // 通知中心 - tabBar 第2项
    'pages/profile/index',            // 个人中心 - tabBar 第3项
    'pages/login/index',              // 登录页面（独立页面）
    'pages/search/index',             // 搜索页面（独立页面）
    'pages/topics/create/index',      // 创建话题（通过导航跳转）
    'pages/topics/detail/index'       // 话题详情（通过导航跳转）
  ],

  // ===== 窗口配置 =====
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'IEClub',
    navigationBarTextStyle: 'black',
    enablePullDownRefresh: false
  },

  // ===== 底部导航栏配置 =====
  tabBar: {
    color: '#999999',
    selectedColor: '#667eea',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/square/index',
        text: '广场',
        iconPath: 'assets/icons/square.png',
        selectedIconPath: 'assets/icons/square-active.png'
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
  }
})