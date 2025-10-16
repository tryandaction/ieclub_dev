// ==================== src/services/enhanced-topic.ts ====================

import { request } from './request'
import type { 
  EnhancedTopic, 
  CreateEnhancedTopicParams, 
  QuickActionRequest,
  DocumentAttachment,
  LinkCard
} from '../types/enhanced'

/**
 * 获取增强话题列表（含推荐）
 */
export function getEnhancedTopics(params: {
  page?: number
  limit?: number
  type?: 'personalized' | 'trending' | 'latest' | 'matched'
  category?: string
  demandType?: string
}) {
  return request<{
    topics: EnhancedTopic[]
    total: number
    hasMore: boolean
  }>({
    url: '/api/v2/topics',
    method: 'GET',
    data: params
  })
}

/**
 * 创建增强话题
 */
export function createEnhancedTopic(data: CreateEnhancedTopicParams) {
  return request<{ topic: EnhancedTopic }>({
    url: '/api/v2/topics',
    method: 'POST',
    data
  })
}

/**
 * 快速操作（想听、我来分享等）
 */
export function performQuickAction(data: QuickActionRequest) {
  return request({
    url: '/api/v2/topics/quick-action',
    method: 'POST',
    data
  })
}

/**
 * 上传文档
 */
export async function uploadDocument(file: File): Promise<DocumentAttachment> {
  const formData = new FormData()
  formData.append('file', file)
  
  // 这里需要使用原生上传，不能用 Taro.uploadFile
  // 因为需要返回完整的文档信息
  return request({
    url: '/api/v2/upload/document',
    method: 'POST',
    data: formData
  })
}

/**
 * 解析链接卡片
 */
export function parseLinkCard(url: string) {
  return request<LinkCard>({
    url: '/api/v2/parse-link',
    method: 'POST',
    data: { url }
  })
}

/**
 * 获取热门话题
 */
export function getHotTopicsEnhanced(limit = 10) {
  return request<{
    hotTopics: Array<{
      topic: EnhancedTopic
      hotScore: number
      rank: number
      trendingKeywords: string[]
    }>
  }>({
    url: '/api/v2/topics/hot',
    method: 'GET',
    data: { limit }
  })
}

/**
 * 获取个性化推荐
 */
export function getPersonalizedRecommendations(count = 20) {
  return request<{
    topics: EnhancedTopic[]
    reasons: Record<string, string>  // topicId -> reason
  }>({
    url: '/api/v2/recommendations',
    method: 'GET',
    data: { count }
  })
}


// ==================== src/services/matching.ts ====================

import type { DemandMatchResult, SkillTag } from '../types/enhanced'

/**
 * 技能匹配 - 找到能帮你的人
 */
export function findMatchingHelpers(params: {
  topicId?: string
  skillsRequired: string[]
  urgency?: string
  location?: string
  limit?: number
}) {
  return request<{
    matches: DemandMatchResult[]
    total: number
  }>({
    url: '/api/v2/matching/helpers',
    method: 'POST',
    data: params
  })
}

/**
 * 需求匹配 - 找到你能帮的人
 */
export function findMatchingDemands(params: {
  skills?: string[]
  limit?: number
}) {
  return request<{
    demands: Array<{
      topic: EnhancedTopic
      matchScore: number
      matchedSkills: string[]
    }>
  }>({
    url: '/api/v2/matching/demands',
    method: 'GET',
    data: params
  })
}

/**
 * 更新用户技能标签
 */
export function updateUserSkills(skills: SkillTag[]) {
  return request({
    url: '/api/v2/user/skills',
    method: 'PUT',
    data: { skills }
  })
}


// ==================== src/services/push.ts ====================

import type { PushNotification, NotificationSettings } from '../types/enhanced'

/**
 * 订阅推送
 */
export function subscribePush(params: {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}) {
  return request({
    url: '/api/v2/push/subscribe',
    method: 'POST',
    data: params
  })
}

/**
 * 更新通知设置
 */
export function updateNotificationSettings(settings: NotificationSettings) {
  return request({
    url: '/api/v2/notifications/settings',
    method: 'PUT',
    data: settings
  })
}

/**
 * 获取推送历史
 */
export function getPushHistory(page = 1, limit = 20) {
  return request<{
    notifications: PushNotification[]
    unreadCount: number
  }>({
    url: '/api/v2/push/history',
    method: 'GET',
    data: { page, limit }
  })
}


// ==================== src/services/trending.ts ====================

import type { TrendingKeyword } from '../types/enhanced'

/**
 * 获取热点关键词
 */
export function getTrendingKeywords(limit = 10) {
  return request<{
    keywords: TrendingKeyword[]
  }>({
    url: '/api/v2/trending/keywords',
    method: 'GET',
    data: { limit }
  })
}

/**
 * 获取热点话题
 */
export function getTrendingTopics(keyword: string) {
  return request<{
    topics: EnhancedTopic[]
    discussionCount: number
  }>({
    url: '/api/v2/trending/topics',
    method: 'GET',
    data: { keyword }
  })
}


// ==================== src/services/analytics.ts ====================

import type { AnalyticsEvent } from '../types/enhanced'

/**
 * 上报埋点事件
 */
export function trackEvent(event: AnalyticsEvent) {
  // 使用 sendBeacon 保证上报成功
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(event)], { type: 'application/json' })
    navigator.sendBeacon('/api/v2/analytics/track', blob)
  } else {
    // 降级到普通请求
    request({
      url: '/api/v2/analytics/track',
      method: 'POST',
      data: event,
      needAuth: false
    }).catch(() => {
      // 忽略错误，不影响用户体验
    })
  }
}

