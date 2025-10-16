// src/services/request.ts - HTTP请求封装

import Taro from '@tarojs/taro'

const BASE_URL = process.env.TARO_APP_API_URL || 'https://api.ieclub.com'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  needAuth?: boolean
}

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 统一请求封装
 */
export async function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header = {}, needAuth = true } = options

  // 添加认证头
  if (needAuth) {
    const token = Taro.getStorageSync('token')
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
  }

  // 添加平台标识
  header['X-Platform'] = process.env.TARO_ENV || 'unknown'

  try {
    const response = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      timeout: 10000
    })

    const result = response.data as ApiResponse<T>

    // 统一处理响应
    if (result.code === 200) {
      return result.data
    } else if (result.code === 401) {
      // Token 过期，清除登录状态
      Taro.removeStorageSync('token')
      Taro.removeStorageSync('userInfo')
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      Taro.navigateTo({ url: '/pages/login/index' })
      throw new Error('未授权')
    } else {
      throw new Error(result.message || '请求失败')
    }
  } catch (error: any) {
    console.error('请求错误:', error)
    
    // 网络错误处理
    if (error.errMsg?.includes('timeout')) {
      Taro.showToast({
        title: '请求超时，请检查网络',
        icon: 'none'
      })
    } else if (error.errMsg?.includes('fail')) {
      Taro.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      })
    }
    
    throw error
  }
}


// ==================== src/services/user.ts - 用户API ====================

import { request } from './request'
import type { User, UserProfile, LoginParams, RegisterParams } from '../types'

/**
 * 用户登录
 */
export function login(params: LoginParams) {
  return request<{ token: string; user: User }>({
    url: '/api/auth/login',
    method: 'POST',
    data: params,
    needAuth: false
  })
}

/**
 * 用户注册
 */
export function register(params: RegisterParams) {
  return request<{ token: string; user: User }>({
    url: '/api/auth/register',
    method: 'POST',
    data: params,
    needAuth: false
  })
}

/**
 * 获取当前用户信息
 */
export function getUserProfile() {
  return request<{ user: User }>({
    url: '/api/user/profile',
    method: 'GET'
  })
}

/**
 * 更新用户信息
 */
export function updateUserProfile(data: Partial<UserProfile>) {
  return request<{ user: User }>({
    url: '/api/user/profile',
    method: 'PUT',
    data
  })
}

/**
 * 获取用户统计信息
 */
export function getUserStats(userId: string) {
  return request<{
    topicsCount: number
    commentsCount: number
    likesCount: number
    followersCount: number
    followingCount: number
  }>({
    url: `/api/user/${userId}/stats`,
    method: 'GET'
  })
}

/**
 * 关注用户
 */
export function followUser(userId: string) {
  return request({
    url: `/api/user/${userId}/follow`,
    method: 'POST'
  })
}

/**
 * 取消关注用户
 */
export function unfollowUser(userId: string) {
  return request({
    url: `/api/user/${userId}/unfollow`,
    method: 'POST'
  })
}


// ==================== src/services/topic.ts - 话题API ====================

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
    url: '/api/topics',
    method: 'GET',
    data: params
  })
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
 * 创建话题
 */
export function createTopic(data: CreateTopicParams) {
  return request<{ topic: Topic }>({
    url: '/api/topics',
    method: 'POST',
    data
  })
}

/**
 * 更新话题
 */
export function updateTopic(topicId: string, data: Partial<CreateTopicParams>) {
  return request<{ topic: Topic }>({
    url: `/api/topics/${topicId}`,
    method: 'PUT',
    data
  })
}

/**
 * 删除话题
 */
export function deleteTopic(topicId: string) {
  return request({
    url: `/api/topics/${topicId}`,
    method: 'DELETE'
  })
}

/**
 * 点赞话题
 */
export function likeTopic(topicId: string) {
  return request({
    url: `/api/topics/${topicId}/like`,
    method: 'POST'
  })
}

/**
 * 取消点赞
 */
export function unlikeTopic(topicId: string) {
  return request({
    url: `/api/topics/${topicId}/unlike`,
    method: 'POST'
  })
}

/**
 * 收藏话题
 */
export function favoriteTopic(topicId: string) {
  return request({
    url: `/api/topics/${topicId}/favorite`,
    method: 'POST'
  })
}

/**
 * 取消收藏
 */
export function unfavoriteTopic(topicId: string) {
  return request({
    url: `/api/topics/${topicId}/unfavorite`,
    method: 'POST'
  })
}

/**
 * 获取热门话题
 */
export function getHotTopics(limit = 10) {
  return request<{ topics: Topic[] }>({
    url: '/api/topics/hot',
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
    url: '/api/topics/search',
    method: 'GET',
    data: { keyword, page, limit }
  })
}


// ==================== src/services/comment.ts - 评论API ====================

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
    url: `/api/topics/${topicId}/comments`,
    method: 'GET',
    data: { page, limit }
  })
}

/**
 * 创建评论
 */
export function createComment(data: CreateCommentParams) {
  return request<{ comment: Comment }>({
    url: '/api/comments',
    method: 'POST',
    data
  })
}

/**
 * 删除评论
 */
export function deleteComment(commentId: string) {
  return request({
    url: `/api/comments/${commentId}`,
    method: 'DELETE'
  })
}

/**
 * 点赞评论
 */
export function likeComment(commentId: string) {
  return request({
    url: `/api/comments/${commentId}/like`,
    method: 'POST'
  })
}

/**
 * 取消点赞评论
 */
export function unlikeComment(commentId: string) {
  return request({
    url: `/api/comments/${commentId}/unlike`,
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
    url: `/api/comments/${commentId}/replies`,
    method: 'GET',
    data: { page, limit }
  })
}


// ==================== src/services/upload.ts - 文件上传API ====================

import Taro from '@tarojs/taro'

/**
 * 上传图片
 */
export async function uploadImage(filePath: string): Promise<string> {
  const token = Taro.getStorageSync('token')
  
  return new Promise((resolve, reject) => {
    Taro.uploadFile({
      url: `${BASE_URL}/api/upload/image`,
      filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data.data.url)
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        } catch (error) {
          reject(error)
        }
      },
      fail: (error) => {
        reject(error)
      }
    })
  })
}

/**
 * 批量上传图片
 */
export async function uploadImages(filePaths: string[]): Promise<string[]> {
  const uploadPromises = filePaths.map(filePath => uploadImage(filePath))
  return Promise.all(uploadPromises)
}


// ==================== src/services/notification.ts - 通知API ====================

import { request } from './request'
import type { Notification } from '../types'

/**
 * 获取通知列表
 */
export function getNotifications(page = 1, limit = 20) {
  return request<{
    notifications: Notification[]
    total: number
    hasMore: boolean
    unreadCount: number
  }>({
    url: '/api/notifications',
    method: 'GET',
    data: { page, limit }
  })
}

/**
 * 标记通知为已读
 */
export function markNotificationRead(notificationId: string) {
  return request({
    url: `/api/notifications/${notificationId}/read`,
    method: 'POST'
  })
}

/**
 * 标记所有通知为已读
 */
export function markAllNotificationsRead() {
  return request({
    url: '/api/notifications/read-all',
    method: 'POST'
  })
}

/**
 * 删除通知
 */
export function deleteNotification(notificationId: string) {
  return request({
    url: `/api/notifications/${notificationId}`,
    method: 'DELETE'
  })
}

/**
 * 获取未读通知数量
 */
export function getUnreadCount() {
  return request<{ count: number }>({
    url: '/api/notifications/unread-count',
    method: 'GET'
  })
}