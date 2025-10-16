// ==================== 通知状态管理（增强版） ====================

import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { getNotifications, markAllNotificationsRead, getUnreadCount } from '../services/notification'
import type { Notification } from '../types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  total: number
  hasMore: boolean
  loading: boolean

  // Actions
  fetchNotifications: (page?: number, append?: boolean) => Promise<void>
  markAllRead: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  clearNotifications: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  hasMore: true,
  loading: false,

  fetchNotifications: async (page = 1, append = false) => {
    set({ loading: true })

    try {
      const res = await getNotifications(page)

      set(state => ({
        notifications: append ? [...state.notifications, ...res.notifications] : res.notifications,
        total: res.total,
        hasMore: res.hasMore,
        unreadCount: res.unreadCount,
        loading: false
      }))
    } catch (error: any) {
      set({ loading: false })
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
      throw error
    }
  },

  markAllRead: async () => {
    try {
      await markAllNotificationsRead()

      set(state => ({
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true
        })),
        unreadCount: 0
      }))

      Taro.showToast({ title: '全部标记已读', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
      throw error
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await getUnreadCount()
      set({ unreadCount: res.count })
    } catch (error) {
      console.error('获取未读数量失败:', error)
    }
  },

  clearNotifications: () => {
    set({ notifications: [], total: 0, hasMore: true, unreadCount: 0 })
  }
}))