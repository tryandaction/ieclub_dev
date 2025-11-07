// 系统设置相关API
import request from './request';

export interface BasicSettings {
  siteName: string;
  siteUrl: string;
  siteDescription?: string;
  enableRegistration: boolean;
  enableComment: boolean;
  enableLike: boolean;
  enableBookmark: boolean;
}

export interface SecuritySettings {
  enableTwoFactor: boolean;
  loginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  passwordMinLength: number;
  passwordRequireSpecial: boolean;
  enableCaptcha: boolean;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom: string;
  smtpFromName: string;
}

export interface NotificationSettings {
  enableEmailNotification: boolean;
  enablePushNotification: boolean;
  notifyNewUser: boolean;
  notifyNewPost: boolean;
  notifyNewReport: boolean;
  notifySystemError: boolean;
}

export const settingsApi = {
  // 获取所有设置
  getSettings: () => {
    return request.get('/admin/settings');
  },

  // 保存基础设置
  saveBasicSettings: (data: BasicSettings) => {
    return request.put('/admin/settings/basic', data);
  },

  // 保存安全设置
  saveSecuritySettings: (data: SecuritySettings) => {
    return request.put('/admin/settings/security', data);
  },

  // 保存邮件设置
  saveEmailSettings: (data: EmailSettings) => {
    return request.put('/admin/settings/email', data);
  },

  // 保存通知设置
  saveNotificationSettings: (data: NotificationSettings) => {
    return request.put('/admin/settings/notification', data);
  },

  // 测试邮件
  testEmail: (email: string) => {
    return request.post('/admin/settings/test-email', { email });
  },
};

export default settingsApi;

