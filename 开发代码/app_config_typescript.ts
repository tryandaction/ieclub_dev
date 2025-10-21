// ieclub-taro/src/app.config.ts
export default defineAppConfig({
  pages: [
    'pages/index/index',           // 广场（首页）
    'pages/notifications/index',    // 通知
    'pages/profile/index',          // 个人中心
    'pages/topics/create/index',    // 创建话题
    'pages/topics/detail/index',    // 话题详情
    'pages/search/index',           // 搜索
    'pages/login/index',            // 登录
  ],
  
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'IEClub',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f8f9ff'
  },

  // 使用自定义 TabBar
  tabBar: {
    custom: true,
    color: '#9ca3af',
    selectedColor: '#3b82f6',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '广场'
      },
      {
        pagePath: 'pages/index/index', // 社区暂时指向广场
        text: '社区'
      },
      {
        pagePath: 'pages/topics/create/index',
        text: ''
      },
      {
        pagePath: 'pages/notifications/index',
        text: '通知'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
});