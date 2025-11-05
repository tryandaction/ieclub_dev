// Axios请求配置和拦截器
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '@/types/common';

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: '/api/admin',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加Token
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response;
    
    // 统一返回格式
    if (data.code === 200) {
      return data;
    }
    
    // 处理业务错误
    message.error(data.message || '请求失败');
    return Promise.reject(data);
  },
  async (error: AxiosError<ApiResponse>) => {
    // 网络错误
    if (!error.response) {
      message.error('网络连接失败，请检查网络设置');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Token过期，尝试刷新
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken && !error.config?.url?.includes('/auth/refresh')) {
          try {
            const { data: refreshData } = await axios.post('/api/admin/auth/refresh', {
              refreshToken,
            });
            
            // 更新Token
            localStorage.setItem('admin_token', refreshData.data.accessToken);
            localStorage.setItem('refresh_token', refreshData.data.refreshToken);
            
            // 重试原请求
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${refreshData.data.accessToken}`;
              return request(error.config);
            }
          } catch {
            // 刷新失败，清除Token并跳转登录
            localStorage.removeItem('admin_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            message.error('登录已过期，请重新登录');
          }
        } else {
          // 无RefreshToken，跳转登录
          localStorage.removeItem('admin_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          message.error('请先登录');
        }
        break;

      case 403:
        message.error(data?.message || '权限不足');
        break;

      case 404:
        message.error(data?.message || '请求的资源不存在');
        break;

      case 429:
        message.error('请求过于频繁，请稍后再试');
        break;

      case 500:
        message.error(data?.message || '服务器错误，请稍后重试');
        break;

      default:
        message.error(data?.message || `请求失败 (${status})`);
    }

    return Promise.reject(error);
  }
);

// 封装常用请求方法
export const http = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return request.get(url, config);
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return request.post(url, data, config);
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return request.put(url, data, config);
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return request.delete(url, config);
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return request.patch(url, data, config);
  },
};

export default request;

