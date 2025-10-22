// ==================== 评论状态管理（增强版） ====================

import { create } from 'zustand'
import Taro from '@tarojs/taro'
import {
  getCommentList,
  createComment as createCommentApi,
  likeComment as likeCommentApi,
  unlikeComment as unlikeCommentApi,
  getCommentReplies
} from '@/services/comment'
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