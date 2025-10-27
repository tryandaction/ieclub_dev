// ===== API基础配置 =====
const getApiBaseUrl = () => {
  // 尝试从环境变量获取
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL;
    }
    if (import.meta.env.MODE === 'development') {
      return 'http://localhost:5000/api/v1';
    }
  }
  
  // 尝试从process.env获取（Taro环境）
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.TARO_ENV === 'h5') {
      // H5环境：根据当前域名判断
      if (typeof window !== 'undefined') {
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        return isDev ? 'http://localhost:5000/api/v1' : 'https://www.ieclub.online/api/v1';
      }
    }
  }
  
  // 默认生产环境
  return 'https://www.ieclub.online/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

// ===== 请求缓存 =====
const requestCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 生成缓存key
 */
const getCacheKey = (url, options) => {
  return `${url}_${JSON.stringify(options)}`;
};

/**
 * 获取缓存
 */
const getCache = (key) => {
  const cached = requestCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    requestCache.delete(key);
    return null;
  }
  
  return cached.data;
};

/**
 * 设置缓存
 */
const setCache = (key, data) => {
  requestCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

/**
 * 清除所有缓存
 */
export const clearCache = () => {
  requestCache.clear();
};

// ===== 请求拦截器 =====
const requestInterceptor = (config) => {
  // 添加认证token
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // 添加时间戳（防止缓存）
  if (config.method === 'GET' && !config.noTimestamp) {
    const url = new URL(config.url);
    url.searchParams.append('_t', Date.now());
    config.url = url.toString();
  }
  
  return config;
};

// ===== 响应拦截器 =====
const responseInterceptor = async (response) => {
  // 检查响应状态
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.response = response;
    
    // 尝试解析错误响应
    try {
      const errorData = await response.json();
      error.data = errorData;
      error.message = errorData.message || error.message;
    } catch (e) {
      // 如果无法解析JSON，使用默认错误消息
    }
    
    throw error;
  }
  
  return response;
};

// ===== 错误处理 =====
const handleError = (error) => {
  // 网络错误
  if (!error.response) {
    console.error('Network Error:', error.message);
    return {
      success: false,
      message: '网络连接失败，请检查您的网络设置',
      error: error.message,
    };
  }
  
  // HTTP错误
  const status = error.status;
  let message = error.message;
  
  switch (status) {
    case 400:
      message = error.data?.message || '请求参数错误';
      break;
    case 401:
      message = '未登录或登录已过期，请重新登录';
      // 清除token
      localStorage.removeItem('token');
      // 可以在这里触发跳转到登录页
      window.location.hash = '/login';
      break;
    case 403:
      message = '没有权限访问此资源';
      break;
    case 404:
      message = '请求的资源不存在';
      break;
    case 500:
      message = '服务器错误，请稍后重试';
      break;
    case 503:
      message = '服务暂时不可用，请稍后重试';
      break;
    default:
      message = error.data?.message || '请求失败';
  }
  
  console.error('API Error:', { status, message, error });
  
  return {
    success: false,
    message,
    status,
    error: error.data,
  };
};

// ===== 创建增强的API请求函数 =====
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 默认配置
  let config = {
    url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    ...options,
  };
  
  // 应用请求拦截器
  config = requestInterceptor(config);
  
  // 检查缓存（仅GET请求）
  if (config.method === 'GET' && !config.noCache) {
    const cacheKey = getCacheKey(url, config);
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      console.log('使用缓存数据:', endpoint);
      return cachedData;
    }
  }
  
  try {
    // 发送请求
    const response = await fetch(config.url, config);
    
    // 应用响应拦截器
    const validResponse = await responseInterceptor(response);
    
    // 解析响应
    const data = await validResponse.json();
    
    // 缓存GET请求的响应
    if (config.method === 'GET' && !config.noCache) {
      const cacheKey = getCacheKey(url, config);
      setCache(cacheKey, data);
    }
    
    return data;
  } catch (error) {
    // 统一错误处理
    throw handleError(error);
  }
};

