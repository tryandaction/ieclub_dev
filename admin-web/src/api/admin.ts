// 管理员认证相关API
import { http } from './request';
import type {
  Admin,
  LoginRequest,
  LoginResponse,
  TwoFactorSetupResponse,
  ChangePasswordRequest,
} from '@/types/admin';

export const adminAuthApi = {
  // 登录
  login: (data: LoginRequest) => {
    return http.post<LoginResponse>('/auth/login', data);
  },

  // 登出
  logout: () => {
    return http.post('/auth/logout');
  },

  // 刷新Token
  refresh: (refreshToken: string) => {
    return http.post<LoginResponse>('/auth/refresh', { refreshToken });
  },

  // 获取当前管理员信息
  getMe: () => {
    return http.get<Admin>('/auth/me');
  },

  // 修改密码
  changePassword: (data: ChangePasswordRequest) => {
    return http.post('/auth/change-password', data);
  },

  // 启用2FA
  enable2FA: () => {
    return http.post<TwoFactorSetupResponse>('/auth/enable-2fa');
  },

  // 验证2FA
  verify2FA: (token: string) => {
    return http.post('/auth/verify-2fa', { token });
  },

  // 禁用2FA
  disable2FA: (token: string) => {
    return http.post('/auth/disable-2fa', { token });
  },
};

