// ==================== API配置和请求封装 ====================
// config/api.js
const API_BASE_URL = 'https://api.ieclub.online';

// 请求拦截器 - 处理参数
const cleanParams = (params) => {
  const cleaned = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      cleaned[key] = params[key];
    }
  });
  return cleaned;
};

// 统一请求方法
const request = async (url, options = {}) => {
  try {
    const { params, ...fetchOptions } = options;
    
    // 清理并构建URL参数
    let finalUrl = `${API_BASE_URL}${url}`;
    if (params) {
      const cleanedParams = cleanParams(params);
      const queryString = new URLSearchParams(cleanedParams).toString();
      if (queryString) {
        finalUrl += `?${queryString}`;
      }
    }

    const response = await fetch(finalUrl, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      credentials: 'include', // 如果需要携带cookie
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('请求失败:', error);
    throw error;
  }
};

// API方法
const API = {
  // 获取话题列表
  getTopics: (params = {}) => {
    return request('/topics', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || 'latest',
        ...(params.category && { category: params.category }),
        ...(params.tag && { tag: params.tag }),
      }
    });
  },
  
  // 获取话题详情
  getTopicDetail: (id) => {
    return request(`/topics/${id}`);
  },
  
  // 发布话题
  createTopic: (data) => {
    return request('/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // 获取用户信息
  getUserInfo: () => {
    return request('/user/profile');
  },
};


// ==================== 完整的React组件 ====================
// App.jsx
import React, { useState, useEffect } from 'react';

const IEClubApp = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('latest');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // 加载话题列表
  const loadTopics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await API.getTopics({
        page: currentPage,
        limit: 20,
        sortBy: sortBy,
        category: selectedCategory || undefined,
        tag: selectedTag || undefined,
      });
      
      setTopics(data.topics || data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('加载话题失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, [currentPage, sortBy, selectedCategory, selectedTag]);

  // 渲染单个话题卡片
  const TopicCard = ({ topic }) => (
    <div className="topic-card">
      <div className="topic-header">
        <img 
          src={topic.author?.avatar || '/default-avatar.png'} 
          alt={topic.author?.name || '用户'}
          className="author-avatar"
        />
        <div className="topic-meta">
          <h3 className="topic-title">{topic.title}</h3>
          <span className="author-name">{topic.author?.name || '匿名用户'}</span>
          <span className="topic-time">{formatTime(topic.createdAt)}</span>
        </div>
      </div>
      
      <p className="topic-content">{topic.content}</p>
      
      {topic.tags && topic.tags.length > 0 && (
        <div className="topic-tags">
          {topic.tags.map((tag, idx) => (
            <span key={idx} className="tag">{tag}</span>
          ))}
        </div>
      )}
      
      <div className="topic-footer">
        <button className="action-btn">
          <span>👍</span> {topic.likes || 0}
        </button>
        <button className="action-btn">
          <span>💬</span> {topic.comments || 0}
        </button>
        <button className="action-btn">
          <span>🔖</span> 收藏
        </button>
      </div>
    </div>
  );

  return (
    <div className="ieclub-app">
      {/* 头部导航 */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="logo">🎓 IECLUB</h1>
          <nav className="nav-menu">
            <a href="#" className="nav-link active">广场</a>
            <a href="#" className="nav-link">消息</a>
            <a href="#" className="nav-link">我的</a>
          </nav>
          <button className="btn-primary">发布话题</button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="main-content">
        {/* 侧边栏 */}
        <aside className="sidebar">
          <div className="filter-section">
            <h3>分类</h3>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">全部分类</option>
              <option value="study">学习交流</option>
              <option value="life">校园生活</option>
              <option value="job">求职招聘</option>
            </select>
          </div>

          <div className="filter-section">
            <h3>排序</h3>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="latest">最新发布</option>
              <option value="hot">最热话题</option>
              <option value="comments">评论最多</option>
            </select>
          </div>
        </aside>

        {/* 话题列表 */}
        <div className="content-area">
          {error && (
            <div className="error-banner">
              <p>⚠️ 加载失败: {error}</p>
              <button onClick={loadTopics} className="btn-retry">重试</button>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>加载中...</p>
            </div>
          ) : topics.length > 0 ? (
            <div className="topics-list">
              {topics.map(topic => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>暂无话题</p>
            </div>
          )}

          {/* 分页 */}
          {!loading && topics.length > 0 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-page"
              >
                上一页
              </button>
              <span className="page-info">第 {currentPage} 页</span>
              <button 
                onClick={() => setCurrentPage(p => p + 1)}
                className="btn-page"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// 工具函数：格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN');
};

export default IEClubApp;


// ==================== 完整的CSS样式 ====================
/*
 * 将以下CSS保存为独立文件或添加到<style>标签中
 */

/* 全局重置和基础样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  background: #f5f7fa;
}

/* 主容器 */
.ieclub-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 头部 */
.app-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: #1a73e8;
  white-space: nowrap;
}

.nav-menu {
  display: flex;
  gap: 32px;
  flex: 1;
}

.nav-link {
  text-decoration: none;
  color: #5f6368;
  font-size: 16px;
  font-weight: 500;
  padding: 8px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.nav-link:hover,
.nav-link.active {
  color: #1a73e8;
  border-bottom-color: #1a73e8;
}

.btn-primary {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-primary:hover {
  background: #1557b0;
}

/* 主内容区 */
.main-content {
  max-width: 1400px;
  width: 100%;
  margin: 24px auto;
  padding: 0 24px;
  display: flex;
  gap: 24px;
  flex: 1;
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  flex-shrink: 0;
}

.filter-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.filter-section h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #202124;
}

.filter-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #1a73e8;
}

/* 内容区域 */
.content-area {
  flex: 1;
  min-width: 0;
}

/* 错误提示 */
.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.error-banner p {
  color: #dc2626;
  flex: 1;
}

.btn-retry {
  background: #dc2626;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e8eaed;
  border-top-color: #1a73e8;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 话题列表 */
.topics-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 话题卡片 */
.topic-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s;
  cursor: pointer;
}

.topic-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.topic-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.topic-meta {
  flex: 1;
  min-width: 0;
}

.topic-title {
  font-size: 18px;
  font-weight: 600;
  color: #202124;
  margin-bottom: 4px;
  line-height: 1.4;
}

.author-name {
  font-size: 14px;
  color: #5f6368;
  margin-right: 12px;
}

.topic-time {
  font-size: 14px;
  color: #9aa0a6;
}

.topic-content {
  font-size: 15px;
  color: #3c4043;
  line-height: 1.6;
  margin-bottom: 16px;
  word-wrap: break-word;
}

.topic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tag {
  background: #e8f0fe;
  color: #1a73e8;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
}

.topic-footer {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid #e8eaed;
}

.action-btn {
  background: none;
  border: none;
  color: #5f6368;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #f1f3f4;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  padding: 20px;
}

.btn-page {
  background: white;
  border: 1px solid #dadce0;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  background: #f1f3f4;
  border-color: #1a73e8;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #5f6368;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #5f6368;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    display: flex;
    gap: 16px;
  }
  
  .filter-section {
    flex: 1;
  }
}

@media (max-width: 768px) {
  html, body {
    font-size: 14px;
  }
  
  .header-content {
    padding: 12px 16px;
  }
  
  .logo {
    font-size: 20px;
  }
  
  .nav-menu {
    gap: 16px;
  }
  
  .nav-link {
    font-size: 14px;
  }
  
  .btn-primary {
    padding: 8px 16px;
    font-size: 14px;
  }
  
  .main-content {
    padding: 0 16px;
    margin: 16px auto;
  }
  
  .sidebar {
    flex-direction: column;
  }
  
  .topic-card {
    padding: 16px;
  }
  
  .topic-title {
    font-size: 16px;
  }
  
  .topic-content {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .nav-menu {
    display: none;
  }
  
  .header-content {
    gap: 12px;
  }
  
  .topic-header {
    flex-direction: column;
  }
  
  .topic-footer {
    gap: 12px;
  }
}