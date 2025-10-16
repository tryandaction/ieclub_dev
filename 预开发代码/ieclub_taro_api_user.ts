// src/services/user.ts - 用户相关API

import { get, post } from './request'
import type { User, LoginResponse, Notification, PaginationResponse } from '../types'

/**
 * 登录
 */
export function login(email: string, password: string): Promise<LoginResponse> {
  return post('/auth/login', { email, password }, { showLoading: true, loadingText: '登录中...' })
}

/**
 * 注册
 */
export function register(data: {
  username: string
  email: string
  password: string
  major?: string
  year?: string
}): Promise<LoginResponse> {
  return post('/auth/register', data, { showLoading: true, loadingText: '注册中...' })
}

/**
 * 获取当前用户信息
 */
export function getUserProfile(): Promise<{ user: User }> {
  return get('/auth/me')
}

/**
 * 获取通知列表
 */
export function getNotifications(params?: {
  page?: number
  limit?: number
  unreadOnly?: boolean
}): Promise<PaginationResponse<Notification>> {
  return get('/notifications', params)
}

/**
 * 标记通知为已读
 */
export function markNotificationAsRead(id: string): Promise<{ message: string }> {
  return post(`/notifications/${id}/read`)
}

/**
 * 全部标记为已读
 */
export function markAllNotificationsAsRead(): Promise<{ message: string }> {
  return post('/notifications/read-all')
}

export default {
  login,
  register,
  getUserProfile,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
}


// ==================== src/store/userStore.ts - 用户状态管理 ====================

import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type { User } from '../types'
import { getUserProfile } from '../services/user'

interface UserState {
  token: string | null
  userInfo: User | null
  isLogin: boolean
  
  // Actions
  setToken: (token: string) => void
  setUserInfo: (user: User) => void
  login: (token: string, user: User) => void
  logout: () => void
  checkLoginStatus: () => Promise<boolean>
  refreshUserInfo: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  token: null,
  userInfo: null,
  isLogin: false,

  // 设置token
  setToken: (token: string) => {
    Taro.setStorageSync('token', token)
    set({ token, isLogin: true })
  },

  // 设置用户信息
  setUserInfo: (user: User) => {
    Taro.setStorageSync('userInfo', user)
    set({ userInfo: user })
  },

  // 登录
  login: (token: string, user: User) => {
    Taro.setStorageSync('token', token)
    Taro.setStorageSync('userInfo', user)
    set({
      token,
      userInfo: user,
      isLogin: true
    })
  },

  // 登出
  logout: () => {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('userInfo')
    set({
      token: null,
      userInfo: null,
      isLogin: false
    })
    Taro.reLaunch({ url: '/pages/login/index' })
  },

  // 检查登录状态
  checkLoginStatus: async () => {
    const token = Taro.getStorageSync('token')
    const userInfo = Taro.getStorageSync('userInfo')

    if (token && userInfo) {
      set({
        token,
        userInfo,
        isLogin: true
      })

      // 验证token有效性并刷新用户信息
      try {
        await get().refreshUserInfo()
        return true
      } catch (error) {
        // Token无效，清除登录状态
        get().logout()
        return false
      }
    }

    return false
  },

  // 刷新用户信息
  refreshUserInfo: async () => {
    try {
      const res = await getUserProfile()
      get().setUserInfo(res.user)
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      throw error
    }
  }
}))


// ==================== src/utils/format.ts - 格式化工具 ====================

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 格式化时间为相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  const now = dayjs()
  const target = dayjs(date)
  const diff = now.diff(target, 'minute')

  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  
  const hourDiff = now.diff(target, 'hour')
  if (hourDiff < 24) return `${hourDiff}小时前`
  
  const dayDiff = now.diff(target, 'day')
  if (dayDiff < 7) return `${dayDiff}天前`
  
  return target.format('MM月DD日')
}

/**
 * 格式化完整日期时间
 */
export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD')
}

/**
 * 格式化时间
 */
export function formatTime(date: string | Date): string {
  return dayjs(date).format('HH:mm')
}

/**
 * 格式化数字（千分位）
 */
export function