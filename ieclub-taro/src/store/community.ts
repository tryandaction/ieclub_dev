// src/store/community.ts
// 社区模块状态管理 - 基于开发代码优化版本

import { create } from 'zustand';
import communityService from '@/services/community';
import type { CommunityUser } from '../types/community';
import { UserSortType } from '../types/community';

interface CommunityState {
  // 状态
  users: CommunityUser[];
  currentSort: UserSortType;
  loading: boolean;
  hasMore: boolean;
  currentPage: number;
  searchKeyword: string;

  // 操作方法
  setSort: (sort: UserSortType) => void;
  setSearchKeyword: (keyword: string) => void;
  loadUsers: (refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  searchUsers: (keyword: string) => Promise<void>;
  reset: () => void;
}

const useCommunityStore = create<CommunityState>((set, get) => ({
  // 初始状态
  users: [],
  currentSort: UserSortType.REGISTER_TIME,
  loading: false,
  hasMore: true,
  currentPage: 1,
  searchKeyword: '',

  // 设置排序方式
  setSort: (sort) => {
    set({ currentSort: sort });
    get().loadUsers(true);
  },

  // 设置搜索关键词
  setSearchKeyword: (keyword) => {
    set({ searchKeyword: keyword });
  },

  // 加载用户列表
  loadUsers: async (refresh = false) => {
    const { loading, currentSort, searchKeyword } = get();
    if (loading) return;

    set({ loading: true });

    try {
      const page = refresh ? 1 : get().currentPage;
      const response = await communityService.getUserList({
        page,
        pageSize: 20,
        sortBy: currentSort,
        keyword: searchKeyword || undefined
      });

      set({
        users: refresh ? response.users : [...get().users, ...response.users],
        hasMore: response.hasMore,
        currentPage: page,
        loading: false
      });
    } catch (error) {
      console.error('加载用户列表失败:', error);
      set({ loading: false });
    }
  },

  // 加载更多
  loadMore: async () => {
    const { hasMore, loading } = get();
    if (!hasMore || loading) return;

    set({ currentPage: get().currentPage + 1 });
    await get().loadUsers(false);
  },

  // 搜索用户
  searchUsers: async (keyword) => {
    set({ searchKeyword: keyword, currentPage: 1 });
    await get().loadUsers(true);
  },

  // 重置状态
  reset: () => {
    set({
      users: [],
      currentSort: UserSortType.REGISTER_TIME,
      loading: false,
      hasMore: true,
      currentPage: 1,
      searchKeyword: ''
    });
  }
}));

export default useCommunityStore;