// src/types/community.ts
// 社区模块类型定义 - 第一版本

/**
 * 用户排序类型
 */
export enum UserSortType {
  REGISTER_TIME = 'register_time',  // 注册时间
  INTERACTION = 'interaction'        // 主页互动数（点赞+红心）
}

/**
 * 社区用户信息
 */
export interface CommunityUser {
  id: number;
  nickname: string;
  avatar: string;
  bio: string;                      // 个人简介
  registerTime: string;             // 注册时间
  likesCount: number;               // 主页获赞数
  favoritesCount: number;           // 主页红心数
  interactionCount: number;         // 互动总数（点赞+红心）
  topicsCount: number;              // 发布话题数
  commentsCount: number;            // 评论数
}

/**
 * 用户列表查询参数
 */
export interface CommunityUserQuery {
  page: number;
  pageSize: number;
  sortBy: UserSortType;
  keyword?: string;                 // 搜索关键词
}

/**
 * 用户列表响应
 */
export interface CommunityUserListResponse {
  users: CommunityUser[];
  total: number;
  hasMore: boolean;
  currentPage: number;
}

/**
 * 用户详细信息（个人主页）
 */
export interface UserProfile extends CommunityUser {
  followersCount: number;           // 粉丝数
  followingCount: number;           // 关注数
  isFollowing: boolean;             // 当前用户是否关注
  recentTopics: Array<{             // 最近话题
    id: number;
    title: string;
    createdAt: string;
    likesCount: number;
  }>;
  tags: string[];                   // 用户标签
}
