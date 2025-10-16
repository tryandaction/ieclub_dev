// ==================== 全局类型定义 ====================

// 用户相关类型
export interface User {
  id: string
  username: string
  nickname: string
  email: string
  avatar: string
  bio?: string
  major?: string
  year?: string
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  nickname?: string
  bio?: string
  major?: string
  year?: string
  avatar?: string
}

// 认证相关类型
export interface LoginParams {
  email: string
  password: string
}

export interface RegisterParams {
  username: string
  email: string
  password: string
  nickname?: string
  major?: string
  year?: string
}

export interface RegisterFormParams {
  email: string
  password: string
  nickname: string
}

export interface LoginResponse {
  token: string
  user: User
}

// 话题相关类型
export interface Topic {
  id: string
  title: string
  content: string
  images?: string[]
  tags?: string[]
  category: string
  author: User
  viewsCount: number
  likesCount: number
  commentsCount: number
  isLiked?: boolean
  isFavorited?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTopicParams {
  title: string
  content: string
  category: string
  tags?: string[]
  images?: string[]
}

export interface TopicListParams {
  page?: number
  limit?: number
  sortBy?: 'latest' | 'hot' | 'featured'
  category?: string
  tag?: string
}

export interface TopicListResponse {
  topics: Topic[]
  total: number
  hasMore: boolean
}

// 评论相关类型
export interface Comment {
  id: string
  content: string
  author: User
  topicId: string
  parentId?: string
  replyTo?: {
    id: string
    content: string
    author: User
  }
  likesCount: number
  isLiked?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCommentParams {
  topicId: string
  content: string
  parentId?: string
}

export interface CommentListResponse {
  comments: Comment[]
  total: number
  hasMore: boolean
}

// 通知相关类型
export interface Notification {
  id: string
  type: 'like' | 'comment' | 'reply' | 'follow' | 'system'
  title: string
  content: string
  isRead: boolean
  topicId?: string
  commentId?: string
  fromUser: User
  createdAt: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  hasMore: boolean
  unreadCount: number
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页响应类型
export interface PaginationResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// 通用状态类型
export interface LoadingState {
  loading: boolean
  error?: string
}

// 上传相关类型
export interface UploadResult {
  url: string
  fileName: string
  fileSize: number
}

// ==================== 增强类型定义 ====================

// 增强用户类型
export interface EnhancedUser extends User {
  // 技能标签
  skills: string[]
  interests: string[]
  resources: string[]

  // 可用性
  availability: {
    timePerWeek: number  // 每周可用时间（小时）
    workType: ('remote' | 'onsite' | 'hybrid')[]
    compensationType: ('paid' | 'exchange' | 'volunteer')[]
  }

  // 匹配偏好
  preferences: {
    demandTypes: string[]
    notificationSettings: NotificationSettings
    messageStyle: 'formal' | 'friendly' | 'casual'
  }

  // 统计数据
  stats: {
    helpCount: number  // 帮助他人次数
    successRate: number  // 成功率
    avgResponseTime: number  // 平均响应时间（秒）
    reputation: number  // 信誉分
  }
}

// 增强话题类型
export interface EnhancedTopic {
  // 基础信息
  id: string
  title: string
  content: string
  authorId: string
  author: EnhancedUser

  // 内容类型
  contentType: 'text' | 'markdown' | 'rich'

  // 富媒体内容
  media: {
    images?: string[]
    documents?: DocumentAttachment[]
    videos?: VideoAttachment[]
    audio?: AudioAttachment[]
    linkCards?: LinkCard[]
  }

  // 分类标签
  category: string
  subCategory?: string
  tags: string[]

  // 供需信息
  demand?: {
    type: 'seeking' | 'offering' | 'collaboration'
    skillsRequired: string[]
    urgency: 'low' | 'medium' | 'high'
    compensation: ('paid' | 'exchange' | 'volunteer')[]
    location?: string
    duration?: string
    budget?: {
      min: number
      max: number
      currency: string
    }
    deadline?: Date
  }

  // 快速操作统计
  quickActions: {
    interested: string[]  // 想听的用户ID
    wantToShare: string[]  // 想分享的用户ID
    offeringHelp: string[]  // 提供帮助的用户ID
    haveResource: string[]  // 有资源的用户ID
  }

  // 互动统计
  stats: {
    views: number
    likes: number
    comments: number
    shares: number
    bookmarks: number
    interestedCount: number
    helpersCount: number
    realtimeViewers: number  // 实时在看人数
  }

  // 状态标记
  status: {
    isHot: boolean
    isTrending: boolean
    isFeatured: boolean
    isResolved?: boolean
    isPinned: boolean
  }

  // 推荐信息
  recommendation?: {
    reason: string
    score: number
    matchedSkills?: string[]
  }

