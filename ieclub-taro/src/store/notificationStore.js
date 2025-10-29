/**
 * IEClub 通知状态管理
 * 管理通知列表、未读数量等状态
 */
import { create } from 'zustand'

export const useNotificationStore = create((set, get) => ({
  // 状态
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
  page: 1,
  
  // 获取通知列表
  fetchNotifications: async (reset = false) => {
    const { page, notifications } = get()
    
    if (reset) {
      set({ notifications: [], page: 1, hasMore: true })
    }
    
    set({ isLoading: true })
    
    try {
      const { token } = useAuthStore.getState()
      const params = new URLSearchParams({
        page: reset ? 1 : page,
        limit: 20
      })
      
      const response = await fetch(`/api/notifications?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('获取通知失败')
      
      const data = await response.json()
      
      set({
        notifications: reset ? data.notifications : [...notifications, ...data.notifications],
        unreadCount: data.unreadCount,
        hasMore: data.hasMore,
        page: reset ? 2 : page + 1,
        isLoading: false
      })
      
      return { success: true, data }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // 标记为已读
  markAsRead: async (notificationId) => {
    try {
      const { token } = useAuthStore.getState()
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('标记已读失败')
      
      // 更新本地状态
      const { notifications, unreadCount } = get()
      const updatedNotifications = notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
      
      set({
        notifications: updatedNotifications,
        unreadCount: Math.max(0, unreadCount - 1)
      })
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // 标记全部已读
  markAllAsRead: async () => {
    try {
      const { token } = useAuthStore.getState()
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('标记全部已读失败')
      
      // 更新本地状态
      const { notifications } = get()
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        isRead: true
      }))
      
      set({
        notifications: updatedNotifications,
        unreadCount: 0
      })
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // 删除通知
  deleteNotification: async (notificationId) => {
    try {
      const { token } = useAuthStore.getState()
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('删除通知失败')
      
      // 更新本地状态
      const { notifications, unreadCount } = get()
      const deletedNotification = notifications.find(n => n.id === notificationId)
      const updatedNotifications = notifications.filter(n => n.id !== notificationId)
      
      set({
        notifications: updatedNotifications,
        unreadCount: deletedNotification && !deletedNotification.isRead 
          ? Math.max(0, unreadCount - 1) 
          : unreadCount
      })
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // 重置状态
  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      hasMore: true,
      page: 1
    })
  }
}))
