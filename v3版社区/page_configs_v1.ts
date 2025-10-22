// ieclub-taro/src/pages/community/index.config.ts
// 社区列表页面配置
export default definePageConfig({
  navigationBarTitleText: '社区',
  enablePullDownRefresh: true,
  backgroundTextStyle: 'dark'
});

// ieclub-taro/src/pages/community/profile/index.config.ts
// 个人主页页面配置
export default definePageConfig({
  navigationBarTitleText: '个人主页',
  enablePullDownRefresh: false
});

// ieclub-taro/src/pages/community/ranking/index.config.ts
// 排行榜页面配置（第二版本新增）
export default definePageConfig({
  navigationBarTitleText: '贡献排行榜',
  enablePullDownRefresh: true,
  backgroundTextStyle: 'dark'
});

// ieclub-taro/src/pages/community/matching/index.config.ts
// 智能匹配页面配置（第三版本新增）
export default definePageConfig({
  navigationBarTitleText: '智能匹配',
  enablePullDownRefresh: true,
  backgroundTextStyle: 'dark'
});

// ieclub-taro/src/pages/community/matching/detail/index.config.ts
// 相似度详情页配置（第三版本新增）
export default definePageConfig({
  navigationBarTitleText: '相似度详情',
  enablePullDownRefresh: false
});