/**
 * 上报页面访问
 */
export function trackPageView(page: string, referrer?: string) {
  trackEvent({
    eventType: 'page_view',
    sessionId: getSessionId(),
    timestamp: new Date(),
    properties: { page, referrer },
    page,
    referrer,
    device: getDeviceInfo()
  })
}

/**
 * 上报用户行为
 */
export function trackAction(action: string, properties: Record<string, any>) {
  trackEvent({
    eventType: 'user_action',
    sessionId: getSessionId(),
    timestamp: new Date(),
    properties: { action, ...properties },
    device: getDeviceInfo()
  })
}

// 辅助函数
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('sessionId')
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('sessionId', sessionId)
  }
  return sessionId
}

function getDeviceInfo() {
  const ua = navigator.userAgent
  return {
    type: /mobile/i.test(ua) ? 'mobile' : /tablet/i.test(ua) ? 'tablet' : 'desktop',
    os: getOS(ua),
    browser: getBrowser(ua)
  }
}

function getOS(ua: string): string {
  if (/windows/i.test(ua)) return 'Windows'
  if (/mac/i.test(ua)) return 'macOS'
  if (/linux/i.test(ua)) return 'Linux'
  if (/android/i.test(ua)) return 'Android'
  if (/ios|iphone|ipad/i.test(ua)) return 'iOS'
  return 'Unknown'
}

function getBrowser(ua: string): string {
  if (/firefox/i.test(ua)) return 'Firefox'
  if (/chrome/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua)) return 'Safari'
  if (/edge/i.test(ua)) return 'Edge'
  return 'Unknown'
}


// ==================== src/store/enhanced-topic.ts ====================

import { create } from 'zustand'
import Taro from '@tarojs/taro'
import {
  getEnhancedTopics,
  createEnhancedTopic,
  performQuickAction,
  getPersonalizedRecommendations
} from '../services/enhanced-topic'
import type { EnhancedTopic, CreateEnhancedTopicParams } from '../types/enhanced'

interface EnhancedTopicState {
  topics: EnhancedTopic[]
  hotTopics: EnhancedTopic[]
  recommendedTopics: EnhancedTopic[]
  currentTopic: EnhancedTopic | null
  
  feedType: 'personalized' | 'trending' | 'latest' | 'matched'
  hasMore: boolean
  loading: boolean
  
  // Actions
  setFeedType: (type: 'personalized' | 'trending' | 'latest' | 'matched') => void
  fetchTopics: (params?: any, append?: boolean) => Promise<void>
  fetchRecommendations: () => Promise<void>
  createTopic: (data: CreateEnhancedTopicParams) => Promise<EnhancedTopic>
  handleQuickAction: (topicId: string, actionType: string) => Promise<void>
  updateTopicInList: (topicId: string, updates: Partial<EnhancedTopic>) => void
}

export const useEnhancedTopicStore = create<EnhancedTopicState>((set, get) => ({
  topics: [],
  hotTopics: [],
  recommendedTopics: [],
  currentTopic: null,
  feedType: 'personalized',
  hasMore: true,
  loading: false,

  setFeedType: (type) => {
    set({ feedType: type, topics: [] })
    get().fetchTopics({ type })
  },

  fetchTopics: async (params = {}, append = false) => {
    const { feedType, topics } = get()
    set({ loading: true })
    
    try {
      const res = await getEnhancedTopics({
        page: append ? Math.ceil(topics.length / 20) + 1 : 1,
        limit: 20,
        type: feedType,
        ...params
      })
      
      set({
        topics: append ? [...topics, ...res.topics] : res.topics,
        hasMore: res.hasMore,
        loading: false
      })
    } catch (error: any) {
      set({ loading: false })
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
      throw error
    }
  },

  fetchRecommendations: async () => {
    try {
      const res = await getPersonalizedRecommendations(10)
      set({ recommendedTopics: res.topics })
    } catch (error) {
      console.error('获取推荐失败:', error)
    }
  },

  createTopic: async (data) => {
    try {
      const res = await createEnhancedTopic(data)
      
      set(state => ({
        topics: [res.topic, ...state.topics]
      }))
      
      Taro.showToast({ title: '发布成功', icon: 'success' })
      return res.topic
    } catch (error: any) {
      Taro.showToast({ title: error.message || '发布失败', icon: 'none' })
      throw error
    }
  },

  handleQuickAction: async (topicId, actionType) => {
    try {
      await performQuickAction({ topicId, actionType })
      
      // 更新本地状态
      const topic = get().topics.find(t => t.id === topicId)
      if (topic) {
        const userId = Taro.getStorageSync('userInfo')?.id
        if (userId) {
          const actionKey = `${actionType}` as keyof typeof topic.quickActions
          const currentUsers = topic.quickActions[actionKey] || []
          
          get().updateTopicInList(topicId, {
            quickActions: {
              ...topic.quickActions,
              [actionKey]: [...currentUsers, userId]
            },
            stats: {
              ...topic.stats,
              [`${actionType}Count`]: (topic.stats as any)[`${actionType}Count`] + 1
            }
          })
        }
      }
      
      Taro.showToast({ title: '操作成功', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
      throw error
    }
  },

  updateTopicInList: (topicId, updates) => {
    set(state => ({
      topics: state.topics.map(topic =>
        topic.id === topicId ? { ...topic, ...updates } : topic
      ),
      currentTopic: state.currentTopic?.id === topicI