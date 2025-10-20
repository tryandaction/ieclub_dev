export default defineAppConfig({
  pages: [
    'pages/index/index',              // 首页（话题广场）✅
    'pages/topics/index/index',       // 话题列表
    'pages/topics/create/index',      // 创建话题
    'pages/topics/detail/index',      // 话题详情
    'pages/login/index',              // 登录页面
    'pages/profile/index',            // 个人中心
    'pages/notifications/index',      // 通知中心
    'pages/search/index'              // 搜索页面
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'IEClub',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#666',
    selectedColor: '#667eea',
    backgroundColor: '#fff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
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