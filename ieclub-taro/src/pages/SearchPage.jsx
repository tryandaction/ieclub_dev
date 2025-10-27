/**
 * 搜索结果页
 * 显示话题、用户、活动的搜索结果
 * 支持高级搜索、结果高亮、导出功能
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/common/Icon.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import TopicCard from '../components/topic/TopicCard.jsx';
import { Avatar } from '../components/common/Avatar.jsx';
import Loading from '../components/common/Loading.jsx';
import { Button } from '../components/common/Button.jsx';
import AdvancedSearchModal from '../components/search/AdvancedSearchModal.jsx';
import { TopicType } from '../store/topicStore';
import api from '../services/api.js';

/**
 * 搜索结果页组件
 */
const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'topics' | 'users' | 'events'
  const [loading, setLoading] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [results, setResults] = useState({
    topics: [],
    users: [],
    events: [],
    total: 0
  });

  // 搜索结果
  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  // 执行搜索
  const performSearch = async (searchQuery, filters = {}) => {
    try {
      setLoading(true);
      const response = await api.get('/search', {
        params: { 
          q: searchQuery,
          ...filters
        }
      });
      setResults(response.data || getMockSearchResults(searchQuery));
    } catch (err) {
      console.error('搜索失败:', err);
      setResults(getMockSearchResults(searchQuery));
    } finally {
      setLoading(false);
    }
  };

  // 处理新搜索
  const handleNewSearch = (newQuery) => {
    navigate(`/search?q=${encodeURIComponent(newQuery)}`);
  };

  // 处理高级搜索
  const handleAdvancedSearch = (filters) => {
    setAdvancedFilters(filters);
    performSearch(filters.keyword || query, filters);
  };

  // 高亮关键词
  const highlightText = (text, keyword) => {
    if (!keyword || !text) return text;
    
    const regex = new RegExp(`(${keyword})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-gray-900 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // 导出搜索结果
  const exportResults = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `搜索结果_${query}_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 生成CSV内容
  const generateCSV = () => {
    let csv = '\uFEFF'; // UTF-8 BOM
    
    // 导出话题
    if (results.topics.length > 0) {
      csv += '话题结果\n';
      csv += '标题,类型,作者,分类,点赞数,评论数,浏览数,发布时间\n';
      results.topics.forEach(topic => {
        csv += `"${topic.title}","${topic.type}","${topic.author.name}","${topic.category}",${topic.likes},${topic.comments},${topic.views},"${new Date(topic.createdAt).toLocaleDateString()}"\n`;
      });
      csv += '\n';
    }
    
    // 导出用户
    if (results.users.length > 0) {
      csv += '用户结果\n';
      csv += '姓名,等级,院系,年级,简介,技能\n';
      results.users.forEach(user => {
        const skills = user.skills ? user.skills.join(';') : '';
        csv += `"${user.name}",${user.level},"${user.department}","${user.grade}","${user.bio || ''}","${skills}"\n`;
      });
      csv += '\n';
    }
    
    // 导出活动
    if (results.events.length > 0) {
      csv += '活动结果\n';
      csv += '标题,时间,地点,主办方,标签\n';
      results.events.forEach(event => {
        const tags = event.tags ? event.tags.join(';') : '';
        csv += `"${event.title}","${event.time || ''}","${event.location || ''}","${event.organizer || ''}","${tags}"\n`;
      });
    }
    
    return csv;
  };

  // 获取当前Tab的结果数量
  const getTabCount = (tab) => {
    switch (tab) {
      case 'all':
        return results.total;
      case 'topics':
        return results.topics.length;
      case 'users':
        return results.users.length;
      case 'events':
        return results.events.length;
      default:
        return 0;
    }
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon icon="search" size="3xl" color="#D1D5DB" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">
        {query ? `没有找到"${query}"的相关结果` : '输入关键词开始搜索'}
      </h3>
      <p className="text-sm text-gray-500 text-center mb-4">
        {query
          ? '试试其他关键词或调整搜索条件'
          : '搜索话题、用户、活动等内容'}
      </p>
    </div>
  );

  // 渲染加载状态
  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <Loading size="lg" text="搜索中..." />
    </div>
  );

  // 渲染话题结果
  const renderTopicResults = () => {
    if (results.topics.length === 0) {
      return (
        <div className="text-center py-12">
          <Icon icon="document-text" size="3xl" color="#D1D5DB" />
          <p className="text-gray-500 mt-4">没有找到相关话题</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {results.topics.map((topic) => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>
    );
  };

  // 渲染用户结果
  const renderUserResults = () => {
    if (results.users.length === 0) {
      return (
        <div className="text-center py-12">
          <Icon icon="user" size="3xl" color="#D1D5DB" />
          <p className="text-gray-500 mt-4">没有找到相关用户</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {results.users.map((user) => (
          <div
            key={user.id}
            onClick={() => navigate(`/profile/${user.id}`)}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {/* 用户头像 */}
              <Avatar
                src={user.avatar}
                name={user.name}
                size="lg"
                className="flex-shrink-0"
              />

              {/* 用户信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{user.name}</h3>
                  {user.level && (
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-600 text-xs font-bold">
                      LV{user.level}
                    </span>
                  )}
                  {user.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-gradient-primary text-white text-xs font-bold">
                      {user.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  {user.department && <span>{user.department}</span>}
                  {user.grade && (
                    <>
                      <span>•</span>
                      <span>{user.grade}</span>
                    </>
                  )}
                </div>

                {user.bio && (
                  <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                    {highlightText(user.bio, query)}
                  </p>
                )}

                {/* 技能标签 */}
                {user.skills && user.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {user.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {user.skills.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                        +{user.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 关注按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('关注用户:', user.id);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  user.isFollowing
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gradient-primary text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {user.isFollowing ? '已关注' : '关注'}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染活动结果
  const renderEventResults = () => {
    if (results.events.length === 0) {
      return (
        <div className="text-center py-12">
          <Icon icon="calendar" size="3xl" color="#D1D5DB" />
          <p className="text-gray-500 mt-4">没有找到相关活动</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {results.events.map((event) => (
          <div
            key={event.id}
            onClick={() => navigate(`/events/${event.id}`)}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex gap-4">
              {/* 日期标签 */}
              {event.date && (
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col items-center justify-center">
                  <div className="text-xs text-gray-600 font-medium">
                    {new Date(event.date).toLocaleDateString('zh-CN', { month: 'short' })}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {new Date(event.date).getDate()}
                  </div>
                </div>
              )}

              {/* 活动信息 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                  {event.title}
                </h3>

                <div className="space-y-1 mb-2">
                  {event.time && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Icon icon="clock" size="xs" />
                      <span>{event.time}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Icon icon="location" size="xs" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.organizer && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Icon icon="user" size="xs" />
                      <span>{event.organizer}</span>
                    </div>
                  )}
                </div>

                {/* 标签 */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 报名按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('报名活动:', event.id);
                }}
                className={`self-start px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  event.hasRegistered
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {event.hasRegistered ? '已报名' : '报名'}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染综合结果
  const renderAllResults = () => {
    const hasResults = results.topics.length > 0 || results.users.length > 0 || results.events.length > 0;

    if (!hasResults) {
      return renderEmptyState();
    }

    return (
      <div className="space-y-6">
        {/* 话题结果 */}
        {results.topics.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Icon icon="document-text" size="md" color="#8B5CF6" />
                话题 ({results.topics.length})
              </h2>
              <button
                onClick={() => setActiveTab('topics')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                查看全部 →
              </button>
            </div>
            <div className="space-y-4">
              {results.topics.slice(0, 3).map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </div>
        )}

        {/* 用户结果 */}
        {results.users.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Icon icon="user" size="md" color="#10B981" />
                用户 ({results.users.length})
              </h2>
              <button
                onClick={() => setActiveTab('users')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                查看全部 →
              </button>
            </div>
            <div className="space-y-3">
              {results.users.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatar} name={user.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-600">
                        {user.department} • {user.grade}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        user.isFollowing
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-gradient-primary text-white'
                      }`}
                    >
                      {user.isFollowing ? '已关注' : '关注'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 活动结果 */}
        {results.events.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Icon icon="calendar" size="md" color="#3B82F6" />
                活动 ({results.events.length})
              </h2>
              <button
                onClick={() => setActiveTab('events')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                查看全部 →
              </button>
            </div>
            {renderEventResults().props.children.slice(0, 3)}
          </div>
        )}
      </div>
    );
  };

  // 渲染内容
  const renderContent = () => {
    if (loading) {
      return renderLoadingState();
    }

    if (!query) {
      return renderEmptyState();
    }

    switch (activeTab) {
      case 'all':
        return renderAllResults();
      case 'topics':
        return renderTopicResults();
      case 'users':
        return renderUserResults();
      case 'events':
        return renderEventResults();
      default:
        return renderEmptyState();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20">
      {/* 高级搜索模态框 */}
      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearch={handleAdvancedSearch}
        initialFilters={{ keyword: query, ...advancedFilters }}
      />

      {/* 顶部搜索栏 */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Icon icon="chevron-left" size="lg" color="#6B7280" />
            </button>
            <div className="flex-1">
              <SearchBar
                placeholder="搜索话题、用户、活动..."
                onSearch={handleNewSearch}
                autoFocus={!query}
              />
            </div>
            {/* 高级搜索按钮 */}
            <button
              onClick={() => setShowAdvancedSearch(true)}
              className="p-2 hover:bg-purple-50 rounded-lg transition-colors group"
              title="高级搜索"
            >
              <Icon icon="filter" size="lg" className="text-gray-600 group-hover:text-purple-600" />
            </button>
          </div>
        </div>

        {/* Tab标签 */}
        {query && (
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto hide-scrollbar">
              {[
                { key: 'all', label: '全部', icon: 'square' },
                { key: 'topics', label: '话题', icon: 'document-text' },
                { key: 'users', label: '用户', icon: 'user' },
                { key: 'events', label: '活动', icon: 'calendar' },
              ].map((tab) => {
                const count = getTabCount(tab.key);
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-all relative ${
                      activeTab === tab.key
                        ? 'text-purple-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon
                      icon={tab.icon}
                      size="sm"
                      color={activeTab === tab.key ? '#8B5CF6' : 'currentColor'}
                    />
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                        activeTab === tab.key
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    )}
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 工具栏 */}
        {query && results.total > 0 && (
          <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-xl shadow-sm">
            <div className="text-sm text-gray-600">
              找到 <span className="font-bold text-purple-600">{results.total}</span> 个结果
              {Object.keys(advancedFilters).length > 0 && (
                <span className="ml-2 text-xs text-gray-500">(高级搜索)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 清除筛选 */}
              {Object.keys(advancedFilters).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAdvancedFilters({});
                    performSearch(query);
                  }}
                >
                  <Icon icon="x" size="sm" />
                  <span className="hidden sm:inline">清除筛选</span>
                </Button>
              )}
              {/* 导出结果 */}
              <Button
                variant="outline"
                size="sm"
                onClick={exportResults}
              >
                <Icon icon="download" size="sm" />
                <span className="hidden sm:inline">导出</span>
              </Button>
            </div>
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
};

// 模拟搜索结果
function getMockSearchResults(query) {
  const mockTopics = [
    {
      id: 1,
      type: TopicType.OFFER,
      title: 'React入门教程：从零到一构建现代Web应用',
      description: '作为一名前端开发者，我想分享我在React学习路上的经验...',
      author: {
        id: 1,
        name: '张明',
        avatar: null,
      },
      category: '学习',
      tags: ['React', '前端', 'JavaScript'],
      likes: 234,
      comments: 45,
      views: 1234,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 2,
      type: TopicType.PROJECT,
      title: 'AI驱动的智能学习助手项目招募',
      description: '我们正在开发一个基于AI的学习助手，帮助学生更高效地学习...',
      author: {
        id: 2,
        name: '李思',
        avatar: null,
      },
      category: '创业',
      tags: ['AI', '教育', '创业'],
      likes: 189,
      comments: 67,
      views: 892,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      projectType: 'startup',
      recruiting: true,
    },
  ];

  const mockUsers = [
    {
      id: 1,
      name: '张明',
      avatar: null,
      level: 8,
      department: '计算机科学与技术',
      grade: '大三',
      bio: '代码改变世界，学习永无止境',
      skills: ['Python', 'React', '算法'],
      isFollowing: false,
    },
    {
      id: 2,
      name: '李思',
      avatar: null,
      level: 12,
      badge: 'VIP',
      department: '生物医学工程',
      grade: '研究生',
      bio: '生物科技爱好者，专注合成生物学',
      skills: ['实验设计', '数据分析', 'Python'],
      isFollowing: true,
    },
  ];

  const mockEvents = [
    {
      id: 1,
      title: '前端技术分享会',
      date: new Date(Date.now() + 604800000).toISOString(),
      time: '14:00 - 16:00',
      location: '教学楼A101',
      organizer: 'IEClub技术组',
      tags: ['前端', '技术分享'],
      hasRegistered: false,
    },
    {
      id: 2,
      title: '创业项目路演',
      date: new Date(Date.now() + 1209600000).toISOString(),
      time: '19:00 - 21:00',
      location: '创新中心',
      organizer: 'IEClub创业组',
      tags: ['创业', '路演'],
      hasRegistered: true,
    },
  ];

  return {
    topics: mockTopics,
    users: mockUsers,
    events: mockEvents,
    total: mockTopics.length + mockUsers.length + mockEvents.length,
  };
}

export default SearchPage;

