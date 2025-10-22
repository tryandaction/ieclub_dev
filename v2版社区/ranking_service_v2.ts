// src/services/ranking.ts
// 排行榜API服务 - 第二版本

import request from './request';
import type {
  RankingQuery,
  RankingListResponse,
  RankingUser,
  RankingReward
} from '../types/ranking';

/**
 * 排行榜服务类
 */
class RankingService {
  /**
   * 获取排行榜列表
   */
  async getRankingList(params: RankingQuery): Promise<RankingListResponse> {
    return request.get('/api/community/rankings', params);
  }

  /**
   * 获取用户排名详情
   */
  async getUserRanking(userId: number, type: string, period: string): Promise<RankingUser> {
    return request.get(`/api/community/rankings/users/${userId}`, {
      type,
      period
    });
  }

  /**
   * 获取排行榜奖励配置
   */
  async getRewardConfig(): Promise<RankingReward[]> {
    return request.get('/api/community/rankings/rewards');
  }

  /**
   * 获取我的排名
   */
  async getMyRanking(type: string, period: string): Promise<RankingUser> {
    return request.get('/api/community/rankings/mine', {
      type,
      period
    });
  }
}

export default new RankingService();
