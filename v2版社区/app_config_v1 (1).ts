// ieclub-taro/src/app.config.ts
// 应用配置 - 使用自定义 TabBar

export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/notifications/index',
    'pages/profile/index',
    'pages/search/index',
    
    // 话题模块
    'pages/topics/index',
    'pages/topics/create/index',
    'pages/topics/detail/index',
    
    // 社区模块
    'pages/community/index',
    'pages/community/profile/index',
    'pages/community/ranking/index',  // 第二版本新增
  ],
  
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'IEClub',
    navigationBarTextStyle: 'black'
  },
  
  // 使用自定义 TabBar
  tabBar: {
    custom: true,
    color: '#999999',
    selectedColor: '#667eea',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '广场'
      },
      {
        pagePath: 'pages/community/index',
        text: '社区'
      },
      {
        pagePath: 'pages/topics/create/index',
        text: '发布'
      },
      {
        pagePath: 'pages/notifications/index',
        text: '消息'
      },
      {
        pagePath: 'pages/profile/index',
        text: '主页'
      }
    ]
  }
});
