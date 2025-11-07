// 统计API
import { http } from './request';
import type { ApiResponse } from '@/types/common';
import type { DashboardStats, UserStats, ContentStats, ExportParams } from '@/types/stats';

export const statsApi = {
  // 获取仪表盘数据
  dashboard: () => {
    return http.get<DashboardStats>('/admin/stats/dashboard');
  },

  // 获取用户统计
  users: (params?: any) => {
    return http.get<UserStats>('/admin/stats/users', { params });
  },

  // 获取内容统计
  content: (params?: any) => {
    return http.get<ContentStats>('/admin/stats/content', { params });
  },

  // 导出数据
  export: (params: ExportParams) => {
    return http.post('/admin/stats/export', params, {
      responseType: 'blob',
    });
  },
};
