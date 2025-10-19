// src/app.config.ts
export default defineAppConfig({
  // 页面路径配置
  pages: [
    'pages/plaza/index',      // 首页-话题广场
    'pages/detail/index',     // 话题详情
    'pages/create/index',     // 创建话题
    'pages/login/index',      // 登录
    'pages/profile/index',    // 个人中心
    'pages/notification/index' // 通知
  ],

  // 窗口配置
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#667eea',
    navigationBarTitleText: 'IEclub',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f8f9fa',
    enablePullDownRefresh: true
  },

  // TabBar配置（小程序用，H5会自动隐藏或转换）
  tabBar: {
    color: '#999999',
    selectedColor: '#667eea',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/plaza/index',
        text: '广场'
        // 暂时移除图标，后续用CSS实现
      },
      {
        pagePath: 'pages/notification/index',
        text: '通知'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
})

// 导出配置函数
function defineAppConfig(config: any) {
  return config
}