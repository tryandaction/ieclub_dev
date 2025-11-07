// 公告相关类型定义

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  displayType: AnnouncementDisplayType;
  targetAudience: TargetAudience;
  publishAt?: string;
  expireAt?: string;
  startTime?: string; // 开始时间别名
  endTime?: string; // 结束时间别名
  viewCount: number;
  clickCount: number;
  closeCount: number;
  createdBy: string;
  publisherId?: string; // 发布者ID别名
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    username: string;
    realName?: string;
  };
  publisher?: {
    id: string;
    username: string;
    realName?: string;
  };
}

export type AnnouncementType = 'system' | 'feature' | 'activity' | 'policy' | 'general';

export type AnnouncementPriority = 'low' | 'medium' | 'high' | 'urgent';

export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'expired' | 'archived';

export type AnnouncementDisplayType = 'popup' | 'banner' | 'notice';

export interface TargetAudience {
  type: 'all' | 'school' | 'role' | 'user';
  schools?: string[];
  roles?: string[];
  userIds?: string[];
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  displayType: AnnouncementDisplayType;
  targetAudience: TargetAudience;
  publishAt?: string;
  expireAt?: string;
}

export interface AnnouncementStats {
  totalViews: number;
  totalClicks: number;
  totalCloses: number;
  viewRate: number;
  clickRate: number;
  closeRate: number;
  viewTrend: Array<{ date: string; count: number }>;
}

