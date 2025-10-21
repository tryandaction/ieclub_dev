// src/services/community.ts
// 社区模块API服务 - 第一版本

import request from './request';
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
    return request.get('/api/community/users', params);
  }

  /**
   * 获取用户详细信息
   */
  async getUserProfile(userId: number): Promise<UserProfile> {
    return request.get(`/api/community/users/${userId}`);
  }

  /**
   * 搜索用户
   */
  async searchUsers(keyword: string, page = 1, pageSize = 20): Promise<CommunityUserListResponse> {
    return request.get('/api/community/users/search', {
      keyword,
      page,
      pageSize
    });
  }

  /**
   * 关注用户
   */
  async followUser(userId: number): Promise<void> {
    return request.post(`/api/community/users/${userId}/follow`);
  }

  /**
   * 取消关注
   */
  async unfollowUser(userId: number): Promise<void> {
    return request.delete(`/api/community/users/${userId}/follow`);
  }
}

export default new CommunityService();
