// src/services/matching.ts
// 智能匹配API服务 - 第三版本

import request from './request';
import type {
  MatchingQuery,
  MatchingListResponse,
  MatchedUser,
  MatchingSuggestion
} from '../types/matching';

/**
 * 智能匹配服务类
 */
class MatchingService {
  /**
   * 获取匹配用户列表
   */
  async getMatchedUsers(params: MatchingQuery): Promise<MatchingListResponse> {
    return request.get('/api/community/matching', params);
  }

  /**
   * 获取与指定用户的相似度
   */
  async getUserSimilarity(userId: number): Promise<MatchedUser> {
    return request.get(`/api/community/matching/users/${userId}`);
  }

  /**
   * 获取匹配建议
   */
  async getMatchingSuggestions(): Promise<MatchingSuggestion[]> {
    return request.get('/api/community/matching/suggestions');
  }

  /**
   * 刷新匹配结果（重新计算）
   */
  async refreshMatching(): Promise<void> {
    return request.post('/api/community/matching/refresh');
  }
}

export default new MatchingService();
