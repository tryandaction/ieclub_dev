// ==================== 用户API服务（增强版） ====================

import { request } from './request'
import type { User, UserProfile, LoginParams, RegisterParams } from '../types'

/**
 * 用户登录
 */
export function login(params: LoginParams) {
   return request<{ token: string; user: User }>({
     url: '/auth/login',
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
     url: '/auth/register',
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
     url: '/user/profile',
     method: 'GET'
   })
 }

/**
 * 更新用户信息
 */
export function updateUserProfile(data: Partial<UserProfile>) {
   return request<{ user: User }>({
     url: '/user/profile',
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
     url: `/user/${userId}/stats`,
     method: 'GET'
   })
 }

/**
 * 关注用户
 */
export function followUser(userId: string) {
   return request({
     url: `/user/${userId}/follow`,
     method: 'POST'
   })
 }

/**
 * 取消关注用户
 */
export function unfollowUser(userId: string) {
   return request({
     url: `/user/${userId}/unfollow`,
     method: 'POST'
   })
 }