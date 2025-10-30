import api from '../utils/api'

/**
 * 获取通知列表
 */
export const getNotifications = (params) => {
  return api.get('/notifications', { params })
}

/**
 * 获取未读数量
 */
export const getUnreadCount = () => {
  return api.get('/notifications/unread-count')
}

/**
 * 标记单条为已读
 */
export const markAsRead = (id) => {
  return api.put(`/notifications/${id}/read`)
}

/**
 * 标记所有为已读
 */
export const markAllAsRead = () => {
  return api.put('/notifications/read-all')
}

/**
 * 删除通知
 */
export const deleteNotification = (id) => {
  return api.delete(`/notifications/${id}`)
}

/**
 * 清空已读通知
 */
export const clearReadNotifications = () => {
  return api.delete('/notifications/clear-read')
}

