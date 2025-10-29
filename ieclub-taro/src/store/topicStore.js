/**
 * IEClub 话题状态管理
 * 管理话题列表、筛选、创建等状态
 */
import { create } from 'zustand'
import { TOPIC_TYPES, TOPIC_CATEGORIES } from '../constants'

export const useTopicStore = create((set, get) => ({
  // 状态
  topics: [],
  currentTopic: null,
  filters: {
    type: 'all', // all, offer, demand, project
    category: 'all', // all, study, research, skill, startup, life
    sortBy: 'latest', // latest, hot, trending
    searchQuery: ''
  },
  isLoading: false,
  hasMore: true,
  page: 1,
  
  // 获取话题列表
  fetchTopics: async (reset = false) => {
    const { filters, page, topics } = get()
    
    if (reset) {
      set({ topics: [], page: 1, hasMore: true })
    }
    
    set({ isLoading: true })
    
    try {
      const params = new URLSearchParams({
        page: reset ? 1 : page,
        limit: 20,
        ...filters
      })
      
      const response = await fetch(`/api/topics?${params}`)
      if (!response.ok) throw new Error('获取话题失败')
      
      const data = await response.json()
      
      set({
        topics: reset ? data.topics : [...topics, ...data.topics],
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
  
  // 获取话题详情
  fetchTopicDetail: async (id) => {
    set({ isLoading: true })
    
    try {
      const response = await fetch(`/api/topics/${id}`)
      if (!response.ok) throw new Error('获取话题详情失败')
      
      const data = await response.json()
      
      set({
        currentTopic: data,
        isLoading: false
      })
      
      return { success: true, data }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // 创建话题
  createTopic: async (topicData) => {
    set({ isLoading: true })
    
    try {
      // 延迟导入避免循环依赖
      const { useAuthStore } = await import('./authStore')
      const { token } = useAuthStore.getState()
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(topicData)
      })
      
      if (!response.ok) throw new Error('创建话题失败')
      
      const data = await response.json()
      
      // 添加到列表顶部
      const { topics } = get()
      set({
        topics: [data, ...topics],
        isLoading: false
      })
      
      return { success: true, data }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },
  
  // 更新筛选条件
  updateFilters: (newFilters) => {
    set({
      filters: { ...get().filters, ...newFilters },
      topics: [],
      page: 1,
      hasMore: true
    })
    get().fetchTopics(true)
  },
  
  // 点赞话题
  likeTopic: async (id) => {
    try {
      // 延迟导入避免循环依赖
      const { useAuthStore } = await import('./authStore')
      const { token } = useAuthStore.getState()
      const response = await fetch(`/api/topics/${id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('点赞失败')
      
      // 更新本地状态
      const { topics } = get()
      const updatedTopics = topics.map(topic => 
        topic.id === id 
          ? { ...topic, isLiked: !topic.isLiked, likesCount: topic.likesCount + (topic.isLiked ? -1 : 1) }
          : topic
      )
      
      set({ topics: updatedTopics })
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // 收藏话题
  favoriteTopic: async (id) => {
    try {
      // 延迟导入避免循环依赖
      const { useAuthStore } = await import('./authStore')
      const { token } = useAuthStore.getState()
      const response = await fetch(`/api/topics/${id}/favorite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('收藏失败')
      
      // 更新本地状态
      const { topics } = get()
      const updatedTopics = topics.map(topic => 
        topic.id === id 
          ? { ...topic, isFavorited: !topic.isFavorited }
          : topic
      )
      
      set({ topics: updatedTopics })
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // 重置状态
  reset: () => {
    set({
      topics: [],
      currentTopic: null,
      filters: {
        type: 'all',
        category: 'all',
        sortBy: 'latest',
        searchQuery: ''
      },
      isLoading: false,
      hasMore: true,
      page: 1
    })
  }
}))
