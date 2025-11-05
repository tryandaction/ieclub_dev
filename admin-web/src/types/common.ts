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
  metadata?: any; // 额外元数据
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
  type?: string; // 举报类型别名
  category: ReportCategory;
  description?: string;
  status: ReportStatus;
  handledBy?: string;
  handledAt?: string;
  handlerNote?: string;
  note?: string; // 处理说明别名
  action?: ReportAction;
  createdAt: string;
  reporter?: {
    id: string;
    nickname: string;
    realName?: string; // 真实姓名
    email?: string; // 邮箱
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

// 用户类型
export interface User {
  id: string;
  nickname: string;
  email: string;
  avatar?: string;
  username?: string;
  realName?: string;
  role?: 'student' | 'teacher';
  schoolName?: string;
  studentId?: string;
  phone?: string;
  isBanned?: boolean;
  warningCount?: number;
  createdAt: string;
  updatedAt?: string;
}

// 公告类型
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'event' | 'notice' | 'update';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'active' | 'scheduled' | 'expired';
  startTime?: string;
  endTime?: string;
  publisherId: string;
  publisher?: {
    id: string;
    username: string;
    realName?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

