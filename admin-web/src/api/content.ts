// 内容管理相关API
import request from './request';

export interface GetPostsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  type?: string;
  status?: string;
}

export interface GetTopicsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  status?: string;
}

export const contentApi = {
  // 获取帖子列表
  getPosts: (params: GetPostsParams) => {
    return request.get('/admin/content/posts', { params });
  },

  // 获取帖子详情
  getPostDetail: (id: number) => {
    return request.get(`/admin/content/posts/${id}`);
  },

  // 删除帖子
  deletePost: (id: number) => {
    return request.delete(`/admin/content/posts/${id}`);
  },

  // 锁定/解锁帖子
  togglePostLock: (id: number, locked: boolean) => {
    return request.put(`/admin/content/posts/${id}/lock`, { locked });
  },

  // 获取话题列表
  getTopics: (params: GetTopicsParams) => {
    return request.get('/admin/content/topics', { params });
  },

  // 获取话题详情
  getTopicDetail: (id: number) => {
    return request.get(`/admin/content/topics/${id}`);
  },

  // 删除话题
  deleteTopic: (id: number) => {
    return request.delete(`/admin/content/topics/${id}`);
  },

  // 锁定/解锁话题
  toggleTopicLock: (id: number, locked: boolean) => {
    return request.put(`/admin/content/topics/${id}/lock`, { locked });
  },

  // 获取内容统计
  getContentStats: () => {
    return request.get('/admin/stats/content');
  },
};

export default contentApi;

