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
      currentTopic: state.currentTopic?.id === topicId
        ? { ...state.currentTopic, ...updates }
        : state.currentTopic
    }))
  }
}))


// ==================== src/store/matching.ts ====================

import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { findMatchingHelpers, findMatchingDemands } from '../services/matching'
import type { DemandMatchResult, EnhancedTopic } from '../types/enhanced'

interface MatchingState {
  // 能帮我的人
  helpers: DemandMatchResult[]
  
  // 我能帮的需求
  demands: Array<{
    topic: EnhancedTopic
    matchScore: number
    matchedSkills: string[]
  }>
  
  loading: boolean
  
  // Actions
  fetchHelpers: (params: any) => Promise<void>
  fetchMyOpportunities: () => Promise<void>
}

export const useMatchingStore = create<MatchingState>((set, get) => ({
  helpers: [],
  demands: [],
  loading: false,

  fetchHelpers: async (params) => {
    set({ loading: true })
    
    try {
      const res = await findMatchingHelpers(params)
      set({ helpers: res.matches, loading: false })
    } catch (error: any) {
      set({ loading: false })
      Taro.showToast({ title: error.message || '匹配失败', icon: 'none' })
    }
  },

  fetchMyOpportunities: async () => {
    set({ loading: true })
    
    try {
      const res = await findMatchingDemands({})
      set({ demands: res.demands, loading: false })
    } catch (error: any) {
      set({ loading: false })
      console.error('获取匹配需求失败:', error)
    }
  }
}))


// ==================== src/store/push.ts ====================

import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { getPushHistory, updateNotificationSettings } from '../services/push'
import type { PushNotification, NotificationSettings } from '../types/enhanced'

interface PushState {
  notifications: PushNotification[]
  unreadCount: number
  settings: NotificationSettings
  
  // Actions
  fetchNotifications: () => Promise<void>
  updateSettings: (settings: NotificationSettings) => Promise<void>
  markAsRead: (notificationId: string) => void
  clearAll: () => void
}

export const usePushStore = create<PushState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  settings: {
    enabled: true,
    types: {
      likes: true,
      comments: true,
      mentions: true,
      follows: true,
      matching: true,
      trending: true,
      daily: true,
      weekly: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    frequency: 'realtime',
    channels: {
      inApp: true,
      push: true,
      email: false,
      sms: false
    }
  },

  fetchNotifications: async () => {
    try {
      const res = await getPushHistory()
      set({
        notifications: res.notifications,
        unreadCount: res.unreadCount
      })
    } catch (error) {
      console.error('获取推送失败:', error)
    }
  },

  updateSettings: async (settings) => {
    try {
      await updateNotificationSettings(settings)
      set({ settings })
      Taro.showToast({ title: '设置已保存', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '保存失败', icon: 'none' })
    }
  },

  markAsRead: (notificationId) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }))
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 })
  }
}))


// ==================== src/hooks/useAnalytics.ts ====================

import { useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { trackPageView, trackAction } from '../services/analytics'

/**
 * 页面访问追踪 Hook
 */
export function usePageTracking() {
  const router = useRouter()
  
  useEffect(() => {
    const path = router.path
    const referrer = document.referrer || Taro.getStorageSync('lastPage')
    
    trackPageView(path, referrer)
    Taro.setStorageSync('lastPage', path)
    
    // 记录停留时间
    const startTime = Date.now()
    
    return () => {
      const duration = Date.now() - startTime
      trackAction('page_leave', {
        page: path,
        duration
      })
    }
  }, [router.path])
}

/**
 * 用户行为追踪 Hook
 */
export function useActionTracking() {
  const track = (action: string, properties?: Record<string, any>) => {
    trackAction(action, properties || {})
  }
  
  return { track }
}


// ==================== src/hooks/useRecommendation.ts ====================

import { useEffect } from 'react'
import { useEnhancedTopicStore } from '../store/enhanced-topic'

/**
 * 个性化推荐 Hook
 */
export function useRecommendation() {
  const { recommendedTopics, fetchRecommendations } = useEnhancedTopicStore()
  
  useEffect(() => {
    fetchRecommendations()
    
    // 每5分钟刷新一次推荐
    const interval = setInterval(() => {
      fetchRecommendations()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return recommendedTopics
}


// ==================== src/hooks/useMatching.ts ====================

import { useEffect } from 'react'
import { useMatchingStore } from '../store/matching'
import { useUserStore } from '../store/user'

/**
 * 供需匹配 Hook
 */
export function useMatching() {
  const { userInfo } = useUserStore()
  const { demands, fetchMyOpportunities } = useMatchingStore()
  
  useEffect(() => {
    if (userInfo?.skills && userInfo.skills.length > 0) {
      fetchMyOpportunities()
    }
  }, [userInfo?.skills])
  
  return {
    opportunities: demands,
    hasOpportunities: demands.length > 0
  }
}


// ==================== src/hooks/useRealtime.ts ====================

import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'

/**
 * 实时数据 Hook (WebSocket)
 */
export function useRealtime(topicId?: string) {
  const [realtimeData, setRealtimeData] = useState<{
    viewers: number
    commenters: number
    likers: number
  }>({
    viewers: 0,
    commenters: 0,
    likers: 0
  })
  
  useEffect(() => {
    if (!topicId) return
    
    // 建立 WebSocket 连接
    const socketTask = Taro.connectSocket({
      url: `wss://api.ieclub.com/ws/topic/${topicId}`
    })
    
    socketTask.onMessage((message) => {
      try {
        const data = JSON.parse(message.data as string)
        setRealtimeData(data)
      } catch (error) {
        console.error('解析实时数据失败:', error)
      }
    })
    
    socketTask.onError((error) => {
      console.error('WebSocket错误:', error)
    })
    
    return () => {
      socketTask.close({})
    }
  }, [topicId])
  
  return realtimeData
}


// ==================== src/utils/markdown.ts ====================

import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

/**
 * Markdown 渲染器配置
 */
export const md = new MarkdownIt({
  html: false,  // 不允许 HTML 标签（安全）
  linkify: true,  // 自动转换 URL 为链接
  typographer: true,  // 智能标点
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (error) {
        console.error('代码高亮失败:', error)
      }
    }
    return ''
  }
})

// 自定义规则：@提及
md.inline.ruler.before('emphasis', 'mention', (state, silent) => {
  const pos = state.pos
  const max = state.posMax
  
  if (state.src.charAt(pos) !== '@') return false
  
  const match = state.src.slice(pos).match(/^@([a-zA-Z0-9_]+)/)
  if (!match) return false
  
  if (!silent) {
    const token = state.push('mention', '', 0)
    token.content = match[1]
  }
  
  state.pos += match[0].length
  return true
})

// 自定义规则：#话题标签
md.inline.ruler.before('emphasis', 'hashtag', (state, silent) => {
  const pos = state.pos
  const max = state.posMax
  
  if (state.src.charAt(pos) !== '#') return false
  
  const match = state.src.slice(pos).match(/^#([^\s#]+)/)
  if (!match) return false
  
  if (!silent) {
    const token = state.push('hashtag', '', 0)
    token.content = match[1]
  }
  
  state.pos += match[0].length
  return true
})

/**
 * 渲染 Markdown
 */
export function renderMarkdown(content: string): string {
  return md.render(content)
}

/**
 * 提取 Markdown 中的标签
 */
export function extractTags(content: string): string[] {
  const regex = /#([^\s#]+)/g
  const tags: string[] = []
  let match
  
  while ((match = regex.exec(content)) !== null) {
    tags.push(match[1])
  }
  
  return [...new Set(tags)]  // 去重
}

/**
 * 提取 Markdown 中的@提及
 */
export function extractMentions(content: string): string[] {
  const regex = /@([a-zA-Z0-9_]+)/g
  const mentions: string[] = []
  let match
  
  while ((match = regex.exec(content)) !== null) {
    mentions.push(match[1])
  }
  
  return [...new Set(mentions)]
}


// ==================== src/utils/link-parser.ts ====================

import type { LinkCard } from '../types/enhanced'

/**
 * 检测链接类型
 */
export function detectLinkType(url: string): string {
  if (url.includes('mp.weixin.qq.com')) return 'wechat'
  if (url.includes('zhihu.com')) return 'zhihu'
  if (url.includes('bilibili.com')) return 'bilibili'
  if (url.includes('github.com')) return 'github'
  return 'general'
}

/**
 * 解析微信公众号文章
 */
export async function parseWechatArticle(url: string): Promise<LinkCard> {
  // 调用后端API解析
  const response = await fetch('/api/v2/parse-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, type: 'wechat' })
  })
  
  const data = await response.json()
  
  return {
    url,
    source: 'wechat',
    title: data.title,
    description: data.description || data.digest,
    coverImage: data.cover,
    metadata: {
      author: data.author,
      publishTime: new Date(data.publish_time * 1000),
      readTime: estimateReadTime(data.content)
    }
  }
}

/**
 * 解析知乎内容
 */
export async function parseZhihuContent(url: string): Promise<LinkCard> {
  const response = await fetch('/api/v2/parse-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, type: 'zhihu' })
  })
  
  const data = await response.json()
  
  return {
    url,
    source: 'zhihu',
    title: data.title,
    description: data.excerpt,
    coverImage: data.image_url,
    metadata: {
      author: data.author?.name,
      authorAvatar: data.author?.avatar_url,
      likes: data.voteup_count,
      views: data.visit_count
    }
  }
}

/**
 * 解析B站视频
 */
export async function parseBilibiliVideo(url: string): Promise<LinkCard> {
  const response = await fetch('/api/v2/parse-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, type: 'bilibili' })
  })
  
  const data = await response.json()
  
  return {
    url,
    source: 'bilibili',
    title: data.title,
    description: data.desc,
    coverImage: data.pic,
    metadata: {
      author: data.owner?.name,
      authorAvatar: data.owner?.face,
      views: data.stat?.view,
      likes: data.stat?.like
    }
  }
}

/**
 * 解析GitHub仓库
 */
export async function parseGithubRepo(url: string): Promise<LinkCard> {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!match) throw new Error('Invalid GitHub URL')
  
  const [, owner, repo] = match
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`
  
  const response = await fetch(apiUrl)
  const data = await response.json()
  
  return {
    url,
    source: 'github',
    title: data.full_name,
    description: data.description,
    coverImage: data.owner.avatar_url,
    metadata: {
      author: data.owner.login,
      stars: data.stargazers_count,
      language: data.language,
      forks: data.forks_count
    }
  }
}

/**
 * 解析通用链接
 */
export async function parseGenericLink(url: string): Promise<LinkCard> {
  const response = await fetch('/api/v2/parse-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, type: 'general' })
  })
  
  const data = await response.json()
  
  return {
    url,
    source: 'general',
    title: data.title || url,
    description: data.description || '',
    coverImage: data.image || data.icon || '/default-link-cover.png',
    favicon: data.icon,
    metadata: data.metadata || {}
  }
}

// 辅助函数：估算阅读时间
function estimateReadTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.length / 2  // 中文按字符数除以2估算
  return Math.ceil(wordCount / wordsPerMinute)
}