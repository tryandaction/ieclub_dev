// 通用类型定义

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResponse<T = any> {
  list: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  description: string;
  details?: {
    before?: any;
    after?: any;
    changes?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed';
  level: 'info' | 'warning' | 'error';
  createdAt: string;
  admin?: {
    id: string;
    username: string;
    realName?: string;
  };
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'post' | 'topic' | 'comment' | 'user';
  targetId: string;
  reason: string;
  category: ReportCategory;
  description?: string;
  status: ReportStatus;
  handledBy?: string;
  handledAt?: string;
  handlerNote?: string;
  action?: ReportAction;
  createdAt: string;
  reporter?: {
    id: string;
    nickname: string;
  };
  target?: any;
  handler?: {
    id: string;
    username: string;
    realName?: string;
  };
}

export type ReportCategory = 
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'misinformation'
  | 'copyright'
  | 'other';

export type ReportStatus = 'pending' | 'processing' | 'resolved' | 'rejected';

export type ReportAction = 
  | 'none'
  | 'hide_content'
  | 'delete_content'
  | 'warn_user'
  | 'ban_user';

export interface HandleReportRequest {
  action: ReportAction;
  reason: string;
  additionalAction?: {
    warnUser?: boolean;
    warningLevel?: 'minor' | 'serious' | 'final';
    banUser?: boolean;
    banDuration?: number;
  };
}

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  permission?: string;
}

