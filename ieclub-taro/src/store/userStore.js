/**
 * IEClub 用户状态管理
 * 管理用户列表、个人资料等状态
 */
import { create } from 'zustand'

export const useUserStore = create((set, get) => ({
  // 状态
  users: [],
  currentProfile: null,
  followers: [],
  following: [],
  isLoading: false,
  hasMore: true,
  page: 1,
  
  // 获取用户列表
  fetchUsers: async (reset = false) => {
    const { page, users } = get()
    
    if (reset) {
      set({ users: [], page: 1, hasMore: true })
    }
    
    set({ isLoading: true })
    
    try {
      const params = new URLSearchParams({
        page: reset ? 1 : page,
        limit: 20
      })
      
      const response = await fetch(`/api/users?${params}`)
      if (!response.ok) throw new Error('获取用户列表失败')
      
      const data = await response.json()
      
      set({
        users: reset ? data.users : [...users, ...data.users],
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
  
  // 获取用户详情
  fetchUserProfile: async (userId) => {
    set({ isLoading: true })
    
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (!response.ok) throw new Error('获取用户详情失败')
      
      const data = await response.json()
      
      set({
        currentProfile: data,
        isLoading: false
      })
      
      return { success: true, data }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // 关注用户
  followUser: async (userId) => {
    try {
      // 延迟导入避免循环依赖
      const { useAuthStore } = await import('./authStore')
      const { token } = useAuthStore.getState()
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('关注失败')
      
      // 更新本地状态
      const { users } = get()
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { ...user, isFollowing: true, followersCount: user.followersCount + 1 }
          : user
      )
      
      set({ users: updatedUsers })
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // 取消关注
  unfollowUser: async (userId) => {
    try {
      // 延迟导入避免循环依赖
      const { useAuthStore } = await import('./authStore')
      const { token } = useAuthStore.getState()
      const response = await fetch(`/api/users/${userId}/unfollow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('取消关注失败')
      
      // 更新本地状态
      const { users } = get()
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { ...user, isFollowing: false, followersCount: user.followersCount - 1 }
          : user
      )
      
      set({ users: updatedUsers })
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // 搜索用户
  searchUsers: async (query) => {
    set({ isLoading: true })
    
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('搜索用户失败')
      
      const data = await response.json()
      
      set({
        users: data.users,
        isLoading: false
      })
      
      return { success: true, data }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // 重置状态
  reset: () => {
    set({
      users: [],
      currentProfile: null,
      followers: [],
      following: [],
      isLoading: false,
      hasMore: true,
      page: 1
    })
  }
}))
