/**
 * 话题筛选器组件
 * 支持类型、分类、排序方式的筛选
 */
import React, { useState } from 'react';
import Icon from '../common/Icon.jsx';
import { TopicType, TopicCategory, TopicSortBy } from '../../store/topicStore';

/**
 * 话题类型选项
 */
const typeOptions = [
  { value: null, label: '全部', icon: 'square' },
  { value: TopicType.OFFER, label: '我来讲', icon: 'topicOffer', color: '#5B7FFF' },
  { value: TopicType.DEMAND, label: '想听', icon: 'topicDemand', color: '#FF6B9D' },
  { value: TopicType.PROJECT, label: '项目', icon: 'project', color: '#FFA500' },
];

/**
 * 话题分类选项
 */
const categoryOptions = [
  { value: TopicCategory.ALL, label: '全部', icon: 'square' },
  { value: TopicCategory.STUDY, label: '学习', icon: 'study' },
  { value: TopicCategory.RESEARCH, label: '科研', icon: 'research' },
  { value: TopicCategory.SKILL, label: '技能', icon: 'skill' },
  { value: TopicCategory.STARTUP, label: '创业', icon: 'startup' },
  { value: TopicCategory.LIFE, label: '生活', icon: 'life' },
];

/**
 * 排序方式选项
 */
const sortOptions = [
  { value: TopicSortBy.RECOMMENDED, label: '推荐', icon: 'star' },
  { value: TopicSortBy.LATEST, label: '最新', icon: 'time' },
  { value: TopicSortBy.HOT, label: '最热', icon: 'fire' },
  { value: TopicSortBy.TRENDING, label: '趋势', icon: 'trending' },
];

/**
 * 话题筛选器组件
 * @param {object} filters - 当前筛选条件
 * @param {function} onChange - 筛选条件变化回调
 * @param {boolean} showAdvanced - 是否显示高级筛选
 */
const TopicFilter = ({
  filters = {},
  onChange,
  showAdvanced = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const { type, category, sortBy } = filters;

  // 处理类型筛选
  const handleTypeChange = (value) => {
    onChange?.({ ...filters, type: value });
  };

  // 处理分类筛选
  const handleCategoryChange = (value) => {
    onChange?.({ ...filters, category: value });
  };

  // 处理排序方式
  const handleSortChange = (value) => {
    onChange?.({ ...filters, sortBy: value });
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5">
      {/* 类型筛选 - 横向滚动 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon icon="filter" size="md" color="#667eea" />
          <span className="text-sm font-bold text-gray-900">话题类型</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {typeOptions.map((option) => (
            <button
              key={option.value || 'all'}
              onClick={() => handleTypeChange(option.value)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap text-sm
                transition-all flex-shrink-0
                ${type === option.value
                  ? 'bg-gradient-primary text-white shadow-lg scale-105'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800 hover:scale-105'
                }
              `}
            >
              <Icon
                icon={option.icon}
                size="sm"
                color={type === option.value ? '#ffffff' : (option.color || 'currentColor')}
              />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 展开/收起更多筛选 */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-bold mb-3 hover:underline"
      >
        <Icon icon={showFilters ? 'chevronUp' : 'chevronDown'} size="sm" color="#8B5CF6" />
        <span>{showFilters ? '收起筛选' : '更多筛选'}</span>
      </button>

      {/* 更多筛选选项 */}
      {showFilters && (
        <div className="space-y-5 border-t-2 border-gray-100 pt-4">
          {/* 分类筛选 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="category" size="md" color="#667eea" />
              <span className="text-sm font-bold text-gray-900">内容分类</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleCategoryChange(option.value)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold
                    transition-all hover:scale-105
                    ${category === option.value
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }
                  `}
                >
                  <Icon icon={option.icon} size="xs" color={category === option.value ? '#ffffff' : 'currentColor'} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 排序方式 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="sort" size="md" color="#667eea" />
              <span className="text-sm font-bold text-gray-900">排序方式</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold
                    transition-all hover:scale-105
                    ${sortBy === option.value
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }
                  `}
                >
                  <Icon icon={option.icon} size="xs" color={sortBy === option.value ? '#ffffff' : 'currentColor'} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicFilter;

