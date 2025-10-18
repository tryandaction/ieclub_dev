// ==================== 用户API服务（增强版） ====================

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
 * 获取当前用户信息 - 需要认证
 */
export function getUserProfile() {
    return request<{ user: User }>({
      url: '/api/auth/me',
      method: 'GET',
      needAuth: true
    })
  }

/**
 * 更新用户信息 - 需要认证
 */
export function updateUserProfile(data: Partial<UserProfile>) {
    return request<{ user: User }>({
      url: '/api/auth/profile',
      method: 'PUT',
      data,
      needAuth: true
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
      url: `/api/users/${userId}/stats`,
      method: 'GET'
    })
  }

/**
 * 关注用户 - 需要认证
 */
export function followUser(userId: string) {
    return request({
      url: `/api/users/${userId}/follow`,
      method: 'POST',
      needAuth: true
    })
  }

/**
 * 取消关注用户 - 需要认证
 */
export function unfollowUser(userId: string) {
    return request({
      url: `/api/users/${userId}/follow`,
      method: 'DELETE',
      needAuth: true
    })
  }