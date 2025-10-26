/**
 * 通知状态管理 Store
 * 管理用户通知、消息等
 */
import { create } from 'zustand';

// 通知类型枚举
export const NotificationType = {
  LIKE: 'like',               // 点赞
  COMMENT: 'comment',         // 评论
  FOLLOW: 'follow',           // 关注
  MENTION: 'mention',         // @提及
  SYSTEM: 'system',           // 系统通知
  ACTIVITY: 'activity',       // 活动通知
  TEAM: 'team',               // 成团通知
  ACHIEVEMENT: 'achievement', // 成就获得
};

export const useNotificationStore = create((set, get) => ({
  // ===== 状态 =====
  notifications: [],           // 通知列表
  unreadCount: 0,              // 未读数量
  filter: 'all',               // 筛选 (all/interaction/system/activity)
  isLoading: false,
  error: null,

  // ===== Actions =====
  
  /**
   * 设置通知列表
   * @param {array} notifications - 通知列表
   * @param {boolean} append - 是否追加
   */
  setNotifications: (notifications, append = false) => {
    set((state) => {
      const newNotifications = append
        ? [...state.notifications, ...notifications]
        : notifications;
      
      // 计算未读数量
      const unreadCount = newNotifications.filter((n) => !n.isRead).length;
      
      return {
        notifications: newNotifications,
        unreadCount,
      };
    });
  },

  /**
   * 添加新通知
   * @param {object} notification - 通知对象
   */
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  /**
   * 标记通知为已读
   * @param {string} notificationId - 通知ID
   */
  markAsRead: (notificationId) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === notificationId);
      if (!notification || notification.isRead) return state;

      return {
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  /**
   * 标记所有通知为已读
   */
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  /**
   * 删除通知
   * @param {string} notificationId - 通知ID
   */
  deleteNotification: (notificationId) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === notificationId);
      const wasUnread = notification && !notification.isRead;

      return {
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount: wasUnread
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    });
  },

  /**
   * 批量删除已读通知
   */
  deleteReadNotifications: () => {
    set((state) => ({
      notifications: state.notifications.filter((n) => !n.isRead),
    }));
  },

  /**
   * 设置筛选条件
   * @param {string} filter - 筛选条件
   */
  setFilter: (filter) => {
    set({ filter });
  },

  /**
   * 获取筛选后的通知列表
   * @returns {array} 筛选后的通知列表
   */
  getFilteredNotifications: () => {
    const { notifications, filter } = get();
    
    if (filter === 'all') return notifications;
    
    const filterMap = {
      interaction: [NotificationType.LIKE, NotificationType.COMMENT, NotificationType.FOLLOW, NotificationType.MENTION],
      system: [NotificationType.SYSTEM, NotificationType.ACHIEVEMENT],
      activity: [NotificationType.ACTIVITY, NotificationType.TEAM],
    };

    const allowedTypes = filterMap[filter] || [];
    return notifications.filter((n) => allowedTypes.includes(n.type));
  },

  /**
   * 更新未读数量
   */
  updateUnreadCount: () => {
    set((state) => ({
      unreadCount: state.notifications.filter((n) => !n.isRead).length,
    }));
  },

  /**
   * 设置加载状态
   * @param {boolean} isLoading
   */
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  /**
   * 设置错误信息
   * @param {string|null} error
   */
  setError: (error) => {
    set({ error });
  },

  /**
   * 清除错误
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * 重置所有状态
   */
  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      filter: 'all',
      isLoading: false,
      error: null,
    });
  },
}));

export default useNotificationStore;

