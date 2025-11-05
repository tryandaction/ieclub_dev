// 统计相关类型定义
export interface DashboardStats {
  overview: {
    totalUsers: number;
    totalPosts: number;
    totalTopics: number;
    totalComments: number;
    activeUsersWeek: number;
    activeBans: number;
    todayNew: {
      users: number;
      posts: number;
      comments: number;
    };
    pending: {
      reports: number;
    };
  };
  userTrend: Array<{
    date: string;
    newUsers: number;
    activeUsers: number;
  }>;
  contentTrend: Array<{
    date: string;
    posts: number;
    topics: number;
    comments: number;
  }>;
  topContent: {
    posts: Array<{
      id: number;
      title: string;
      author: string;
      viewCount: number;
      likeCount: number;
    }>;
    topics: Array<{
      id: number;
      title: string;
      creator: string;
      postCount: number;
      followCount: number;
    }>;
  };
}

export interface UserStats {
  total: number;
  byRole: Record<string, number>;
  bySchool: Array<{
    schoolName: string;
    count: number;
  }>;
  growthTrend: Array<{
    date: string;
    count: number;
  }>;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface ContentStats {
  posts: {
    total: number;
    byCategory: Record<string, number>;
    trend: Array<{
      date: string;
      count: number;
    }>;
  };
  topics: {
    total: number;
    trend: Array<{
      date: string;
      count: number;
    }>;
  };
  comments: {
    total: number;
    trend: Array<{
      date: string;
      count: number;
    }>;
  };
}

export interface ExportParams {
  type: 'users' | 'posts' | 'topics' | 'comments' | 'reports';
  format: 'csv' | 'excel' | 'json';
  startDate?: string;
  endDate?: string;
  filters?: Record<string, any>;
}
