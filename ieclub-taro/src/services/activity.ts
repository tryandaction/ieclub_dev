// src/services/activity.ts
// 活动模块API服务

import { http } from './request';

export interface Activity {
  id: string;
  title: string;
  description: string;
  cover?: string;
  images: string[];
  location: string;
  startTime: string;
  endTime?: string;
  maxParticipants?: number;
  category: string;
  tags: string[];
  author: {
    id: string;
    nickname: string;
    avatar: string;
    isCertified: boolean;
  };
  participantsCount: number;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isParticipated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityQuery {
  page?: number;
  limit?: number;
  category?: string;
  sortBy?: 'latest' | 'hot' | 'popular';
  search?: string;
  status?: 'upcoming' | 'ongoing' | 'ended';
}

export interface ActivityListResponse {
  data: Activity[];
  total: number;
  hasMore: boolean;
  currentPage: number;
}

export interface CreateActivityData {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime?: string;
  maxParticipants?: number;
  category: string;
  tags?: string[];
  images?: string[];
}

export interface ActivityCategory {
  key: string;
  label: string;
  icon: string;
}

/**
 * 活动服务类
 */
class ActivityService {
  /**
   * 获取活动列表
   */
  async getActivities(params: ActivityQuery = {}): Promise<ActivityListResponse> {
    return http.get('/activities', params);
  }

  /**
   * 获取活动详情
   */
  async getActivityDetail(id: string): Promise<Activity> {
    return http.get(`/activities/${id}`);
  }

  /**
   * 创建活动
   */
  async createActivity(data: CreateActivityData): Promise<{ id: string; title: string; author: any; createdAt: string }> {
    return http.post('/activities', data);
  }

  /**
   * 更新活动
   */
  async updateActivity(id: string, data: Partial<CreateActivityData>): Promise<Activity> {
    return http.put(`/activities/${id}`, data);
  }

  /**
   * 删除活动
   */
  async deleteActivity(id: string): Promise<void> {
    return http.delete(`/activities/${id}`);
  }

  /**
   * 点赞/取消点赞活动
   */
  async toggleLike(id: string): Promise<{ isLiked: boolean; likesCount: number }> {
    return http.post(`/activities/${id}/like`);
  }

  /**
   * 参与/取消参与活动
   */
  async toggleParticipation(id: string): Promise<{ isParticipated: boolean; participantsCount: number }> {
    return http.post(`/activities/${id}/participate`);
  }

  /**
   * 获取活动分类列表
   */
  async getCategories(): Promise<ActivityCategory[]> {
    return http.get('/activities/categories');
  }
}

export default new ActivityService();
