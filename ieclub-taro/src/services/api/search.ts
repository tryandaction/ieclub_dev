// 搜索相关API

import { request } from '../request';

// 搜索话题
export const searchTopics = async (params: {
  q: string;
  category?: string;
  topicType?: string;
  tags?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}) => {
  return request({
    url: '/search/topics',
    method: 'GET',
    data: params,
    needAuth: false
  });
};

// 搜索用户
export const searchUsers = async (params: {
  q: string;
  page?: number;
  limit?: number;
}) => {
  return request({
    url: '/search/users',
    method: 'GET',
    data: params,
    needAuth: false
  });
};

// 获取热门搜索词
export const getHotKeywords = async (params?: { limit?: number }) => {
  return request({
    url: '/search/hot-keywords',
    method: 'GET',
    data: params || {},
    needAuth: false
  });
};

// 获取搜索历史
export const getSearchHistory = async (params?: { limit?: number }) => {
  return request({
    url: '/search/history',
    method: 'GET',
    data: params || {},
    needAuth: true
  });
};

// 清除搜索历史
export const clearSearchHistory = async () => {
  return request({
    url: '/search/history',
    method: 'DELETE',
    needAuth: true
  });
};

// 获取搜索建议
export const getSearchSuggestions = async (params: {
  q: string;
  type?: string;
}) => {
  return request({
    url: '/search/suggest',
    method: 'GET',
    data: params,
    needAuth: false
  });
};