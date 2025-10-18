// ==================== 话题API服务（增强版） ====================

import { request } from './request'
import type { Topic, CreateTopicParams, TopicListParams } from '../types'

// 整合开发代码中的类型定义改进
export interface CreateTopicData {
  title: string
  content: string
  type: 'supply' | 'demand' | 'discussion'
  tags: string[]
}

/**
 * 获取话题列表
 */
export async function getTopicList(params: any) {
  const response = await request({
    url: '/api/topics', // 路径包含 /api
    method: 'GET',
    data: params,
    needAuth: false
  })

  return {
    topics: response.data || [],
    pagination: response.pagination || { page: 1, limit: 20, total: 0 }
  }
}

/**
 * 获取话题详情
 */
export function getTopicDetail(topicId: string) {
    return request<{ topic: Topic }>({
      url: `/api/topics/${topicId}`,
      method: 'GET'
    })
  }

/**
 * 创建话题 - 需要认证
 */
export function createTopic(data: CreateTopicParams) {
    return request<{ topic: Topic }>({
      url: '/api/topics',
      method: 'POST',
      data,
      needAuth: true // 标记需要认证
    })
  }

/**
 * 更新话题
 */
export function updateTopic(topicId: string, data: Partial<CreateTopicParams>) {
   return request<{ topic: Topic }>({
     url: `/topics/${topicId}`,
     method: 'PUT',
     data
   })
 }

/**
 * 删除话题
 */
export function deleteTopic(topicId: string) {
   return request({
     url: `/topics/${topicId}`,
     method: 'DELETE'
   })
 }

/**
 * 点赞话题 - 需要认证
 */
export function likeTopic(topicId: string) {
    return request({
      url: `/api/topics/${topicId}/like`,
      method: 'POST',
      needAuth: true
    })
  }

/**
 * 取消点赞 - 需要认证
 */
export function unlikeTopic(topicId: string) {
    return request({
      url: `/api/topics/${topicId}/like`,
      method: 'DELETE',
      needAuth: true
    })
  }

/**
 * 收藏话题
 */
export function favoriteTopic(topicId: string) {
   return request({
     url: `/topics/${topicId}/favorite`,
     method: 'POST'
   })
 }

/**
 * 取消收藏
 */
export function unfavoriteTopic(topicId: string) {
   return request({
     url: `/topics/${topicId}/unfavorite`,
     method: 'POST'
   })
 }

/**
 * 获取热门话题
 */
export function getHotTopics(limit = 10) {
   return request<{ topics: Topic[] }>({
     url: '/topics/hot',
     method: 'GET',
     data: { limit }
   })
 }

/**
 * 搜索话题
 */
export function searchTopics(keyword: string, page = 1, limit = 20) {
   return request<{
     topics: Topic[]
     total: number
     hasMore: boolean
   }>({
     url: '/topics/search',
     method: 'GET',
     data: { keyword, page, limit }
   })
 }