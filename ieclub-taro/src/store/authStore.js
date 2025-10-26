/**
 * 认证状态管理 Store
 * 使用 Zustand 管理用户认证状态
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ===== 状态 =====
      user: null,              // 当前用户信息
      token: null,             // 认证令牌
      isAuthenticated: false,  // 是否已认证
      isLoading: false,        // 是否加载中
      error: null,             // 错误信息

      // ===== Actions =====
      
      /**
       * 登录
       * @param {object} userData - 用户数据
       * @param {string} token - 认证令牌
       */
      login: (userData, token) => {
        set({
          user: userData,
          token: token,
          isAuthenticated: true,
          error: null,
        });
        // 保存token到localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
      },

      /**
       * 登出
       */
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        // 清除localStorage中的token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      },

      /**
       * 更新用户信息
       * @param {object} userData - 更新的用户数据
       */
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      /**
       * 设置加载状态
       * @param {boolean} isLoading - 是否加载中
       */
      setLoading: (isLoading) => {
        set({ isLoading });
      },

      /**
       * 设置错误信息
       * @param {string|null} error - 错误信息
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
       * 检查认证状态
       * @returns {boolean} 是否已认证
       */
      checkAuth: () => {
        if (typeof window === 'undefined') return false;
        
        const token = localStorage.getItem('token');
        if (!token) {
          get().logout();
          return false;
        }

        // 如果有token但没有用户信息，则需要重新获取用户信息
        if (!get().user) {
          // 这里可以调用API获取用户信息
          // 暂时先设置isAuthenticated为true
          set({ token, isAuthenticated: true });
        }

        return true;
      },
    }),
    {
      name: 'ieclub-auth', // localStorage中的key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;

