// 公告管理API
import { http } from './request';
import type {
  Announcement,
  CreateAnnouncementRequest,
  AnnouncementStats,
} from '@/types/announcement';
import type { PaginationParams, PaginationResponse } from '@/types/common';

export const announcementApi = {
  // 获取公告列表
  list: (params: PaginationParams & {
    type?: string;
    status?: string;
    priority?: string;
    keyword?: string;
  }) => {
    return http.get<PaginationResponse<Announcement>>('/announcements', { params });
  },

  // 获取公告详情
  get: (id: string) => {
    return http.get<Announcement>(`/announcements/${id}`);
  },

  // 创建公告
  create: (data: CreateAnnouncementRequest) => {
    return http.post<Announcement>('/announcements', data);
  },

  // 更新公告
  update: (id: string, data: Partial<CreateAnnouncementRequest>) => {
    return http.put<Announcement>(`/announcements/${id}`, data);
  },

  // 删除公告
  delete: (id: string) => {
    return http.delete(`/announcements/${id}`);
  },

  // 发布公告
  publish: (id: string) => {
    return http.post<Announcement>(`/announcements/${id}/publish`);
  },

  // 归档公告
  archive: (id: string) => {
    return http.post<Announcement>(`/announcements/${id}/archive`);
  },

  // 获取公告统计
  stats: (id: string) => {
    return http.get<AnnouncementStats>(`/announcements/${id}/stats`);
  },
};

