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
    <div className="bg-white rounded-xl border shadow-sm p-4">
      {/* 类型筛选 - 横向滚动 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon icon="filter" size="sm" color="#667eea" />
          <span className="text-sm font-medium text-gray-700">话题类型</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {typeOptions.map((option) => (
            <button
              key={option.value || 'all'}
              onClick={() => handleTypeChange(option.value)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap
                transition-all flex-shrink-0
                ${type === option.value
                  ? 'bg-gradient-primary text-white shadow-primary'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
        className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 font-medium mb-3"
      >
        <Icon icon={showFilters ? 'chevronUp' : 'chevronDown'} size="sm" />
        <span>{showFilters ? '收起筛选' : '更多筛选'}</span>
      </button>

      {/* 更多筛选选项 */}
      {showFilters && (
        <div className="space-y-4 border-t pt-4">
          {/* 分类筛选 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="category" size="sm" color="#667eea" />
              <span className="text-sm font-medium text-gray-700">内容分类</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleCategoryChange(option.value)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-all
                    ${category === option.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                  `}
                >
                  <Icon icon={option.icon} size="xs" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 排序方式 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="sort" size="sm" color="#667eea" />
              <span className="text-sm font-medium text-gray-700">排序方式</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-all
                    ${sortBy === option.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                  `}
                >
                  <Icon icon={option.icon} size="xs" />
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

