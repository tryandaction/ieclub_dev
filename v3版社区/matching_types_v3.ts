// src/types/matching.ts
// 智能匹配模块类型定义 - 第三版本

/**
 * 匹配类型
 */
export enum MatchingType {
  PROFILE = 'profile',         // 主页相似度
  BEHAVIOR = 'behavior',        // 发言/浏览相似度
  COMPREHENSIVE = 'comprehensive' // 综合相似度
}

/**
 * 相似度详情
 */
export interface SimilarityDetail {
  profileSimilarity: number;    // 主页相似度 (0-100)
  behaviorSimilarity: number;   // 行为相似度 (0-100)
  comprehensiveSimilarity: number; // 综合相似度 (0-100)
  
  // 详细维度
  topicTypeSimilarity: number;  // 话题类型相似度
  categorySimilarity: number;    // 分类相似度
  interestSimilarity: number;    // 兴趣相似度
  activitySimilarity: number;    // 活跃时段相似度
  socialCircleSimilarity: number; // 社交圈相似度
}

/**
 * 匹配用户信息
 */
export interface MatchedUser {
  userId: number;
  nickname: string;
  avatar: string;
  bio: string;
  
  // 相似度信息
  similarity: SimilarityDetail;
  matchScore: number;  // 匹配分数 (0-100)
  matchReason: string[]; // 匹配原因
  
  // 共同点
  commonTopics: number;      // 共同话题数
  commonInterests: string[]; // 共同兴趣标签
  commonFollowers: number;   // 共同关注
  
  // 互补点
  complementaryTypes: string[]; // 互补的话题类型
  
  // 统计信息
  stats: {
    topicsCount: number;
    commentsCount: number;
    likesCount: number;
  };
}

/**
 * 匹配查询参数
 */
export interface MatchingQuery {
  type: MatchingType;
  page: number;
  pageSize: number;
  minScore?: number; // 最低匹配分数
}

/**
 * 匹配结果响应
 */
export interface MatchingListResponse {
  matches: MatchedUser[];
  total: number;
  hasMore: boolean;
  currentPage: number;
  averageScore: number; // 平均匹配分数
}

/**
 * 匹配建议
 */
export interface MatchingSuggestion {
  type: 'follow' | 'collaborate' | 'learn';
  title: string;
  description: string;
  users: MatchedUser[];
}
