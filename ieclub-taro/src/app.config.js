// Taro H5 应用配置
// 由于我们使用 React Router 进行路由管理，这里只保留一个占位页面
export default {
  pages: [
    'pages/index/index' // Taro 要求的占位页面
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'IEClub',
    navigationBarTextStyle: 'black',
    navigationStyle: 'custom' // 使用自定义导航栏
  }
}