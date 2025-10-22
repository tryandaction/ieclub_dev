// src/store/matching.ts
// 智能匹配状态管理 - 第三版本

import { create } from 'zustand';
import matchingService from '../services/matching';
import type { MatchedUser, MatchingType, MatchingSuggestion } from '../types/matching';

interface MatchingState {
  // 状态
  matches: MatchedUser[];
  currentType: MatchingType;
  loading: boolean;
  hasMore: boolean;
  currentPage: number;
  averageScore: number;
  suggestions: MatchingSuggestion[];
  refreshing: boolean;

  // 操作方法
  setType: (type: MatchingType) => void;
  loadMatches: (refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  loadSuggestions: () => Promise<void>;
  refreshMatching: () => Promise<void>;
  reset: () => void;
}

const useMatchingStore = create<MatchingState>((set, get) => ({
  // 初始状态
  matches: [],
  currentType: 'comprehensive' as MatchingType,
  loading: false,
  hasMore: true,
  currentPage: 1,
  averageScore: 0,
  suggestions: [],
  refreshing: false,

  // 设置匹配类型
  setType: (type) => {
    set({ currentType: type });
    get().loadMatches(true);
  },

  // 加载匹配用户
  loadMatches: async (refresh = false) => {
    const { loading, currentType } = get();
    if (loading) return;

    set({ loading: true });

    try {
      const page = refresh ? 1 : get().currentPage;
      const response = await matchingService.getMatchedUsers({
        type: currentType,
        page,
        pageSize: 20,
        minScore: 50 // 最低匹配分数50分
      });

      set({
        matches: refresh ? response.matches : [...get().matches, ...response.matches],
        hasMore: response.hasMore,
        currentPage: page,
        averageScore: response.averageScore,
        loading: false
      });
    } catch (error) {
      console.error('加载匹配用户失败:', error);
      set({ loading: false });
    }
  },

  // 加载更多
  loadMore: async () => {
    const { hasMore, loading } = get();
    if (!hasMore || loading) return;

    set({ currentPage: get().currentPage + 1 });
    await get().loadMatches(false);
  },

  // 加载匹配建议
  loadSuggestions: async () => {
    try {
      const suggestions = await matchingService.getMatchingSuggestions();
      set({ suggestions });
    } catch (error) {
      console.error('加载匹配建议失败:', error);
    }
  },

  // 刷新匹配结果
  refreshMatching: async () => {
    const { refreshing } = get();
    if (refreshing) return;

    set({ refreshing: true });

    try {
      await matchingService.refreshMatching();
      await get().loadMatches(true);
      await get().loadSuggestions();
    } catch (error) {
      console.error('刷新匹配失败:', error);
    } finally {
      set({ refreshing: false });
    }
  },

  // 重置状态
  reset: () => {
    set({
      matches: [],
      currentType: 'comprehensive' as MatchingType,
      loading: false,
      hasMore: true,
      currentPage: 1,
      averageScore: 0,
      suggestions: [],
      refreshing: false
    });
  }
}));

export default useMatchingStore;
