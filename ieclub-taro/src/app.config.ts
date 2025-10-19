// src/app.config.ts - 融入开发代码的页面结构和设计
export default defineAppConfig({
  // 页面路径配置 - 融入开发代码的核心功能，保留现有页面结构
  pages: [
    'pages/plaza/index',       // 首页-话题广场（保留原有）
    'pages/create-topic/index', // 创建话题（保留原有）
    'pages/detail/index',      // 话题详情（保留原有）
    'pages/login/index',       // 登录（保留原有）
    'pages/profile/index',     // 个人中心（保留原有）
    'pages/notification/index', // 通知（保留原有）
    'pages/square/index',      // 新增：话题广场（开发代码核心功能）
    'pages/create/index',      // 新增：创建话题/项目（开发代码）
    'pages/search/index'       // 新增：搜索页（开发代码）
  ],

  // 窗口配置 - 保留原有配置，同时融入开发代码的设计元素
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#667eea',  // 保留原有颜色
    navigationBarTitleText: 'IEclub',         // 保留原有名称格式
    navigationBarTextStyle: 'white',
    backgroundColor: '#f8f9fa',               // 保留原有背景色
    enablePullDownRefresh: true
  },

  // TabBar配置 - 保留原有配置，同时融入开发代码的设计元素
  tabBar: {
    color: '#999999',
    selectedColor: '#667eea',  // 保留原有颜色，但融入渐变概念
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