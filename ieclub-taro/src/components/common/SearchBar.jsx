/**
 * 全局搜索栏组件
 * 支持快速搜索话题、用户、活动等
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { Avatar } from './Avatar.jsx';
import api from '../../services/api.js';

/**
 * 搜索栏组件
 */
const SearchBar = ({ 
  placeholder = '搜索话题、用户、活动...', 
  autoFocus = false,
  onSearch,
  className = ''
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  // 加载历史搜索记录
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (err) {
        console.error('加载历史搜索失败:', err);
      }
    }
  }, []);

  // 点击外部关闭建议框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 搜索建议（防抖）
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await api.get('/search/suggestions', {
          params: { q: query }
        });
        setSuggestions(response.data || getMockSuggestions(query));
      } catch (err) {
        console.error('获取搜索建议失败:', err);
        setSuggestions(getMockSuggestions(query));
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  // 处理搜索提交
  const handleSearch = (searchQuery = query) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    // 保存到历史记录
    saveToRecentSearches(trimmedQuery);

    // 关闭建议框
    setShowSuggestions(false);
    setQuery('');

    // 如果有自定义回调，执行回调
    if (onSearch) {
      onSearch(trimmedQuery);
      return;
    }

    // 否则导航到搜索结果页
    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  // 保存到历史搜索
  const saveToRecentSearches = (searchQuery) => {
    const newSearches = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 10); // 最多保存10条

    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
  };

  // 删除历史搜索记录
  const removeRecentSearch = (searchQuery) => {
    const newSearches = recentSearches.filter(s => s !== searchQuery);
    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
  };

  // 清空历史搜索
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // 处理建议项点击
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'topic') {
      navigate(`/topics/${suggestion.id}`);
    } else if (suggestion.type === 'user') {
      navigate(`/profile/${suggestion.id}`);
    } else if (suggestion.type === 'event') {
      navigate(`/events/${suggestion.id}`);
    }
    setShowSuggestions(false);
    setQuery('');
  };

  // 渲染搜索建议
  const renderSuggestions = () => {
    // 如果正在搜索
    if (isSearching) {
      return (
        <div className="p-4 text-center text-gray-500 text-sm">
          <Icon icon="loading" size="md" className="animate-spin mx-auto mb-2" />
          搜索中...
        </div>
      );
    }

    // 如果有查询但没有结果
    if (query.trim() && suggestions.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500 text-sm">
          <Icon icon="search" size="lg" color="#D1D5DB" className="mx-auto mb-2" />
          <p>没有找到相关结果</p>
          <button
            onClick={() => handleSearch()}
            className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            查看全部搜索结果
          </button>
        </div>
      );
    }

    // 如果有搜索建议
    if (suggestions.length > 0) {
      return (
        <div>
          <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">
            搜索建议
          </div>
          <div className="divide-y divide-gray-100">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.id}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                {/* 图标或头像 */}
                {suggestion.type === 'user' ? (
                  <Avatar
                    src={suggestion.avatar}
                    name={suggestion.title}
                    size="sm"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    suggestion.type === 'topic' ? 'bg-purple-100' :
                    suggestion.type === 'event' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    <Icon
                      icon={
                        suggestion.type === 'topic' ? 'document-text' :
                        suggestion.type === 'event' ? 'calendar' :
                        'search'
                      }
                      size="md"
                      color={
                        suggestion.type === 'topic' ? '#8B5CF6' :
                        suggestion.type === 'event' ? '#3B82F6' :
                        '#6B7280'
                      }
                    />
                  </div>
                )}

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {highlightQuery(suggestion.title, query)}
                  </div>
                  {suggestion.subtitle && (
                    <div className="text-xs text-gray-500 truncate">
                      {suggestion.subtitle}
                    </div>
                  )}
                </div>

                {/* 类型标签 */}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  suggestion.type === 'topic' ? 'bg-purple-100 text-purple-700' :
                  suggestion.type === 'user' ? 'bg-green-100 text-green-700' :
                  suggestion.type === 'event' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {
                    suggestion.type === 'topic' ? '话题' :
                    suggestion.type === 'user' ? '用户' :
                    suggestion.type === 'event' ? '活动' :
                    '其他'
                  }
                </span>
              </button>
            ))}
          </div>

          {/* 查看更多 */}
          <button
            onClick={() => handleSearch()}
            className="w-full px-4 py-3 text-center text-sm text-purple-600 hover:text-purple-700 font-medium border-t border-gray-100"
          >
            查看全部结果 →
          </button>
        </div>
      );
    }

    // 显示历史搜索
    if (recentSearches.length > 0) {
      return (
        <div>
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              历史搜索
            </span>
            <button
              onClick={clearRecentSearches}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              清空
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentSearches.map((search, index) => (
              <div
                key={index}
                className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <Icon icon="clock" size="sm" color="#9CA3AF" />
                <button
                  onClick={() => handleSearch(search)}
                  className="flex-1 text-left text-sm text-gray-700 hover:text-gray-900"
                >
                  {search}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentSearch(search);
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Icon icon="x-mark" size="xs" color="#9CA3AF" />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 热门搜索
    return (
      <div>
        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">
          热门搜索
        </div>
        <div className="divide-y divide-gray-100">
          {['前端开发', 'Python', '创业项目', '数学建模', 'UI设计'].map((hotSearch, index) => (
            <button
              key={index}
              onClick={() => handleSearch(hotSearch)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <Icon icon="fire" size="sm" color="#EF4444" />
              <span className="text-sm text-gray-700">{hotSearch}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* 搜索输入框 */}
      <div className={`relative flex items-center transition-all ${
        isFocused ? 'ring-2 ring-purple-500 rounded-full' : ''
      }`}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border-none rounded-full text-sm focus:bg-white focus:outline-none transition-all"
        />

        {/* 搜索图标 */}
        <Icon
          icon="search"
          size="md"
          color={isFocused ? '#8B5CF6' : '#9CA3AF'}
          className="absolute left-3 pointer-events-none"
        />

        {/* 清除按钮 */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
            className="absolute right-3 p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <Icon icon="x-mark" size="sm" color="#9CA3AF" />
          </button>
        )}
      </div>

      {/* 搜索建议下拉框 */}
      {showSuggestions && (isFocused || query) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-96 overflow-y-auto z-50">
          {renderSuggestions()}
        </div>
      )}
    </div>
  );
};

// 高亮查询词
function highlightQuery(text, query) {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="text-purple-600 font-bold">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
}

// 模拟搜索建议
function getMockSuggestions(query) {
  const mockData = [
    {
      id: 1,
      type: 'topic',
      title: 'React入门教程：从零到一构建现代Web应用',
      subtitle: '我来讲 • 前端开发',
    },
    {
      id: 2,
      type: 'user',
      title: '张明',
      subtitle: '计算机科学与技术 • LV8',
      avatar: null,
    },
    {
      id: 3,
      type: 'topic',
      title: 'Python数据分析实战项目',
      subtitle: '项目 • 数据科学',
    },
    {
      id: 4,
      type: 'event',
      title: '创业分享会：从想法到产品',
      subtitle: '11月15日 • 教学楼A101',
    },
    {
      id: 5,
      type: 'user',
      title: '李思',
      subtitle: '生物医学工程 • LV12',
      avatar: null,
    },
  ];

  const lowerQuery = query.toLowerCase();
  return mockData.filter(item =>
    item.title.toLowerCase().includes(lowerQuery) ||
    item.subtitle?.toLowerCase().includes(lowerQuery)
  ).slice(0, 5);
}

export default SearchBar;

