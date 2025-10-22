// src/store/ranking.ts
// 排行榜状态管理 - 第二版本

import { create } from 'zustand';
import rankingService from '../services/ranking';
import type { RankingUser, RankingType, RankingPeriod, RankingReward } from '../types/ranking';

interface RankingState {
  // 状态
  rankings: RankingUser[];
  myRanking: RankingUser | null;
  currentType: RankingType;
  currentPeriod: RankingPeriod;
  loading: boolean;
  hasMore: boolean;
  currentPage: number;
  updateTime: string;
  rewards: RankingReward[];

  // 操作方法
  setType: (type: RankingType) => void;
  setPeriod: (period: RankingPeriod) => void;
  loadRankings: (refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  loadMyRanking: () => Promise<void>;
  loadRewards: () => Promise<void>;
  reset: () => void;
}

const useRankingStore = create<RankingState>((set, get) => ({
  // 初始状态
  rankings: [],
  myRanking: null,
  currentType: 'contribution' as RankingType,
  currentPeriod: 'week' as RankingPeriod,
  loading: false,
  hasMore: true,
  currentPage: 1,
  updateTime: '',
  rewards: [],

  // 设置排行榜类型
  setType: (type) => {
    set({ currentType: type });
    get().loadRankings(true);
  },

  // 设置时间周期
  setPeriod: (period) => {
    set({ currentPeriod: period });
    get().loadRankings(true);
  },

  // 加载排行榜
  loadRankings: async (refresh = false) => {
    const { loading, currentType, currentPeriod } = get();
    if (loading) return;

    set({ loading: true });

    try {
      const page = refresh ? 1 : get().currentPage;
      const response = await rankingService.getRankingList({
        type: currentType,
        period: currentPeriod,
        page,
        pageSize: 20
      });

      set({
        rankings: refresh ? response.rankings : [...get().rankings, ...response.rankings],
        myRanking: response.myRanking || null,
        hasMore: response.hasMore,
        currentPage: page,
        updateTime: response.updateTime,
        loading: false
      });
    } catch (error) {
      console.error('加载排行榜失败:', error);
      set({ loading: false });
    }
  },

  // 加载更多
  loadMore: async () => {
    const { hasMore, loading } = get();
    if (!hasMore || loading) return;

    set({ currentPage: get().currentPage + 1 });
    await get().loadRankings(false);
  },

  // 加载我的排名
  loadMyRanking: async () => {
    const { currentType, currentPeriod } = get();
    
    try {
      const myRanking = await rankingService.getMyRanking(currentType, currentPeriod);
      set({ myRanking });
    } catch (error) {
      console.error('加载我的排名失败:', error);
    }
  },

  // 加载奖励配置
  loadRewards: async () => {
    try {
      const rewards = await rankingService.getRewardConfig();
      set({ rewards });
    } catch (error) {
      console.error('加载奖励配置失败:', error);
    }
  },

  // 重置状态
  reset: () => {
    set({
      rankings: [],
      myRanking: null,
      currentType: 'contribution' as RankingType,
      currentPeriod: 'week' as RankingPeriod,
      loading: false,
      hasMore: true,
      currentPage: 1,
      updateTime: '',
      rewards: []
    });
  }
}));

export default useRankingStore;
