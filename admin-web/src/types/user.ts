// 用户相关类型定义

export interface User {
  id: string;
  nickname: string;
  email: string;
  school?: string;
  major?: string;
  grade?: string;
  avatar?: string;
  bio?: string;
  status: UserStatus;
  isVerified: boolean;
  level: number;
  credits: number;
  topicsCount: number;
  postsCount: number;
  commentsCount: number;
  followersCount: number;
  followingCount: number;
  likesReceivedCount: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type UserStatus = 'active' | 'banned' | 'deleted';

export interface UserDetail extends User {
  recentTopics: Array<{
    id: string;
    title: string;
    createdAt: string;
  }>;
  recentPosts: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
  warnings: UserWarning[];
  bans: UserBan[];
  reportCount: number;
}

export interface UserWarning {
  id: string;
  userId: string;
  adminId: string;
  reason: string;
  content: string;
  level: WarningLevel;
  relatedPostId?: string;
  relatedTopicId?: string;
  isRead: boolean;
  createdAt: string;
  admin?: {
    username: string;
    realName?: string;
  };
}

export type WarningLevel = 'minor' | 'serious' | 'final';

export interface UserBan {
  id: string;
  userId: string;
  adminId: string;
  reason: string;
  duration?: number;
  status: BanStatus;
  startAt: string;
  expireAt?: string;
  unbannedAt?: string;
  unbannedBy?: string;
  unbannedReason?: string;
  createdAt: string;
  admin?: {
    username: string;
    realName?: string;
  };
}

export type BanStatus = 'active' | 'expired' | 'revoked';

export interface WarnUserRequest {
  reason: string;
  content: string;
  level: WarningLevel;
  relatedPostId?: string;
  relatedTopicId?: string;
}

export interface BanUserRequest {
  reason: string;
  duration?: number;
  notifyUser: boolean;
}

export interface UnbanUserRequest {
  reason: string;
}

