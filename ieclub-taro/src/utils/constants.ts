// 前端常量配置（完善版）
import Taro from '@tarojs/taro'

// 获取API基础URL
function getApiBaseUrl(): string {
  const env = Taro.getEnv()
  
  switch (env) {
    case 'WEAPP':
      return 'https://api.ieclub.online'
    case 'H5':
      // 开发环境使用后端地址，生产环境使用相对路径
      if (typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:3000'
        }
        return window.location.origin
      }
      return 'http://localhost:3000' // 服务端渲染时的默认值
    case 'RN':
      return 'https://api.ieclub.online'
    default:
      return 'http://localhost:3000'
  }
}

// 延迟初始化，避免在模块加载时访问window
let _apiBaseUrl: string | null = null
export function getAPI_BASE_URL(): string {
  if (_apiBaseUrl === null) {
    _apiBaseUrl = getApiBaseUrl()
  }
  return _apiBaseUrl
}

// 为了向后兼容，保留常量导出，但使用函数调用
export const API_BASE_URL = getAPI_BASE_URL()

// 是否启用Mock数据（开发时使用）
export const USE_MOCK = false

// 分页配置
export const PAGE_SIZE = 20;

// 文件上传配置
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_IMAGE_COUNT = 9;

// 话题类型
export const TOPIC_TYPES = [
  { value: 'discussion', label: '讨论', icon: '💬' },
  { value: 'demand', label: '需求', icon: '🔍' },
  { value: 'supply', label: '供给', icon: '🎁' },
  { value: 'question', label: '问答', icon: '❓' },
  { value: 'activity', label: '活动', icon: '🎉' },
  { value: 'cooperation', label: '合作', icon: '🤝' },
];

// 需求类型
export const DEMAND_TYPES = [
  { value: '人员', label: '人员', icon: '👥' },
  { value: '技术', label: '技术', icon: '⚙️' },
  { value: '资金', label: '资金', icon: '💰' },
  { value: '场地', label: '场地', icon: '🏢' },
  { value: '设备', label: '设备', icon: '🖥️' },
  { value: '合作', label: '合作', icon: '🤝' },
];

// 话题分类
export const CATEGORIES = [
  { value: '技术', label: '技术', color: '#3cc51f' },
  { value: '学术', label: '学术', color: '#667eea' },
  { value: '生活', label: '生活', color: '#f59e0b' },
  { value: '活动', label: '活动', color: '#ec4899' },
  { value: '其他', label: '其他', color: '#8b5cf6' },
];

// 通知类型
export const NOTIFICATION_TYPES = {
  system: { label: '系统通知', color: '#3cc51f' },
  like: { label: '点赞', color: '#ff6b6b' },
  comment: { label: '评论', color: '#667eea' },
  follow: { label: '关注', color: '#f59e0b' },
  match: { label: '匹配', color: '#ec4899' },
};

// 用户等级配置
export const USER_LEVELS = [
  { level: 1, name: '新手', minPoints: 0, color: '#999' },
  { level: 2, name: '初级', minPoints: 100, color: '#3cc51f' },
  { level: 3, name: '中级', minPoints: 500, color: '#667eea' },
  { level: 4, name: '高级', minPoints: 1000, color: '#f59e0b' },
  { level: 5, name: '专家', minPoints: 2000, color: '#ec4899' },
  { level: 6, name: '大师', minPoints: 5000, color: '#8b5cf6' },
];

// 积分奖励规则
export const POINT_RULES = {
  dailyCheckin: 2,
  createTopic: 10,
  createComment: 5,
  receiveLike: 2,
  receiveComment: 3,
};

// 缓存键名
export const CACHE_KEYS = {
  USER_INFO: 'userInfo',
  TOKEN: 'token',
  SETTINGS: 'settings',
  SEARCH_HISTORY: 'searchHistory',
};

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  SERVER_ERROR: '服务器错误，请稍后重试',
  UNAUTHORIZED: '请先登录',
  FORBIDDEN: '没有权限执行此操作',
  NOT_FOUND: '请求的资源不存在',
  VALIDATION_ERROR: '输入数据格式错误',
};