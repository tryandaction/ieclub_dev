// ==================== 增强话题API服务 ====================

import Taro from '@tarojs/taro'
import { request } from './request'

// 获取API基础URL
function getApiBaseUrl(): string {
  const env = Taro.getEnv()
  
  switch (env) {
    case 'WEAPP':
      return 'https://api.ieclub.online/api'
    case 'H5':
      return '/api'  // 使用代理
    case 'RN':
      return 'https://api.ieclub.online/api'
    default:
      return '/api'  // 开发环境也使用代理
  }
}
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
 * 上传文档（小程序环境）
 */
export async function uploadDocument(filePath: string): Promise<DocumentAttachment> {
  // 在小程序环境中，使用Taro.uploadFile
  const token = Taro.getStorageSync('token')

  return new Promise((resolve, reject) => {
    Taro.uploadFile({
      url: `${getApiBaseUrl()}/api/v2/upload/document`,
      filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`,
        'X-Platform': Taro.getEnv() || 'unknown'
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data.data)
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        } catch (error) {
          reject(new Error('解析响应失败'))
        }
      },
      fail: (error) => {
        reject(new Error(error.errMsg || '上传失败'))
      }
    })
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