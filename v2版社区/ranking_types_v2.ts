// src/types/ranking.ts
// 排行榜模块类型定义 - 第二版本

/**
 * 排行榜时间周期
 */
export enum RankingPeriod {
  WEEK = 'week',    // 周榜
  MONTH = 'month',  // 月榜
  TOTAL = 'total'   // 总榜
}

/**
 * 排行榜类型
 */
export enum RankingType {
  CONTRIBUTION = 'contribution',  // 综合贡献榜
  TOPIC_QUALITY = 'topic_quality', // 话题质量榜
  INTERACTION = 'interaction',     // 互动活跃榜
  HELP_OTHERS = 'help_others'      // 帮助他人榜
}

/**
 * 排行榜用户信息
 */
export interface RankingUser {
  rank: number;              // 排名
  userId: number;
  nickname: string;
  avatar: string;
  bio: string;
  
  // 综合得分
  totalScore: number;
  
  // 分项得分
  topicQualityScore: number;   // 话题质量分
  interactionScore: number;     // 互动活跃分
  helpOthersScore: number;      // 帮助他人分
  
  // 详细统计
  stats: {
    topicsCount: number;        // 话题数
    likesReceived: number;      // 获赞数
    favoritesReceived: number;  // 收藏数
    commentsReceived: number;   // 评论数
    commentsGiven: number;      // 评论他人次数
    likesGiven: number;         // 点赞他人次数
    matchSuccessCount: number;  // 匹配成功次数
  };
  
  // 变化趋势
  rankChange?: number;  // 排名变化（正数上升，负数下降）
  scoreChange?: number; // 分数变化
}

/**
 * 排行榜查询参数
 */
export interface RankingQuery {
  type: RankingType;
  period: RankingPeriod;
  page: number;
  pageSize: number;
}

/**
 * 排行榜响应
 */
export interface RankingListResponse {
  rankings: RankingUser[];
  total: number;
  hasMore: boolean;
  currentPage: number;
  myRanking?: RankingUser;  // 当前用户排名
  updateTime: string;        // 更新时间
}

/**
 * 排行榜奖励配置
 */
export interface RankingReward {
  rank: number;
  badge: string;      // 徽章名称
  badgeColor: string; // 徽章颜色
  title: string;      // 称号
}
