// ==================== IEClub 应用配置优化版 ====================

export default {
  // ===== 页面路由配置 =====
  // 主tabBar页面 + 独立功能页面，按访问频率排序
  pages: [
    // TabBar 页面（高频访问）- 必须按 tabBar 顺序排列
    'pages/square/index',             // 话题广场 - 主入口
    'pages/community/index',          // 社区 - 用户发现
    'pages/activities/index',         // 活动 - 活动列表
    'pages/profile/index',            // 我的 - 个人中心

    // 独立功能页面（按需访问）
    'pages/login/index',              // 登录注册 - 认证入口
    'pages/forgot-password/index',    // 忘记密码

    // 话题相关页面（通过导航访问）
    'pages/topics/detail/index',      // 话题详情 - 内容查看
    'pages/topics/create/index',      // 创建话题 - 发布入口
    'pages/topics/index',             // 话题列表 - 分类浏览

    // 活动相关页面
    'pages/activities/detail/index',  // 活动详情
    'pages/activities/create/index',  // 创建活动

    // 社区相关页面
    'pages/notifications/index',      // 通知中心 - 互动提醒
    'pages/search/index',             // 搜索功能 - 内容查找
    'pages/community/profile/index'   // 社区个人资料页
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

  // 使用自定义 TabBar - 4个Tab布局（中间+按钮不占用tab位置）
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
        pagePath: 'pages/community/index',
        text: '社区'
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