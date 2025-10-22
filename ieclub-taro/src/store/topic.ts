// ==================== 增强话题状态管理 ====================

import { create } from 'zustand'
import Taro from '@tarojs/taro'
import {
  getEnhancedTopics,
  createEnhancedTopic,
  performQuickAction,
  getPersonalizedRecommendations
} from '@/services/topic'
// import type { EnhancedTopic, CreateEnhancedTopicParams } from '../types'

interface EnhancedTopicState {
  topics: any[] // EnhancedTopic[]
  hotTopics: any[] // EnhancedTopic[]
  recommendedTopics: any[] // EnhancedTopic[]
  currentTopic: any | null // EnhancedTopic | null

  feedType: 'personalized' | 'trending' | 'latest' | 'matched'
  hasMore: boolean
  loading: boolean

  // 基础版话题功能所需的状态
  filters: {
    page: number
    limit: number
    sortBy: 'latest' | 'hot' | 'featured'
    category: string
    tag: string
  }

  // Actions
  setFeedType: (type: 'personalized' | 'trending' | 'latest' | 'matched') => void
  fetchTopics: (params?: any, append?: boolean) => Promise<void>
  fetchRecommendations: () => Promise<void>
  createTopic: (data: any) => Promise<any> // CreateEnhancedTopicParams => Promise<EnhancedTopic>
  handleQuickAction: (topicId: string, actionType: string) => Promise<void>
  updateTopicInList: (topicId: string, updates: any) => void // Partial<EnhancedTopic>

  // 基础版话题功能所需的方法
  fetchTopicDetail: (topicId: string) => Promise<void>
  likeTopic: (topicId: string) => Promise<void>
  unlikeTopic: (topicId: string) => Promise<void>
  setFilters: (filters: any) => void
  clearTopics: () => void
}

export const useTopicStore = create<EnhancedTopicState>((set, get) => ({
  topics: [],
  hotTopics: [],
  recommendedTopics: [],
  currentTopic: null,
  feedType: 'personalized',
  hasMore: true,
  loading: false,

  setFeedType: (type) => {
    set({ feedType: type, topics: [] })
    get().fetchTopics({ type })
  },

  fetchTopics: async (params = {}, append = false) => {
    const { feedType, topics } = get()
    set({ loading: true })

    try {
      const res = await getEnhancedTopics({
        page: append ? Math.ceil(topics.length / 20) + 1 : 1,
        limit: 20,
        type: feedType,
        ...params
      })

      set({
        topics: append ? [...topics, ...res.topics] : res.topics,
        hasMore: res.hasMore,
        loading: false
      })
    } catch (error: any) {
      set({ loading: false })
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
      throw error
    }
  },

  fetchRecommendations: async () => {
    try {
      const res = await getPersonalizedRecommendations(10)
      set({ recommendedTopics: res.topics })
    } catch (error) {
      console.error('获取推荐失败:', error)
    }
  },

  createTopic: async (data) => {
    try {
      const res = await createEnhancedTopic(data)

      set(state => ({
        topics: [res.topic, ...state.topics]
      }))

      Taro.showToast({ title: '发布成功', icon: 'success' })
      return res.topic
    } catch (error: any) {
      Taro.showToast({ title: error.message || '发布失败', icon: 'none' })
      throw error
    }
  },

  handleQuickAction: async (topicId, actionType) => {
    try {
      await performQuickAction({ topicId, actionType: actionType as any })

      // 更新本地状态
      const topic = get().topics.find(t => t.id === topicId)
      if (topic) {
        const userId = Taro.getStorageSync('userInfo')?.id
        if (userId) {
          const actionKey = `${actionType}` as keyof typeof topic.quickActions
          const currentUsers = topic.quickActions[actionKey] || []

          get().updateTopicInList(topicId, {
            quickActions: {
              ...topic.quickActions,
              [actionKey]: [...currentUsers, userId]
            },
            stats: {
              ...topic.stats,
              [`${actionType}Count`]: (topic.stats as any)[`${actionType}Count`] + 1
            }
          })
        }
      }

      Taro.showToast({ title: '操作成功', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
      throw error
    }
  },

  updateTopicInList: (topicId, updates) => {
    set(state => ({
      topics: state.topics.map(topic =>
        topic.id === topicId ? { ...topic, ...updates } : topic
      ),
      currentTopic: state.currentTopic?.id === topicId
        ? { ...state.currentTopic, ...updates }
        : state.currentTopic
    }))
  },

  // 添加基础版话题功能所需的方法
  fetchTopicDetail: async (topicId: string) => {
    try {
      // 这里需要导入基础版的服务方法
      // 暂时先设置一个空的currentTopic
      set({ currentTopic: null })
    } catch (error) {
      console.error('获取话题详情失败:', error)
      throw error
    }
  },

  likeTopic: async (topicId: string) => {
    try {
      // 这里需要导入基础版的服务方法
      // 暂时先更新本地状态
      set(state => ({
        currentTopic: state.currentTopic ? {
          ...state.currentTopic,
          isLiked: true,
          likesCount: state.currentTopic.likesCount + 1
        } : null
      }))
    } catch (error) {
      console.error('点赞失败:', error)
      throw error
    }
  },

  unlikeTopic: async (topicId: string) => {
    try {
      // 这里需要导入基础版的服务方法
      // 暂时先更新本地状态
      set(state => ({
        currentTopic: state.currentTopic ? {
          ...state.currentTopic,
          isLiked: false,
          likesCount: Math.max(0, state.currentTopic.likesCount - 1)
        } : null
      }))
    } catch (error) {
      console.error('取消点赞失败:', error)
      throw error
    }
  },

  // 添加话题列表页面所需的方法
  filters: {
    page: 1,
    limit: 20,
    sortBy: 'latest' as const,
    category: '',
    tag: ''
  },

  setFilters: (newFilters: any) => {
    set({ filters: { ...newFilters } })
  },

  clearTopics: () => {
    set({ topics: [], hasMore: true })
  }
}))