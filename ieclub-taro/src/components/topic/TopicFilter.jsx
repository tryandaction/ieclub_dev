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
    <div className="flex items-center justify-between flex-wrap gap-4">
      {/* 左侧：类型/分类筛选 */}
      <div className="flex gap-2 flex-wrap flex-1">
        {typeOptions.map((option) => (
          <button
            key={option.value || 'all'}
            onClick={() => handleTypeChange(option.value)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              type === option.value
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
        
        {/* 分类筛选按钮 */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 rounded-lg font-semibold transition-all border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          {category !== TopicCategory.ALL ? categoryOptions.find(c => c.value === category)?.label : '分类'} ▼
        </button>
      </div>

      {/* 右侧：排序选择 */}
      <select
        value={sortBy}
        onChange={(e) => handleSortChange(e.target.value)}
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 font-medium"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* 展开的分类筛选 */}
      {showFilters && (
        <div className="w-full border-t pt-4 mt-2 animate-slideDown">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-gray-700">内容分类：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  handleCategoryChange(option.value);
                  setShowFilters(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  category === option.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicFilter;

