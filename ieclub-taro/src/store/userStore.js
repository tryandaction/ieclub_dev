/**
 * 用户状态管理 Store
 * 管理用户列表、关注关系等
 */
import { create } from 'zustand';

export const useUserStore = create((set, get) => ({
  // ===== 状态 =====
  users: [],                    // 用户列表
  currentUser: null,            // 当前查看的用户
  following: [],                // 我关注的用户ID列表
  followers: [],                // 关注我的用户ID列表
  filters: {
    college: null,              // 学院筛选
    major: null,                // 专业筛选
    grade: null,                // 年级筛选
    level: null,                // 等级筛选
    skills: [],                 // 技能标签筛选
    activeStatus: 'all',        // 活跃状态 (all/week/month/half-year)
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
  },
  isLoading: false,
  error: null,

  // ===== Actions =====
  
  /**
   * 设置用户列表
   * @param {array} users - 用户列表
   * @param {boolean} append - 是否追加
   */
  setUsers: (users, append = false) => {
    set((state) => ({
      users: append ? [...state.users, ...users] : users,
    }));
  },

  /**
   * 设置当前用户
   * @param {object} user - 用户对象
   */
  setCurrentUser: (user) => {
    set({ currentUser: user });
  },

  /**
   * 关注/取消关注用户
   * @param {string} userId - 用户ID
   */
  toggleFollow: (userId) => {
    set((state) => {
      const isFollowing = state.following.includes(userId);
      return {
        following: isFollowing
          ? state.following.filter((id) => id !== userId)
          : [...state.following, userId],
        users: state.users.map((user) =>
          user.id === userId
            ? {
                ...user,
                isFollowing: !user.isFollowing,
                followersCount: user.isFollowing
                  ? user.followersCount - 1
                  : user.followersCount + 1,
              }
            : user
        ),
      };
    });
  },

  /**
   * 批量设置关注列表
   * @param {array} userIds - 用户ID列表
   */
  setFollowing: (userIds) => {
    set({ following: userIds });
  },

  /**
   * 批量设置粉丝列表
   * @param {array} userIds - 用户ID列表
   */
  setFollowers: (userIds) => {
    set({ followers: userIds });
  },

  /**
   * 设置筛选条件
   * @param {object} filters - 筛选条件
   */
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    }));
  },

  /**
   * 重置筛选条件
   */
  resetFilters: () => {
    set({
      filters: {
        college: null,
        major: null,
        grade: null,
        level: null,
        skills: [],
        activeStatus: 'all',
      },
      pagination: { page: 1, pageSize: 20, total: 0, hasMore: true },
    });
  },

  /**
   * 设置分页信息
   * @param {object} pagination - 分页信息
   */
  setPagination: (pagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
  },

  /**
   * 加载下一页
   */
  loadNextPage: () => {
    set((state) => ({
      pagination: {
        ...state.pagination,
        page: state.pagination.page + 1,
      },
    }));
  },

  /**
   * 更新用户信息
   * @param {string} userId - 用户ID
   * @param {object} updates - 更新的字段
   */
  updateUser: (userId, updates) => {
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId ? { ...user, ...updates } : user
      ),
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
      users: [],
      currentUser: null,
      following: [],
      followers: [],
      filters: {
        college: null,
        major: null,
        grade: null,
        level: null,
        skills: [],
        activeStatus: 'all',
      },
      pagination: { page: 1, pageSize: 20, total: 0, hasMore: true },
      isLoading: false,
      error: null,
    });
  },
}));

export default useUserStore;

