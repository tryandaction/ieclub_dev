// ==================== 评论API服务（增强版） ====================

import { request } from './request'
import type { Comment, CreateCommentParams } from '../types'

/**
 * 获取评论列表
 */
export function getCommentList(topicId: string, page = 1, limit = 20) {
   return request<{
     comments: Comment[]
     total: number
     hasMore: boolean
   }>({
     url: `/topics/${topicId}/comments`,
     method: 'GET',
     data: { page, limit }
   })
 }

/**
 * 创建评论
 */
export function createComment(data: CreateCommentParams) {
   return request<{ comment: Comment }>({
     url: '/comments',
     method: 'POST',
     data
   })
 }

/**
 * 删除评论
 */
export function deleteComment(commentId: string) {
   return request({
     url: `/comments/${commentId}`,
     method: 'DELETE'
   })
 }

/**
 * 点赞评论
 */
export function likeComment(commentId: string) {
   return request({
     url: `/comments/${commentId}/like`,
     method: 'POST'
   })
 }

/**
 * 取消点赞评论
 */
export function unlikeComment(commentId: string) {
   return request({
     url: `/comments/${commentId}/unlike`,
     method: 'POST'
   })
 }

/**
 * 获取评论的回复
 */
export function getCommentReplies(commentId: string, page = 1, limit = 10) {
   return request<{
     comments: Comment[]
     total: number
     hasMore: boolean
   }>({
     url: `/comments/${commentId}/replies`,
     method: 'GET',
     data: { page, limit }
   })
 }