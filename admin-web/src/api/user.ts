// 用户管理API
import { http } from './request';
import type {
  User,
  UserDetail,
  WarnUserRequest,
  BanUserRequest,
  UnbanUserRequest,
} from '@/types/user';
import type { PaginationParams, PaginationResponse } from '@/types/common';

export const userApi = {
  // 获取用户列表
  list: (params: PaginationParams & {
    keyword?: string;
    school?: string;
    status?: string;
    isVerified?: boolean;
    minLevel?: number;
    maxLevel?: number;
  }) => {
    return http.get<PaginationResponse<User>>('/users', { params });
  },

  // 获取用户详情
  get: (id: string) => {
    return http.get<UserDetail>(`/users/${id}`);
  },

  // 更新用户信息
  update: (id: string, data: Partial<User>) => {
    return http.put<User>(`/users/${id}`, data);
  },

  // 警告用户
  warn: (id: string, data: WarnUserRequest) => {
    return http.post(`/users/${id}/warn`, data);
  },

  // 封禁用户
  ban: (id: string, data: BanUserRequest) => {
    return http.post(`/users/${id}/ban`, data);
  },

  // 解封用户
  unban: (id: string, data: UnbanUserRequest) => {
    return http.post(`/users/${id}/unban`, data);
  },

  // 删除用户
  delete: (id: string) => {
    return http.delete(`/users/${id}`);
  },

  // 获取用户警告记录
  getWarnings: (userId: string, params?: PaginationParams) => {
    return http.get(`/users/${userId}/warnings`, { params });
  },

  // 获取用户封禁记录
  getBans: (userId: string, params?: PaginationParams) => {
    return http.get(`/users/${userId}/bans`, { params });
  },
};

