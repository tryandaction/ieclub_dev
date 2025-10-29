import { create } from 'zustand'
import { mockTopics, mockUsers, mockActivities, mockPosts, currentUser } from './mockData'

// 话题广场 Store
export const usePlazaStore = create((set) => ({
  activeTab: 'all',
  topics: mockTopics,
  setActiveTab: (tab) => set({ activeTab: tab }),
  filteredTopics: () => {
    const { activeTab, topics } = usePlazaStore.getState()
    if (activeTab === 'all') return topics
    return topics.filter(t => t.type === activeTab)
  }
}))

// 社区 Store
export const useCommunityStore = create((set) => ({
  users: mockUsers,
  posts: mockPosts,
  toggleFollow: (userId) => set((state) => ({
    users: state.users.map(u => 
      u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
    )
  }))
}))

// 活动 Store
export const useActivityStore = create((set) => ({
  activities: mockActivities
}))

// 用户 Store
export const useUserStore = create((set) => ({
  currentUser,
  updateUser: (updates) => set((state) => ({
    currentUser: { ...state.currentUser, ...updates }
  }))
}))

