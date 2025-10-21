// src/services/community.ts
// 社区模块API服务 - 基于开发代码优化版本

import { http } from './request';
import type {
  CommunityUserQuery,
  CommunityUserListResponse,
  UserProfile
} from '../types/community';

/**
 * 社区服务类
 */
class CommunityService {
  /**
   * 获取用户列表
   */
  async getUserList(params: CommunityUserQuery): Promise<CommunityUserListResponse> {
    return http.get('/community/users', params);
  }

  /**
   * 获取用户详细信息
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    return http.get(`/community/users/${userId}`);
  }

  /**
   * 搜索用户
   */
  async searchUsers(keyword: string, page = 1, pageSize = 20): Promise<CommunityUserListResponse> {
    return http.get('/community/users/search', {
      keyword,
      page,
      pageSize
    });
  }

  /**
   * 关注用户
   */
  async followUser(userId: string): Promise<void> {
    return http.post(`/community/users/${userId}/follow`);
  }

  /**
   * 取消关注
   */
  async unfollowUser(userId: string): Promise<void> {
    return http.delete(`/community/users/${userId}/follow`);
  }
}

export default new CommunityService();