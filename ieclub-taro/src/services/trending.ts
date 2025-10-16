// ==================== 热点服务 ====================

import { request } from './request'
// import type { TrendingKeyword } from '../types/enhanced'

/**
 * 获取热点关键词
 */
export function getTrendingKeywords(limit = 10) {
  return request<{
    keywords: any[] // TrendingKeyword[]
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
    topics: any[] // EnhancedTopic[]
    discussionCount: number
  }>({
    url: '/api/v2/trending/topics',
    method: 'GET',
    data: { keyword }
  })
}