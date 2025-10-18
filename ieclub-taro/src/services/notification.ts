// ==================== 通知API服务（增强版） ====================

import { request } from './request'
import type { Notification } from '../types'

/**
 * 获取通知列表 - 需要认证
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
    data: { page, limit },
    needAuth: true // 需要认证
  })
}

/**
 * 标记通知为已读 - 需要认证
 */
export function markNotificationRead(notificationId: string) {
  return request({
    url: `/api/notifications/${notificationId}/read`,
    method: 'PUT',
    needAuth: true
  })
}

/**
 * 标记所有通知为已读 - 需要认证
 */
export function markAllNotificationsRead() {
  return request({
    url: '/api/notifications/read-all',
    method: 'PUT',
    needAuth: true
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