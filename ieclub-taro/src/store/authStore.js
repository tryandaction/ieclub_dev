/**
 * IEClub 认证状态管理
 * 使用 Zustand 管理用户认证状态
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storage } from '../utils'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // 状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      // 登录
      login: async (credentials) => {
        set({ isLoading: true })
        try {
          // TODO: 调用登录API
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          })
          
          if (!response.ok) throw new Error('登录失败')
          
          const data = await response.json()
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
          
          return { success: true, data }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },
      
      // 注册
      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          })
          
          if (!response.ok) throw new Error('注册失败')
          
          const data = await response.json()
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
          
          return { success: true, data }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },
      
      // 登出
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
        storage.remove('auth')
      },
      
      // 更新用户信息
      updateUser: (userData) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...userData }
          })
        }
      },
      
      // 检查认证状态
      checkAuth: async () => {
        const { token } = get()
        if (!token) return false
        
        try {
          const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (response.ok) {
            const user = await response.json()
            set({ user, isAuthenticated: true })
            return true
          } else {
            get().logout()
            return false
          }
        } catch (error) {
          get().logout()
          return false
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => storage.get(name),
        setItem: (name, value) => storage.set(name, value),
        removeItem: (name) => storage.remove(name),
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
