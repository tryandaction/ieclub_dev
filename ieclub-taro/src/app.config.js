export default {
  pages: [
    'pages/plaza/index',
    'pages/community/index',
    'pages/activities/index',
    'pages/profile/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'IEClub',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999',
    selectedColor: '#8b5cf6',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/plaza/index',
        text: '广场',
        iconPath: './assets/tab-plaza.png',
        selectedIconPath: './assets/tab-plaza-active.png'
      },
      {
        pagePath: 'pages/community/index',
        text: '社区',
        iconPath: './assets/tab-community.png',
        selectedIconPath: './assets/tab-community-active.png'
      },
      {
        pagePath: 'pages/activities/index',
        text: '活动',
        iconPath: './assets/tab-activity.png',
        selectedIconPath: './assets/tab-activity-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tab-profile.png',
        selectedIconPath: './assets/tab-profile-active.png'
      }
    ]
  }
}
