/**
 * 高级搜索模态框
 * 提供多维度搜索筛选功能
 */
import React, { useState } from 'react';
import Icon from '../common/Icon.jsx';
import { Button } from '../common/Button.jsx';
import './AdvancedSearchModal.css';

/**
 * 高级搜索模态框组件
 */
export const AdvancedSearchModal = ({ isOpen, onClose, onSearch, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    keyword: initialFilters.keyword || '',
    contentTypes: initialFilters.contentTypes || ['topics', 'users', 'events'],
    topicTypes: initialFilters.topicTypes || [],
    categories: initialFilters.categories || [],
    timeRange: initialFilters.timeRange || 'all',
    customTimeStart: initialFilters.customTimeStart || '',
    customTimeEnd: initialFilters.customTimeEnd || '',
    sortBy: initialFilters.sortBy || 'relevance',
    // 用户筛选
    userLevel: initialFilters.userLevel || 'all',
    userDepartment: initialFilters.userDepartment || 'all',
    userSkills: initialFilters.userSkills || [],
    ...initialFilters
  });

  // 内容类型选项
  const contentTypeOptions = [
    { value: 'topics', label: '话题', icon: 'message-circle' },
    { value: 'users', label: '用户', icon: 'user' },
    { value: 'events', label: '活动', icon: 'calendar' },
    { value: 'projects', label: '项目', icon: 'briefcase' }
  ];

  // 话题类型选项
  const topicTypeOptions = [
    { value: 'topic_offer', label: '我来讲', icon: 'mic', color: 'blue' },
    { value: 'topic_demand', label: '想听', icon: 'ear', color: 'green' },
    { value: 'project_promotion', label: '项目宣传', icon: 'rocket', color: 'purple' }
  ];

  // 分类选项
  const categoryOptions = [
    { value: 'technology', label: '技术分享' },
    { value: 'academic', label: '学术研究' },
    { value: 'career', label: '职业发展' },
    { value: 'life', label: '生活技能' },
    { value: 'competition', label: '竞赛经验' },
    { value: 'project', label: '项目实践' },
    { value: 'other', label: '其他' }
  ];

  // 时间范围选项
  const timeRangeOptions = [
    { value: 'all', label: '不限' },
    { value: 'today', label: '今天' },
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
    { value: 'year', label: '今年' },
    { value: 'custom', label: '自定义' }
  ];

  // 排序方式选项
  const sortByOptions = [
    { value: 'relevance', label: '最相关', icon: 'star' },
    { value: 'newest', label: '最新', icon: 'clock' },
    { value: 'hottest', label: '最热', icon: 'flame' },
    { value: 'trending', label: '趋势', icon: 'trending-up' }
  ];

  // 用户等级选项
  const userLevelOptions = [
    { value: 'all', label: '全部' },
    { value: '1-5', label: 'LV 1-5' },
    { value: '6-10', label: 'LV 6-10' },
    { value: '11-15', label: 'LV 11-15' },
    { value: '16+', label: 'LV 16+' }
  ];

  // 院系选项
  const departmentOptions = [
    { value: 'all', label: '全部' },
    { value: 'cs', label: '计算机系' },
    { value: 'ee', label: '电子工程系' },
    { value: 'auto', label: '自动化系' },
    { value: 'math', label: '数学系' },
    { value: 'physics', label: '物理系' },
    { value: 'other', label: '其他' }
  ];

  // 热门技能标签
  const popularSkills = [
    'Python', 'Java', 'JavaScript', 'C++', 'React',
    'Vue', 'Node.js', 'Machine Learning', 'Deep Learning',
    'Data Science', 'Web开发', '移动开发', '算法', '前端', '后端'
  ];

  if (!isOpen) return null;

  // 更新筛选条件
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 切换多选项
  const toggleArrayItem = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  // 处理搜索
  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({
      keyword: filters.keyword, // 保留关键词
      contentTypes: ['topics', 'users', 'events'],
      topicTypes: [],
      categories: [],
      timeRange: 'all',
      customTimeStart: '',
      customTimeEnd: '',
      sortBy: 'relevance',
      userLevel: 'all',
      userDepartment: 'all',
      userSkills: []
    });
  };

  return (
    <div className="advanced-search-modal-overlay" onClick={onClose}>
      <div className="advanced-search-modal" onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Icon icon="filter" size="lg" className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">高级搜索</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <Icon icon="x" size="lg" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="modal-content">
          {/* 关键词 */}
          <div className="filter-section">
            <label className="filter-label">
              <Icon icon="search" size="sm" />
              <span>关键词</span>
            </label>
            <input
              type="text"
              value={filters.keyword}
              onChange={e => updateFilter('keyword', e.target.value)}
              placeholder="输入搜索关键词..."
              className="filter-input"
            />
          </div>

          {/* 内容类型 */}
          <div className="filter-section">
            <label className="filter-label">
              <Icon icon="layers" size="sm" />
              <span>内容类型</span>
            </label>
            <div className="filter-chips">
              {contentTypeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => toggleArrayItem('contentTypes', option.value)}
                  className={`filter-chip ${
                    filters.contentTypes.includes(option.value) ? 'active' : ''
                  }`}
                >
                  <Icon icon={option.icon} size="sm" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 话题类型（仅当选择了话题时显示） */}
          {filters.contentTypes.includes('topics') && (
            <div className="filter-section">
              <label className="filter-label">
                <Icon icon="tag" size="sm" />
                <span>话题类型</span>
              </label>
              <div className="filter-chips">
                {topicTypeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleArrayItem('topicTypes', option.value)}
                    className={`filter-chip ${
                      filters.topicTypes.includes(option.value) ? 'active' : ''
                    }`}
                  >
                    <Icon icon={option.icon} size="sm" />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
              <p className="filter-hint">不选择则搜索全部话题类型</p>
            </div>
          )}

          {/* 分类（仅当选择了话题时显示） */}
          {filters.contentTypes.includes('topics') && (
            <div className="filter-section">
              <label className="filter-label">
                <Icon icon="folder" size="sm" />
                <span>分类</span>
              </label>
              <div className="filter-chips">
                {categoryOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleArrayItem('categories', option.value)}
                    className={`filter-chip ${
                      filters.categories.includes(option.value) ? 'active' : ''
                    }`}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 发布时间 */}
          <div className="filter-section">
            <label className="filter-label">
              <Icon icon="calendar" size="sm" />
              <span>发布时间</span>
            </label>
            <div className="filter-radio-group">
              {timeRangeOptions.map(option => (
                <label key={option.value} className="filter-radio">
                  <input
                    type="radio"
                    name="timeRange"
                    value={option.value}
                    checked={filters.timeRange === option.value}
                    onChange={e => updateFilter('timeRange', e.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {filters.timeRange === 'custom' && (
              <div className="custom-date-range">
                <input
                  type="date"
                  value={filters.customTimeStart}
                  onChange={e => updateFilter('customTimeStart', e.target.value)}
                  className="date-input"
                />
                <span className="text-gray-500">至</span>
                <input
                  type="date"
                  value={filters.customTimeEnd}
                  onChange={e => updateFilter('customTimeEnd', e.target.value)}
                  className="date-input"
                />
              </div>
            )}
          </div>

          {/* 排序方式 */}
          <div className="filter-section">
            <label className="filter-label">
              <Icon icon="arrow-up-down" size="sm" />
              <span>排序方式</span>
            </label>
            <div className="filter-chips">
              {sortByOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('sortBy', option.value)}
                  className={`filter-chip ${
                    filters.sortBy === option.value ? 'active' : ''
                  }`}
                >
                  <Icon icon={option.icon} size="sm" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 用户筛选（仅当选择了用户时显示） */}
          {filters.contentTypes.includes('users') && (
            <>
              <div className="filter-divider">
                <span className="text-sm font-semibold text-gray-700">用户筛选</span>
              </div>

              {/* 用户等级 */}
              <div className="filter-section">
                <label className="filter-label">
                  <Icon icon="award" size="sm" />
                  <span>等级</span>
                </label>
                <select
                  value={filters.userLevel}
                  onChange={e => updateFilter('userLevel', e.target.value)}
                  className="filter-select"
                >
                  {userLevelOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 院系 */}
              <div className="filter-section">
                <label className="filter-label">
                  <Icon icon="building" size="sm" />
                  <span>院系</span>
                </label>
                <select
                  value={filters.userDepartment}
                  onChange={e => updateFilter('userDepartment', e.target.value)}
                  className="filter-select"
                >
                  {departmentOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 技能标签 */}
              <div className="filter-section">
                <label className="filter-label">
                  <Icon icon="code" size="sm" />
                  <span>技能标签</span>
                </label>
                <div className="filter-chips">
                  {popularSkills.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleArrayItem('userSkills', skill)}
                      className={`filter-chip ${
                        filters.userSkills.includes(skill) ? 'active' : ''
                      }`}
                    >
                      <span>{skill}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="modal-footer">
          <Button variant="outline" onClick={handleReset}>
            <Icon icon="rotate-ccw" size="sm" />
            <span>重置</span>
          </Button>
          <Button variant="primary" onClick={handleSearch}>
            <Icon icon="search" size="sm" />
            <span>搜索</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchModal;

