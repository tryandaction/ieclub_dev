/**
 * IEClub 图标系统
 * 基于 Iconify，统一管理所有图标
 * 参考: README.md 中的图标映射表
 */

// 图标映射表 - 按照设计文档定义
export const IconMap = {
  // ===== TabBar 主导航图标 =====
  square: 'mdi:view-dashboard',           // 广场
  community: 'mdi:account-group',         // 社区  
  publish: 'mdi:plus-circle',             // 发布
  activities: 'mdi:calendar-star',        // 活动
  profile: 'mdi:account-circle',          // 我的
  
  // ===== 顶部导航功能图标 =====
  search: 'mdi:magnify',                  // 搜索
  filter: 'mdi:filter-variant',           // 筛选
  sort: 'mdi:sort-variant',               // 排序
  notification: 'mdi:bell',               // 通知
  notificationActive: 'mdi:bell-badge',   // 通知（有新消息）
  message: 'mdi:message-text',            // 消息
  settings: 'mdi:cog',                    // 设置
  menu: 'mdi:menu',                       // 菜单
  close: 'mdi:close',                     // 关闭
  back: 'mdi:arrow-left',                 // 返回
  
  // ===== 编辑与操作图标 =====
  edit: 'mdi:pencil',                     // 编辑
  delete: 'mdi:delete',                   // 删除
  share: 'mdi:share-variant',             // 分享
  more: 'mdi:dots-horizontal',            // 更多
  add: 'mdi:plus',                        // 添加
  remove: 'mdi:minus',                    // 移除
  refresh: 'mdi:refresh',                 // 刷新
  upload: 'mdi:cloud-upload',             // 上传
  download: 'mdi:cloud-download',         // 下载
  copy: 'mdi:content-copy',               // 复制
  link: 'mdi:link-variant',               // 链接
  
  // ===== 互动图标 =====
  like: 'mdi:heart-outline',              // 点赞
  liked: 'mdi:heart',                     // 已点赞
  comment: 'mdi:comment-outline',         // 评论
  commentFilled: 'mdi:comment',           // 评论（填充）
  view: 'mdi:eye-outline',                // 浏览
  bookmark: 'mdi:bookmark-outline',       // 收藏
  bookmarked: 'mdi:bookmark',             // 已收藏
  follow: 'mdi:account-plus',             // 关注
  following: 'mdi:account-check',         // 已关注
  unfollow: 'mdi:account-minus',          // 取消关注
  
  // ===== 话题类型图标 =====
  topicOffer: 'mdi:teach',                // 我来讲
  topicDemand: 'mdi:ear-hearing',         // 想听
  project: 'mdi:rocket-launch',           // 项目
  announcement: 'mdi:bullhorn',           // 公告
  
  // ===== 分类图标 =====
  study: 'mdi:school',                    // 学习
  research: 'mdi:flask',                  // 科研
  skill: 'mdi:tools',                     // 技能
  startup: 'mdi:lightbulb',               // 创业
  life: 'mdi:heart-pulse',                // 生活
  tech: 'mdi:laptop',                     // 技术
  design: 'mdi:palette',                  // 设计
  business: 'mdi:briefcase',              // 商业
  
  // ===== 活动图标 =====
  event: 'mdi:calendar-check',            // 活动
  location: 'mdi:map-marker',             // 地点
  time: 'mdi:clock-outline',              // 时间
  date: 'mdi:calendar',                   // 日期
  participants: 'mdi:account-multiple',   // 参与者
  online: 'mdi:monitor',                  // 线上
  offline: 'mdi:home-city',               // 线下
  hybrid: 'mdi:switch-icon',              // 混合
  
  // ===== 成就与排行图标 =====
  trophy: 'mdi:trophy',                   // 奖杯
  medal: 'mdi:medal',                     // 勋章
  star: 'mdi:star',                       // 星星
  starOutline: 'mdi:star-outline',        // 星星（空心）
  fire: 'mdi:fire',                       // 火焰（连续签到）
  trending: 'mdi:trending-up',            // 趋势
  ranking: 'mdi:podium',                  // 排行榜
  crown: 'mdi:crown',                     // 皇冠（第一名）
  level: 'mdi:chevron-up',                // 等级
  
  // ===== 用户相关图标 =====
  user: 'mdi:account',                    // 用户
  userCircle: 'mdi:account-circle',       // 用户圆形
  users: 'mdi:account-group',             // 多用户
  team: 'mdi:account-multiple',           // 团队
  admin: 'mdi:shield-account',            // 管理员
  verified: 'mdi:check-decagram',         // 认证
  vip: 'mdi:star-circle',                 // VIP
  
  // ===== 学业相关图标 =====
  school: 'mdi:school',                   // 学校
  education: 'mdi:book-education',        // 教育
  course: 'mdi:book-open-page-variant',   // 课程
  homework: 'mdi:file-document-edit',     // 作业
  exam: 'mdi:file-document',              // 考试
  certificate: 'mdi:certificate',         // 证书
  graduation: 'mdi:school',               // 毕业
  
  // ===== 技能相关图标 =====
  code: 'mdi:code-tags',                  // 编程
  database: 'mdi:database',               // 数据库
  ai: 'mdi:robot',                        // AI
  chart: 'mdi:chart-line',                // 图表/数据分析
  language: 'mdi:translate',              // 语言
  writing: 'mdi:pen',                     // 写作
  music: 'mdi:music',                     // 音乐
  camera: 'mdi:camera',                   // 摄影
  
  // ===== 状态图标 =====
  success: 'mdi:check-circle',            // 成功
  error: 'mdi:close-circle',              // 错误
  warning: 'mdi:alert',                   // 警告
  info: 'mdi:information',                // 信息
  help: 'mdi:help-circle',                // 帮助
  loading: 'mdi:loading',                 // 加载中
  
  // ===== 锁定与权限图标 =====
  lock: 'mdi:lock',                       // 锁定
  unlock: 'mdi:lock-open',                // 解锁
  visible: 'mdi:eye',                     // 可见
  hidden: 'mdi:eye-off',                  // 隐藏
  
  // ===== 文件与媒体图标 =====
  file: 'mdi:file',                       // 文件
  image: 'mdi:image',                     // 图片
  video: 'mdi:video',                     // 视频
  audio: 'mdi:music',                     // 音频
  document: 'mdi:file-document',          // 文档
  pdf: 'mdi:file-pdf-box',                // PDF
  
  // ===== 导航与方向图标 =====
  arrowLeft: 'mdi:arrow-left',            // 左箭头
  arrowRight: 'mdi:arrow-right',          // 右箭头
  arrowUp: 'mdi:arrow-up',                // 上箭头
  arrowDown: 'mdi:arrow-down',            // 下箭头
  chevronLeft: 'mdi:chevron-left',        // 左尖括号
  chevronRight: 'mdi:chevron-right',      // 右尖括号
  chevronUp: 'mdi:chevron-up',            // 上尖括号
  chevronDown: 'mdi:chevron-down',        // 下尖括号
  
  // ===== 社交媒体图标 =====
  wechat: 'mdi:wechat',                   // 微信
  qq: 'mdi:qqchat',                       // QQ
  github: 'mdi:github',                   // GitHub
  email: 'mdi:email',                     // 邮箱
  phone: 'mdi:phone',                     // 电话
  
  // ===== 其他常用图标 =====
  home: 'mdi:home',                       // 首页
  heart: 'mdi:heart',                     // 心
  gift: 'mdi:gift',                       // 礼物
  tag: 'mdi:tag',                         // 标签
  pin: 'mdi:pin',                         // 置顶
  flag: 'mdi:flag',                       // 标记
  check: 'mdi:check',                     // 勾选
  qrcode: 'mdi:qrcode',                   // 二维码
  history: 'mdi:history',                 // 历史
  palette: 'mdi:palette',                 // 调色板
};

// 获取图标名称（如果键不存在，返回默认图标）
export const getIcon = (key, fallback = 'mdi:help-circle') => {
  return IconMap[key] || fallback;
};

// 图标预设大小
export const IconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
};

// 图标颜色主题
export const IconColor = {
  primary: '#667eea',      // 主色
  secondary: '#764ba2',    // 次要色
  success: '#4caf50',      // 成功
  warning: '#ff9800',      // 警告
  error: '#f44336',        // 错误
  info: '#2196f3',         // 信息
  text: '#333333',         // 文本主色
  textSecondary: '#666666', // 文本次要色
  textTertiary: '#999999',  // 文本三级色
  white: '#ffffff',        // 白色
};

export default IconMap;

