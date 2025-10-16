// ==================== 话题状态管理（增强版） ====================

import { create } from 'zustand'
import Taro from '@tarojs/taro'
import {
  getTopicList,
  getTopicDetail,
  createTopic as createTopicApi,
  likeTopic as likeTopicApi,
  unlikeTopic as unlikeTopicApi,
  favoriteTopic as favoriteTopicApi,
  unfavoriteTopic as unfavoriteTopicApi
} from '../services/topic'
import type { Topic, TopicListParams, CreateTopicParams } from '../types'

interface TopicState {
  // 话题列表
  topics: Topic[]
  total: number
  hasMore: boolean
  loading: boolean

  // 当前话题详情
  currentTopic: Topic | null

  // 筛选条件
  filters: TopicListParams

  // Actions
  fetchTopics: (params?: Partial<TopicListParams>, append?: boolean) => Promise<void>
  fetchTopicDetail: (topicId: string) => Promise<void>
  createTopic: (data: CreateTopicParams) => Promise<Topic>
  updateTopicInList: (topicId: string, updates: Partial<Topic>) => void
  likeTopic: (topicId: string) => Promise<void>
  unlikeTopic: (topicId: string) => Promise<void>
  favoriteTopic: (topicId: string) => Promise<void>
  unfavoriteTopic: (topicId: string) => Promise<void>
  setFilters: (filters: Partial<TopicListParams>) => void
  resetFilters: () => void
  clearTopics: () => void
}

const defaultFilters: TopicListParams = {
  page: 1,
  limit: 20,
  sortBy: 'latest',
  category: undefined,
  tag: undefined
}

export const useTopicStore = create<TopicState>((set, get) => ({
  topics: [],
  total: 0,
  hasMore: true,
  loading: false,
  currentTopic: null,
  filters: { ...defaultFilters },

  fetchTopics: async (params = {}, append = false) => {
    const { filters } = get()
    const finalParams = { ...filters, ...params }

    set({ loading: true })

    try {
      const res = await getTopicList(finalParams)

      set(state => ({
        topics: append ? [...state.topics, ...res.topics] : res.topics,
        total: res.total,
        hasMore: res.hasMore,
        loading: false,
        filters: finalParams
      }))
    } catch (error: any) {
      set({ loading: false })
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
      throw error
    }
  },

  fetchTopicDetail: async (topicId: string) => {
    try {
      const res = await getTopicDetail(topicId)
      set({ currentTopic: res.topic })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
      throw error
    }
  },

  createTopic: async (data: CreateTopicParams) => {
    try {
      const res = await createTopicApi(data)

      // 将新话题添加到列表开头
      set(state => ({
        topics: [res.topic, ...state.topics],
        total: state.total + 1
      }))

      Taro.showToast({ title: '发布成功', icon: 'success' })
      return res.topic
    } catch (error: any) {
      Taro.showToast({ title: error.message || '发布失败', icon: 'none' })
      throw error
    }
  },

  updateTopicInList: (topicId: string, updates: Partial<Topic>) => {
    set(state => ({
      topics: state.topics.map(topic =>
        topic.id === topicId ? { ...topic, ...updates } : topic
      ),
      currentTopic: state.currentTopic?.id === topicId
        ? { ...state.currentTopic, ...updates }
        : state.currentTopic
    }))
  },

  likeTopic: async (topicId: string) => {
    try {
      await likeTopicApi(topicId)

      get().updateTopicInList(topicId, {
        isLiked: true,
        likesCount: (get().topics.find(t => t.id === topicId)?.likesCount || 0) + 1
      })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
      throw error
    }
  },

  unlikeTopic: async (topicId: string) => {
    try {
      await unlikeTopicApi(topicId)

      get().updateTopicInList(topicId, {
        isLiked: false,
        likesCount: Math.max(0, (get().topics.find(t => t.id === topicId)?.likesCount || 0) - 1)
      })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
      throw error
    }
  },

  favoriteTopic: async (topicId: string) => {
    try {
      await favoriteTopicApi(topicId)
      get().updateTopicInList(topicId, { isFavorited: true })
      Taro.showToast({ title: '收藏成功', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
      throw error
    }
  },

  unfavoriteTopic: async (topicId: string) => {
    try {
      await unfavoriteTopicApi(topicId)
      get().updateTopicInList(topicId, { isFavorited: false })
      Taro.showToast({ title: '已取消收藏', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
      throw error
    }
  },

  setFilters: (filters: Partial<TopicListParams>) => {
    set(state => ({
      filters: { ...state.filters, ...filters }
    }))
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } })
  },

  clearTopics: () => {
    set({ topics: [], total: 0, hasMore: true })
  }
}))