// API方法封装
export const api = {
  // 认证相关
  auth: {
    login: (credentials) => apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    register: (userData) => apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    getCurrentUser: () => apiRequest('/auth/me'),
    logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  },

  // 帖子相关
  posts: {
    getList: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/posts${query ? `?${query}` : ''}`);
    },
    getById: (id) => apiRequest(`/posts/${id}`),
    create: (postData) => apiRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    }),
    update: (id, postData) => apiRequest(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    }),
    delete: (id) => apiRequest(`/posts/${id}`, { method: 'DELETE' }),
    like: (id) => apiRequest(`/posts/${id}/like`, { method: 'POST' }),
    bookmark: (id) => apiRequest(`/posts/${id}/bookmark`, { method: 'POST' }),
  },

  // 用户相关
  users: {
    getById: (id) => apiRequest(`/users/${id}`),
    update: (userData) => apiRequest('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
    getBookmarks: () => apiRequest('/users/me/bookmarks'),
  },

  // 活动相关
  events: {
    getList: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/events${query ? `?${query}` : ''}`);
    },
    getById: (id) => apiRequest(`/events/${id}`),
    register: (id) => apiRequest(`/events/${id}/register`, { method: 'POST' }),
  },

  // OCR相关
  ocr: {
    recognize: (formData) => apiRequest('/ocr/recognize', {
      method: 'POST',
      headers: {}, // 让浏览器自动设置multipart/form-data
      body: formData,
    }),
  },

  // 话题相关
  topics: {
    getList: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/topics${query ? `?${query}` : ''}`);
    },
    getById: (id) => apiRequest(`/topics/${id}`),
    create: (topicData) => apiRequest('/topics', {
      method: 'POST',
      body: JSON.stringify(topicData),
    }),
    update: (id, topicData) => apiRequest(`/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(topicData),
    }),
    delete: (id) => apiRequest(`/topics/${id}`, { method: 'DELETE' }),
    like: (id) => apiRequest(`/topics/${id}/like`, { method: 'POST' }),
    bookmark: (id) => apiRequest(`/topics/${id}/bookmark`, { method: 'POST' }),
    comment: (id, commentData) => apiRequest(`/topics/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    }),
    // "想听"报名
    applyDemand: (id, applyData) => apiRequest(`/topics/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(applyData),
    }),
  },

  // 评论相关
  comments: {
    getList: (topicId) => apiRequest(`/topics/${topicId}/comments`),
    create: (topicId, commentData) => apiRequest(`/topics/${topicId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    }),
    update: (commentId, commentData) => apiRequest(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(commentData),
    }),
    delete: (commentId) => apiRequest(`/comments/${commentId}`, { method: 'DELETE' }),
    like: (commentId) => apiRequest(`/comments/${commentId}/like`, { method: 'POST' }),
  },

  // 社区/用户相关
  community: {
    getUserList: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/users${query ? `?${query}` : ''}`);
    },
    getUserById: (id) => apiRequest(`/users/${id}`),
    follow: (userId) => apiRequest(`/users/${userId}/follow`, { method: 'POST' }),
    unfollow: (userId) => apiRequest(`/users/${userId}/unfollow`, { method: 'POST' }),
    getFollowers: (userId) => apiRequest(`/users/${userId}/followers`),
    getFollowing: (userId) => apiRequest(`/users/${userId}/following`),
  },

  // 通知相关
  notifications: {
    getList: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/notifications${query ? `?${query}` : ''}`);
    },
    markAsRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
    markAllAsRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),
    delete: (id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }),
    getUnreadCount: () => apiRequest('/notifications/unread-count'),
  },

  // 成就/积分相关
  achievements: {
    getBadges: () => apiRequest('/achievements/badges'),
    getStats: () => apiRequest('/achievements/stats'),
    getLeaderboard: (type = 'contribution', period = 'month') => 
      apiRequest(`/achievements/leaderboard?type=${type}&period=${period}`),
    checkIn: () => apiRequest('/achievements/checkin', { method: 'POST' }),
  },

  // 搜索相关
  search: {
    global: (keyword, params = {}) => {
      const query = new URLSearchParams({ keyword, ...params }).toString();
      return apiRequest(`/search?${query}`);
    },
    topics: (keyword, params = {}) => {
      const query = new URLSearchParams({ keyword, ...params }).toString();
      return apiRequest(`/search/topics?${query}`);
    },
    users: (keyword, params = {}) => {
      const query = new URLSearchParams({ keyword, ...params }).toString();
      return apiRequest(`/search/users?${query}`);
    },
    activities: (keyword, params = {}) => {
      const query = new URLSearchParams({ keyword, ...params }).toString();
      return apiRequest(`/search/activities?${query}`);
    },
  },

  // 匹配相关
  match: {
    getRecommendations: () => apiRequest('/match/recommendations'),
    getInterests: () => apiRequest('/match/interests'),
  },

  // 文件上传相关
  upload: {
    image: (formData) => apiRequest('/upload/image', {
      method: 'POST',
      headers: {}, // 让浏览器自动设置multipart/form-data
      body: formData,
    }),
    document: (formData) => apiRequest('/upload/document', {
      method: 'POST',
      headers: {},
      body: formData,
    }),
  },
};

export default api;