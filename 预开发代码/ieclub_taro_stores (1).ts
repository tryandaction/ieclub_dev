// src/store/user.ts - 用户状态管理（已完成的部分）
import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { login as loginApi, register as registerApi, getUserProfile } from '../services/user'
import type { User, LoginParams, RegisterParams } from '../types'

interface UserState {
  token: string | null
  userInfo: User | null
  isLogin: boolean
  
  // Actions
  setToken: (token: string) => void
  setUserInfo: (user: User) => void
  login: (params: LoginParams) => Promise<void>
  register: (params: RegisterParams) => Promise<void>
  logout: () => void
  checkLoginStatus: () => Promise<boolean>
  refreshUserInfo: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  token: null,
  userInfo: null,
  isLogin: false,

  setToken: (token: string) => {
    Taro.setStorageSync('token', token)
    set({ token, isLogin: true })
  },

  setUserInfo: (user: User) => {
    Taro.setStorageSync('userInfo', user)
    set({ userInfo: user })
  },

  login: async (params: LoginParams) => {
    try {
      const res = await loginApi(params)
      get().setToken(res.token)
      get().setUserInfo(res.user)
      Taro.showToast({ title: '登录成功', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
      throw error
    }
  },

  register: async (params: RegisterParams) => {
    try {
      const res = await registerApi(params)
      get().setToken(res.token)
      get().setUserInfo(res.user)
      Taro.showToast({ title: '注册成功', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '注册失败', icon: 'none' })
      throw error
    }
  },

  logout: () => {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('userInfo')
    set({
      token: null,
      userInfo: null,
      isLogin: false
    })
    Taro.reLaunch({ url: '/pages/login/index' })
  },

  checkLoginStatus: async () => {
    const token = Taro.getStorageSync('token')
    const userInfo = Taro.getStorageSync('userInfo')

    if (token && userInfo) {
      set({ token, userInfo, isLogin: true })
      
      try {
        await get().refreshUserInfo()
        return true
      } catch (error) {
        get().logout()
        return false
      }
    }
    
    return false
  },

  refreshUserInfo: async () => {
    try {
      const res = await getUserProfile()
      get().setUserInfo(res.user)
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      throw error
    }
  }
}))


// ==================== src/store/topic.ts - 话题状态管理 ====================

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


// ==================== src/store/comment.ts - 评论状态管理 ====================

import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { 
  getCommentList, 
  createComment as createCommentApi,
  likeComment as likeCommentApi,
  unlikeComment as unlikeCommentApi,
  getCommentReplies
} from '../services/comment'
import type { Comment, CreateCommentParams } from '../types'

interface CommentState {
  comments: Comment[]
  total: number
  hasMore: boolean
  loading: boolean
  
  // 回复相关
  replyingTo: Comment | null
  
  // Actions
  fetchComments: (topicId: string, page?: number, append?: boolean) => Promise<void>
  createComment: (data: CreateCommentParams) => Promise<Comment>
  likeComment: (commentId: string) => Promise<void>
  unlikeComment: (commentId: string) => Promise<void>
  fetchReplies: (commentId: string, page?: number) => Promise<Comment[]>
  setReplyingTo: (comment: Comment | null) => void
  clearComments: () => void
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  total: 0,
  hasMore: true,
  loading: false,
  replyingTo: null,

  fetchComments: async (topicId: string, page = 1, append = false) => {
    set({ loading: true })
    
    try {
      const res = await getCommentList(topicId, page)
      
      set(state => ({
        comments: append ? [...state.comments, ...res.comments] : res.comments,
        total: res.total,
        hasMore: res.hasMore,
        loading: false
      }))
    } catch (error: any) {
      set({ loading: false })
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
      throw error
    }
  },

  createComment: async (data: CreateCommentParams) => {
    try {
      const res = await createCommentApi(data)
      
      // 如果是回复评论，不添加到列表（由详情页处理）
      if (!data.parentId) {
        set(state => ({
          comments: [res.comment, ...state.comments],
          total: state.total + 1
        }))
      }
      
      Taro.showToast({ title: '评论成功', icon: 'success' })
      return res.comment
    } catch (error: any) {
      Taro.showToast({ title: error.message || '评论失败', icon: 'none' })
      throw error
    }
  },

  likeComment: async (commentId: string) => {
    try {
      await likeCommentApi(commentId)
      
      set(state => ({
        comments: state.comments.map(comment =>
          comment.id === commentId
            ? { ...comment, isLiked: true, likesCount: comment.likesCount + 1 }
            : comment
        )
      }))
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
      throw error
    }
  },

  unlikeComment: async (commentId: string) => {
    try {
      await unlikeCommentApi(commentId)
      
      set(state => ({
        comments: state.comments.map(comment =>
          comment.id === commentId
            ? { ...comment, isLiked: false, likesCount: Math.max(0, comment.likesCount - 1) }
            : comment
        )
      }))
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
      throw error
    }
  },

  fetchReplies: async (commentId: string, page = 1) => {
    try {
      const res = await getCommentReplies(commentId, page)
      return res.comments
    } catch (error: any) {
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
      throw error
    }
  },

  setReplyingTo: (comment: Comment | null) => {
    set({ replyingTo: comment })
  },

  clearComments: () => {
    set({ comments: [], total: 0, hasMore: true })
  }
}))


// ==================== src/store/notification.ts - 通知状态管理 ====================

import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { getNotifications, markAllNotificationsRead, getUnreadCount } from '../services/notification'
import type { Notification } from '../types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  total: number
  hasMore: boolean
  loading: boolean
  
  // Actions
  fetchNotifications: (page?: number, append?: boolean) => Promise<void>
  markAllRead: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  clearNotifications: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  hasMore: true,
  loading: false,

  fetchNotifications: async (page = 1, append = false) => {
    set({ loading: true })
    
    try {
      const res = await getNotifications(page)
      
      set(state => ({
        notifications: append ? [...state.notifications, ...res.notifications] : res.notifications,
        unreadCount: res.unreadCount,
        total: res.total,
        hasMore: res.hasMore,
        loading: false
      }))
    } catch (error: any) {
      set({ loading: false })
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
      throw error
    }
  },

  markAllRead: async () => {
    try {
      await markAllNotificationsRead()
      
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }))
      
      Taro.showToast({ title: '已全部标记为已读', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
      throw error
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await getUnreadCount()
      set({ unreadCount: res.count })
    } catch (error) {
      console.error('获取未读数量失败:', error)
    }
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0, total: 0, hasMore: true })
  }
}))