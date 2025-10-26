export default {
  pages: [
    'pages/login/index',           // 登录页作为首页
    'pages/square/index',
    'pages/community/index',
    'pages/publish/index',
    'pages/activities/index',
    'pages/profile/index',
    'pages/search/index',
    'pages/notifications/index',
    'pages/topics/detail/index',
    'pages/topics/create/index',
  ],
  
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'IEClub',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f5f5'
  },
  
  tabBar: {
    custom: true,
    color: '#999999',
    selectedColor: '#5B7FFF',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/square/index',
        text: '广场'
      },
      {
        pagePath: 'pages/community/index',
        text: '社区'
      },
      {
        pagePath: 'pages/publish/index',
        text: '发布'
      },
      {
        pagePath: 'pages/activities/index',
        text: '活动'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
}
