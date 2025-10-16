// ==================== 推送服务 ====================

import { request } from './request'
// import type { PushNotification, NotificationSettings } from '../types/enhanced'

/**
 * 订阅推送
 */
export function subscribePush(params: {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}) {
  return request({
    url: '/api/v2/push/subscribe',
    method: 'POST',
    data: params
  })
}

/**
 * 更新通知设置
 */
export function updateNotificationSettings(settings: any) { // NotificationSettings
  return request({
    url: '/api/v2/notifications/settings',
    method: 'PUT',
    data: settings
  })
}

/**
 * 获取推送历史
 */
export function getPushHistory(page = 1, limit = 20) {
  return request<{
    notifications: any[] // PushNotification[]
    unreadCount: number
  }>({
    url: '/api/v2/push/history',
    method: 'GET',
    data: { page, limit }
  })
}