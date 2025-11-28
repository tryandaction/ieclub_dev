// 举报管理API
import { http } from './request';
import type { Report, PaginationResponse } from '@/types/common';

export const reportApi = {
  // 获取举报列表
  getReports: (params?: any) => {
    return http.get<PaginationResponse<Report>>('/admin/reports', { params });
  },

  // list 别名（兼容旧代码）
  list: (params?: any) => {
    return http.get<PaginationResponse<Report>>('/admin/reports', { params });
  },

  // get 别名（兼容旧代码）
  get: (id: number) => {
    return http.get<Report>(`/admin/reports/${id}`);
  },

  // 获取举报详情
  getReport: (id: number) => {
    return http.get<Report>(`/admin/reports/${id}`);
  },

  // 处理举报
  handleReport: (id: number | string, data: { action: 'approve' | 'reject'; note: string }) => {
    return http.post<Report>(`/admin/reports/${id}/handle`, data);
  },

  // 获取统计数据
  getStats: () => {
    return http.get('/admin/reports/stats');
  },
};
