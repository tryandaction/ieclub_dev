// 管理员相关类型定义

export interface Admin {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  status: AdminStatus;
  realName?: string;
  avatar?: string;
  phone?: string;
  department?: string;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdminRole = 'super_admin' | 'platform_admin' | 'content_moderator' | 'data_analyst';

export type AdminStatus = 'active' | 'inactive' | 'locked';

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: Admin;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

