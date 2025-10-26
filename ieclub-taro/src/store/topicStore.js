/**
 * 话题状态管理 Store
 * 管理话题列表、筛选、排序等状态
 */
import { create } from 'zustand';

// 话题类型枚举
export const TopicType = {
  OFFER: 'offer',       // 我来讲
  DEMAND: 'demand',     // 想听
  PROJECT: 'project',   // 项目宣传
};

// 话题分类枚举
export const TopicCategory = {
  ALL: 'all',           // 全部
  STUDY: 'study',       // 学习
  RESEARCH: 'research', // 科研
  SKILL: 'skill',       // 技能
  STARTUP: 'startup',   // 创业
  LIFE: 'life',         // 生活
};

// 排序方式枚举
export const TopicSortBy = {
  RECOMMENDED: 'recommended', // 推荐
  LATEST: 'latest',           // 最新
  HOT: 'hot',                 // 最热
  TRENDING: 'trending',       // 趋势
};

export const useTopicStore = create((set, get) => ({
  // ===== 状态 =====
  topics: [],                           // 话题列表
  currentTopic: null,                   // 当前查看的话题
  filters: {
    type: null,                         // 话题类型筛选
    category: TopicCategory.ALL,       // 分类筛选
    sortBy: TopicSortBy.RECOMMENDED,   // 排序方式
    tags: [],                           // 标签筛选
  },
  pagination: {
    page: 1,                            // 当前页码
    pageSize: 20,                       // 每页数量
    total: 0,                           // 总数
    hasMore: true,                      // 是否还有更多
  },
  isLoading: false,                     // 是否加载中
  error: null,                          // 错误信息

  // ===== Actions =====
  
  /**
   * 设置话题列表
   * @param {array} topics - 话题列表
   * @param {boolean} append - 是否追加到现有列表
   */
  setTopics: (topics, append = false) => {
    set((state) => ({
      topics: append ? [...state.topics, ...topics] : topics,
    }));
  },

  /**
   * 添加话题
   * @param {object} topic - 话题对象
   */
  addTopic: (topic) => {
    set((state) => ({
      topics: [topic, ...state.topics],
    }));
  },

  /**
   * 更新话题
   * @param {string} topicId - 话题ID
   * @param {object} updates - 更新的字段
   */
  updateTopic: (topicId, updates) => {
    set((state) => ({
      topics: state.topics.map((topic) =>
        topic.id === topicId ? { ...topic, ...updates } : topic
      ),
    }));
  },

  /**
   * 删除话题
   * @param {string} topicId - 话题ID
   */
  deleteTopic: (topicId) => {
    set((state) => ({
      topics: state.topics.filter((topic) => topic.id !== topicId),
    }));
  },

  /**
   * 设置当前话题
   * @param {object} topic - 话题对象
   */
  setCurrentTopic: (topic) => {
    set({ currentTopic: topic });
  },

  /**
   * 设置筛选条件
   * @param {object} filters - 筛选条件
   */
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }, // 重置页码
    }));
  },

  /**
   * 重置筛选条件
   */
  resetFilters: () => {
    set({
      filters: {
        type: null,
        category: TopicCategory.ALL,
        sortBy: TopicSortBy.RECOMMENDED,
        tags: [],
      },
      pagination: { page: 1, pageSize: 20, total: 0, hasMore: true },
    });
  },

  /**
   * 设置分页信息
   * @param {object} pagination - 分页信息
   */
  setPagination: (pagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
  },

  /**
   * 加载下一页
   */
  loadNextPage: () => {
    set((state) => ({
      pagination: {
        ...state.pagination,
        page: state.pagination.page + 1,
      },
    }));
  },

  /**
   * 点赞话题
   * @param {string} topicId - 话题ID
   */
  likeTopic: (topicId) => {
    set((state) => ({
      topics: state.topics.map((topic) =>
        topic.id === topicId
          ? {
              ...topic,
              isLiked: !topic.isLiked,
              likesCount: topic.isLiked
                ? topic.likesCount - 1
                : topic.likesCount + 1,
            }
          : topic
      ),
    }));
  },

  /**
   * 收藏话题
   * @param {string} topicId - 话题ID
   */
  bookmarkTopic: (topicId) => {
    set((state) => ({
      topics: state.topics.map((topic) =>
        topic.id === topicId
          ? {
              ...topic,
              isBookmarked: !topic.isBookmarked,
              bookmarksCount: topic.isBookmarked
                ? topic.bookmarksCount - 1
                : topic.bookmarksCount + 1,
            }
          : topic
      ),
    }));
  },

  /**
   * 增加浏览次数
   * @param {string} topicId - 话题ID
   */
  incrementViews: (topicId) => {
    set((state) => ({
      topics: state.topics.map((topic) =>
        topic.id === topicId
          ? { ...topic, viewsCount: topic.viewsCount + 1 }
          : topic
      ),
    }));
  },

  /**
   * 设置加载状态
   * @param {boolean} isLoading - 是否加载中
   */
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  /**
   * 设置错误信息
   * @param {string|null} error - 错误信息
   */
  setError: (error) => {
    set({ error });
  },

  /**
   * 清除错误
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * 重置所有状态
   */
  reset: () => {
    set({
      topics: [],
      currentTopic: null,
      filters: {
        type: null,
        category: TopicCategory.ALL,
        sortBy: TopicSortBy.RECOMMENDED,
        tags: [],
      },
      pagination: { page: 1, pageSize: 20, total: 0, hasMore: true },
      isLoading: false,
      error: null,
    });
  },
}));

export default useTopicStore;

