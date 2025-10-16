// ==================== 话题API服务（增强版） ====================

import { request } from './request'
import type { Topic, CreateTopicParams, TopicListParams } from '../types'

/**
 * 获取话题列表
 */
export function getTopicList(params: TopicListParams) {
   return request<{
     topics: Topic[]
     total: number
     hasMore: boolean
   }>({
     url: '/topics',
     method: 'GET',
     data: params
   })
 }

/**
 * 获取话题详情
 */
export function getTopicDetail(topicId: string) {
   return request<{ topic: Topic }>({
     url: `/topics/${topicId}`,
     method: 'GET'
   })
 }

/**
 * 创建话题
 */
export function createTopic(data: CreateTopicParams) {
   return request<{ topic: Topic }>({
     url: '/topics',
     method: 'POST',
     data
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
 * 点赞话题
 */
export function likeTopic(topicId: string) {
   return request({
     url: `/topics/${topicId}/like`,
     method: 'POST'
   })
 }

/**
 * 取消点赞
 */
export function unlikeTopic(topicId: string) {
   return request({
     url: `/topics/${topicId}/unlike`,
     method: 'POST'
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