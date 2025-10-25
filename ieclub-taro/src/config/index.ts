// IEClub 全局配置文件

export const APP_CONFIG = {
  // 应用信息
  appName: 'IEClub',
  version: '2.0.0',
  description: '知识共享，共同成长',
  
  // API配置
  apiBaseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.ieclub.com'
    : 'http://localhost:3000',
  
  // 超时配置
  timeout: 10000,
  
  // 分页配置
  pageSize: 20,
  
  // 图片配置
  maxImageSize: 10 * 1024 * 1024, // 10MB
  maxImageCount: 9,
  imageQuality: 0.8,
  
  // 文本配置
  maxTitleLength: 100,
  maxContentLength: 5000,
  maxCommentLength: 500,
  
  // 缓存配置
  cacheExpire: 7 * 24 * 60 * 60 * 1000, // 7天
  
  // 主题色
  theme: {
    primary: '#5B7FFF',
    secondary: '#764ba2',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',
  },
  
  // 内容类型
  contentTypes: {
    topic_offer: { name: '我来讲', color: '#5B7FFF', icon: 'mdi:microphone' },
    topic_demand: { name: '想听', color: '#FF6B9D', icon: 'mdi:ear-hearing' },
    project: { name: '项目', color: '#FFA500', icon: 'mdi:lightbulb-on' },
  },
  
  // 活动状态
  activityStatus: {
    upcoming: { name: '即将开始', color: '#5B7FFF' },
    ongoing: { name: '进行中', color: '#FFA500' },
    ended: { name: '已结束', color: '#999' },
  },
  
  // 通知类型
  notificationTypes: {
    like: { icon: 'mdi:heart', color: '#FF6B9D' },
    comment: { icon: 'mdi:comment', color: '#5B7FFF' },
    follow: { icon: 'mdi:account-plus', color: '#FFA500' },
    system: { icon: 'mdi:bell', color: '#7C4DFF' },
  },
}

// 导出类型
export type ContentType = keyof typeof APP_CONFIG.contentTypes
export type ActivityStatus = keyof typeof APP_CONFIG.activityStatus
export type NotificationType = keyof typeof APP_CONFIG.notificationTypes