  // 时间信息
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
}

// 附件类型
export interface DocumentAttachment {
  id: string
  type: 'pdf' | 'word' | 'ppt' | 'excel'
  name: string
  size: number
  url: string
  previewUrl?: string
  thumbnailUrl?: string
  pageCount?: number
  uploadedAt: Date
  downloadCount: number
}

export interface VideoAttachment {
  id: string
  name: string
  size: number
  duration: number
  url: string
  thumbnailUrl: string
  resolution: string
  format: string
  uploadedAt: Date
  playCount: number
}

export interface AudioAttachment {
  id: string
  name: string
  size: number
  duration: number
  url: string
  format: string
  uploadedAt: Date
  playCount: number
}

export interface LinkCard {
  url: string
  source: 'wechat' | 'zhihu' | 'bilibili' | 'github' | 'general'
  title: string
  description: string
  coverImage: string
  favicon?: string
  metadata: {
    author?: string
    authorAvatar?: string
    publishTime?: Date
    readTime?: number
    likes?: number
    views?: number
    [key: string]: any
  }
}

// 快速操作
export interface QuickActionButton {
  id: string
  label: string
  icon: string
  color: string
  bgColor?: string
  action: string
  tooltip: string
  count?: number
  active?: boolean
  visible?: boolean
}

export interface QuickActionConfig {
  topicType: string
  actions: QuickActionButton[]
}

// 推送通知
export interface PushNotification {
  id: string
  userId: string
  type: 'content' | 'interaction' | 'matching' | 'trending' | 'engagement' | 'system'
  title: string
  content: string
  icon?: string
  image?: string
  badge?: string
  data: {
    topicId?: string
    commentId?: string
    userId?: string
    demandId?: string
    [key: string]: any
  }
  cta?: {
    text: string
    action: string
    url?: string
    params?: Record<string, any>
  }
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduledAt?: Date
  sentAt?: Date
  deliveredAt?: Date
  openedAt?: Date
  clickedAt?: Date
  expiresAt?: Date
  isRead: boolean
}

export interface NotificationSettings {
  enabled: boolean
  types: {
    likes: boolean
    comments: boolean
    mentions: boolean
    follows: boolean
    matching: boolean
    trending: boolean
    daily: boolean
    weekly: boolean
  }
  quietHours: {
    enabled: boolean
    start: string  // HH:mm
    end: string    // HH:mm
  }
  frequency: 'realtime' | 'hourly' | 'daily'
  channels: {
    inApp: boolean
    push: boolean
    email: boolean
    sms: boolean
  }
}

// 匹配系统
export interface DemandMatchResult {
  user: EnhancedUser
  score: number
  matchedSkills: string[]
  reasons: string[]
  availability: boolean
  responseTime: number
  successRate: number
}

export interface SkillTag {
  id: string
  name: string
  category: string
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  verified: boolean
  endorsements: number
}

// 热点系统
export interface TrendingKeyword {
  word: string
  frequency: number
  growth: number  // 增长率
  sentiment: 'positive' | 'neutral' | 'negative'
  relatedTopics: string[]
  firstSeenAt: Date
  peakAt?: Date
}

export interface HotTopic {
  topic: EnhancedTopic
  hotScore: number
  rank: number
  trendingKeywords: string[]
  realtimeEngagement: {
    viewers: number
    commenters: number
    likers: number
  }
}

// 用户画像
export interface UserPortrait {
  userId: string

  // 行为特征
  behavior: {
    activeHours: number[]  // 活跃时段
    activeDays: number[]   // 活跃星期
    avgSessionTime: number
    topicsViewedPerSession: number
    engagementRate: number
  }

  // 内容偏好
  preferences: {
    categories: { name: string; weight: number }[]
    tags: { name: string; weight: number }[]
    contentTypes: { type: string; weight: number }[]
    authors: string[]
  }

  // 社交网络
  network: {
    followers: string[]
    following: string[]
    frequentInteractions: string[]
    communities: string[]
  }

  // 能力标签
  capabilities: {
    skills: SkillTag[]
    interests: string[]
    resources: string[]
  }

  // 信誉系统
  reputation: {
    score: number
    level: number
    badges: Badge[]
    reviews: Review[]
  }
}

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  earnedAt: Date
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface Review {
  id: string
  fromUserId: string
  rating: number
  comment: string
  tags: string[]
  createdAt: Date
}

// API 请求/响应
export interface CreateEnhancedTopicParams {
  title: string
  content: string
  contentType: 'text' | 'markdown' | 'rich'
  category: string
  subCategory?: string
  tags: string[]

  // 媒体文件
  images?: string[]
  documentIds?: string[]
  videoIds?: string[]
  audioIds?: string[]
  links?: string[]

  // 供需信息
  demand?: {
    type: 'seeking' | 'offering' | 'collaboration'
    skillsRequired: string[]
    urgency: 'low' | 'medium' | 'high'
    compensation: string[]
    location?: string
    duration?: string
    budget?: { min: number; max: number; currency: string }
    deadline?: Date
  }

  // 其他选项
  isPinned?: boolean
  expiresAt?: Date
}

export interface QuickActionRequest {
  topicId: string
  actionType: 'interested' | 'wantToShare' | 'offeringHelp' | 'haveResource'
  metadata?: Record<string, any>
}

export interface MatchingRequest {
  demandType?: string
  skills?: string[]
  location?: string
  urgency?: string
  limit?: number
}

export interface RecommendationRequest {
  userId: string
  count: number
  type?: 'personalized' | 'trending' | 'latest' | 'matched'
  excludeIds?: string[]
}

// 分析统计
export interface AnalyticsEvent {
  eventType: string
  userId?: string
  sessionId: string
  timestamp: Date
  properties: Record<string, any>
  page?: string
  referrer?: string
  device: {
    type: 'mobile' | 'tablet' | 'desktop'
    os: string
    browser: string
  }
}

export interface ConversionFunnel {
  step: string
  users: number
  rate: number
  avgTime: number
  dropoff: number
}

export interface ABTestVariant {
  id: string
  name: string
  allocation: number  // 0-1
  users: string[]
  metrics: {
    clicks: number
    conversions: number
    avgTime: number
  }
}

// 游戏化系统
export interface PointsTransaction {
  id: string
  userId: string
  amount: number
  type: 'earn' | 'spend'
  reason: string
  relatedId?: string
  createdAt: Date
}

export interface Level {
  level: number
  name: string
  pointsRequired: number
  badge: string
  privileges: string[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: string
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedBy: number  // 解锁人数
}

export interface UserProgress {
  userId: string
  level: number
  points: number
  nextLevelPoints: number
  achievements: string[]
  streak: number
  lastActiveDate: Date
}