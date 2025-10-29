/**
 * IEClub 常量定义
 * 包含颜色、图标、配置等常量
 */

// 品牌颜色
export const COLORS = {
  // 主色调
  primary: '#8b5cf6',
  primaryLight: '#a78bfa',
  primaryDark: '#7c3aed',
  
  // 渐变色
  gradientPrimary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  gradientSecondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  gradientAccent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  
  // 功能色
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // 中性色
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // 文字色
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  
  // 背景色
  background: '#f5f5f5',
  cardBackground: '#ffffff',
}

// 图标映射（使用 @iconify/react）
export const ICONS = {
  // TabBar图标
  square: 'mdi:view-dashboard',
  community: 'mdi:account-group',
  publish: 'mdi:plus-circle',
  activities: 'mdi:calendar-star',
  profile: 'mdi:account-circle',
  
  // 功能图标
  search: 'mdi:magnify',
  filter: 'mdi:filter-variant',
  sort: 'mdi:sort-variant',
  notification: 'mdi:bell',
  message: 'mdi:message-text',
  settings: 'mdi:cog',
  edit: 'mdi:pencil',
  delete: 'mdi:delete',
  share: 'mdi:share-variant',
  bookmark: 'mdi:bookmark',
  bookmarked: 'mdi:bookmark-check',
  
  // 互动图标
  like: 'mdi:heart-outline',
  liked: 'mdi:heart',
  comment: 'mdi:comment-outline',
  view: 'mdi:eye-outline',
  follow: 'mdi:account-plus',
  following: 'mdi:account-check',
  
  // 话题类型图标
  topicOffer: 'mdi:teach',
  topicDemand: 'mdi:ear-hearing',
  project: 'mdi:rocket-launch',
  
  // 分类图标
  study: 'mdi:school',
  research: 'mdi:flask',
  skill: 'mdi:tools',
  startup: 'mdi:lightbulb',
  life: 'mdi:heart-pulse',
  
  // 活动图标
  event: 'mdi:calendar-check',
  location: 'mdi:map-marker',
  time: 'mdi:clock-outline',
  participants: 'mdi:account-multiple',
  
  // 成就图标
  trophy: 'mdi:trophy',
  medal: 'mdi:medal',
  star: 'mdi:star',
  fire: 'mdi:fire',
  trending: 'mdi:trending-up',
}

// 话题类型
export const TOPIC_TYPES = {
  OFFER: 'offer',      // 我来讲
  DEMAND: 'demand',    // 想听
  PROJECT: 'project',  // 项目
}

// 话题分类
export const TOPIC_CATEGORIES = {
  STUDY: 'study',      // 学习
  RESEARCH: 'research', // 科研
  SKILL: 'skill',      // 技能
  STARTUP: 'startup',  // 创业
  LIFE: 'life',        // 生活
}

// 用户等级
export const USER_LEVELS = {
  NEWBIE: { min: 0, max: 100, name: '新手', color: '#6b7280' },
  INTERMEDIATE: { min: 101, max: 500, name: '进阶', color: '#3b82f6' },
  ADVANCED: { min: 501, max: 1000, name: '高级', color: '#8b5cf6' },
  EXPERT: { min: 1001, max: 2000, name: '专家', color: '#f59e0b' },
  MASTER: { min: 2001, max: Infinity, name: '大师', color: '#ef4444' },
}

// API配置
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.ieclub.online' 
    : 'http://localhost:3000',
  TIMEOUT: 10000,
}

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
}

// 文件上传配置
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
}

// 缓存配置
export const CACHE_CONFIG = {
  USER_INFO_TTL: 30 * 60 * 1000, // 30分钟
  TOPICS_TTL: 5 * 60 * 1000,      // 5分钟
  SEARCH_TTL: 2 * 60 * 1000,      // 2分钟
}

// 动画配置
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_OUT: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    EASE_IN: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    EASE_IN_OUT: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  },
}
