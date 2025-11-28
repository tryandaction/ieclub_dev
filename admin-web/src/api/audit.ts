// 审计日志API
import { http } from './request';
import type { AuditLog, PaginationResponse } from '@/types/common';

export const auditApi = {
  // 获取日志列表
  getLogs: (params?: any) => {
    return http.get<PaginationResponse<AuditLog>>('/admin/audit/logs', { params });
  },

  // 获取日志详情
  getLog: (id: number) => {
    return http.get<AuditLog>(`/admin/audit/logs/${id}`);
  },

  // 导出日志
  exportLogs: (params?: any) => {
    return http.get('/admin/audit/logs/export', { 
      params,
      responseType: 'blob' 
    });
  },

  // 获取统计数据
  getStats: (params?: any) => {
    return http.get('/admin/audit/stats', { params });
  },
};
