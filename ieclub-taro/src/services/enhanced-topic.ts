// ==================== 增强话题API服务 ====================

import { request } from './request'
import type {
  EnhancedTopic,
  CreateEnhancedTopicParams,
  QuickActionRequest,
  DocumentAttachment,
  LinkCard
} from '../types'

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