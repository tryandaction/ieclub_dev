// ==================== IEClub 应用配置优化版 ====================

export default defineAppConfig({
  // ===== 页面路由配置 =====
  // 主tabBar页面 + 独立功能页面，按访问频率排序
  pages: [
    // TabBar 页面（高频访问）
    'pages/square/index',             // 话题广场 - 主入口
    'pages/notifications/index',      // 通知中心 - 互动提醒
    'pages/profile/index',            // 个人中心 - 用户信息

    // 独立功能页面（按需访问）
    'pages/login/index',              // 登录注册 - 认证入口
    'pages/search/index',             // 搜索功能 - 内容查找

    // 话题相关页面（通过导航访问）
    'pages/topics/create/index',      // 创建话题 - 发布入口
    'pages/topics/detail/index',      // 话题详情 - 内容查看
    'pages/topics/index'              // 话题列表 - 分类浏览
  ],

  // ===== 窗口配置优化 =====
  window: {
    // 基础视觉配置
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'IEClub',
    navigationBarTextStyle: 'black',

    // 交互功能配置
    enablePullDownRefresh: true,
    onReachBottomDistance: 50,

    // 导航栏增强
    navigationStyle: 'default',
    backgroundColor: '#f8fafc',
    backgroundColorTop: '#ffffff',
    backgroundColorBottom: '#f8fafc'
  },

  // 使用自定义 TabBar - 纯文字版本优化
  tabBar: {
    custom: true,
    color: '#999999',
    selectedColor: '#667eea',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/square/index',
        text: '广场'
      },
      {
        pagePath: 'pages/search/index',
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

})