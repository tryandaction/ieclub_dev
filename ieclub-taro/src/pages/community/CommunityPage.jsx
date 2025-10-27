/**
 * 社区页面
 * 包含：用户列表、智能匹配、排行榜
 */
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import { Award, Users, Zap, TrendingUp, Medal, Trophy, Grid, List, Search, Filter, UserX, Loader } from 'lucide-react';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('users'); // 'users' | 'match' | 'leaderboard'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'undergrad' | 'graduate' | 'active' | 'lv10+'
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 高级筛选状态
  const [advancedFilters, setAdvancedFilters] = useState({
    departments: [], // 选中的院系
    grades: [], // 选中的年级
    levelRange: [0, 20], // 等级范围
    skillsFilter: '', // 技能筛选
  });
  
  const searchDebounceTimer = useRef(null);

  // 模拟用户数据
  const usersData = [
    {
      id: 1,
      name: '张明',
      avatar: '👨‍💻',
      level: 8,
      score: 680,
      department: '计算机科学与技术',
      grade: '大三',
      bio: '代码改变世界，学习永无止境',
      skills: ['Python', 'React', '算法', '机器学习'],
      stats: { topics: 23, comments: 156, followers: 89, following: 45 },
      isFollowing: false,
      lastActive: '2小时前',
    },
    {
      id: 2,
      name: '李思',
      avatar: '👩‍🔬',
      level: 12,
      score: 1420,
      department: '生物医学工程',
      grade: '研究生',
      bio: '生物科技爱好者，专注合成生物学',
      skills: ['实验设计', '数据分析', 'Python', '文献阅读'],
      stats: { topics: 45, comments: 234, followers: 156, following: 78 },
      isFollowing: true,
      lastActive: '刚刚',
    },
    {
      id: 3,
      name: '王浩',
      avatar: '🧑‍💼',
      level: 6,
      score: 520,
      department: '金融系',
      grade: '大二',
      bio: '创业路上探索者，寻找志同道合的伙伴',
      skills: ['产品设计', '市场分析', '团队管理'],
      stats: { topics: 12, comments: 78, followers: 45, following: 56 },
      isFollowing: false,
      lastActive: '1天前',
    },
    {
      id: 4,
      name: '陈晓',
      avatar: '👨‍🎨',
      level: 9,
      score: 780,
      department: '艺术设计',
      grade: '大四',
      bio: 'UI/UX设计师，热爱创造美好的用户体验',
      skills: ['Figma', 'UI设计', '用户研究', 'Sketch'],
      stats: { topics: 34, comments: 189, followers: 123, following: 67 },
      isFollowing: true,
      lastActive: '5小时前',
    },
    {
      id: 5,
      name: '赵敏',
      avatar: '👩‍💻',
      level: 10,
      score: 950,
      department: '电子与电气工程',
      grade: '研究生',
      bio: '嵌入式开发，硬件&软件都喜欢',
      skills: ['C/C++', '嵌入式', 'Arduino', 'PCB设计'],
      stats: { topics: 28, comments: 145, followers: 78, following: 45 },
      isFollowing: false,
      lastActive: '3小时前',
    },
    {
      id: 6,
      name: '刘洋',
      avatar: '👨‍🔬',
      level: 7,
      score: 620,
      department: '物理系',
      grade: '大三',
      bio: '量子物理研究，寻找实验合作伙伴',
      skills: ['量子力学', 'Python', '数据处理', 'LaTeX'],
      stats: { topics: 18, comments: 92, followers: 56, following: 34 },
      isFollowing: false,
      lastActive: '6小时前',
    },
  ];

  // 模拟社区群体数据（保留原有的，以防需要）
  const communityGroups = [
    {
      id: 1,
      name: '前端开发交流',
      avatar: '💻',
      members: 245,
      posts: 1203,
      description: '分享前端技术，讨论React/Vue/Angular',
      tags: ['前端', 'JavaScript', 'React'],
      isJoined: true,
    },
    {
      id: 2,
      name: '数学建模小组',
      avatar: '📊',
      members: 189,
      posts: 876,
      description: '数学建模竞赛、算法讨论',
      tags: ['数学', '建模', '竞赛'],
      isJoined: false,
    },
    {
      id: 3,
      name: '创业与投资',
      avatar: '🚀',
      members: 312,
      posts: 1542,
      description: '创业项目孵化、融资经验分享',
      tags: ['创业', '投资', '商业'],
      isJoined: true,
    },
    {
      id: 4,
      name: '物理实验室',
      avatar: '⚛️',
      members: 156,
      posts: 634,
      description: '物理学术讨论、实验技巧分享',
      tags: ['物理', '实验', '科研'],
      isJoined: false,
    },
  ];

  // 模拟排行榜数据
  const leaderboardData = [
    { rank: 1, name: '张明', avatar: '👨‍💻', score: 2845, trend: 'up', change: 12 },
    { rank: 2, name: '李思', avatar: '👩‍🔬', score: 2634, trend: 'up', change: 8 },
    { rank: 3, name: '王浩', avatar: '🧑‍💼', score: 2512, trend: 'down', change: -3 },
    { rank: 4, name: '陈晓', avatar: '👨‍🎨', score: 2389, trend: 'up', change: 15 },
    { rank: 5, name: '赵六', avatar: '👨‍💻', score: 2267, trend: 'same', change: 0 },
  ];

  // Debounce 搜索查询
  useEffect(() => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    
    searchDebounceTimer.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce
    
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, [searchQuery]);

  // 工具函数：解析最后活跃时间
  const parseLastActive = useCallback((lastActiveStr) => {
    if (!lastActiveStr || typeof lastActiveStr !== 'string') return Infinity;
    
    const str = lastActiveStr.toLowerCase().trim();
    
    // 刚刚 = 0分钟
    if (str.includes('刚刚') || str === 'just now') return 0;
    
    // 解析分钟
    const minuteMatch = str.match(/(\d+)\s*(分钟|minute)/);
    if (minuteMatch) return parseInt(minuteMatch[1], 10);
    
    // 解析小时（转换为分钟）
    const hourMatch = str.match(/(\d+)\s*(小时|hour)/);
    if (hourMatch) return parseInt(hourMatch[1], 10) * 60;
    
    // 解析天（转换为分钟）
    const dayMatch = str.match(/(\d+)\s*(天|day)/);
    if (dayMatch) return parseInt(dayMatch[1], 10) * 24 * 60;
    
    return Infinity; // 无法解析的时间视为很久以前
  }, []);

  // 工具函数：检查是否为本科生
  const isUndergraduate = useCallback((grade) => {
    if (!grade) return false;
    return /大[一二三四]|大一|大二|大三|大四|freshman|sophomore|junior|senior/i.test(grade);
  }, []);

  // 工具函数：安全的数据验证
  const validateUser = useCallback((user) => {
    return (
      user &&
      typeof user.id !== 'undefined' &&
      typeof user.name === 'string' &&
      typeof user.department === 'string' &&
      typeof user.grade === 'string' &&
      Array.isArray(user.skills) &&
      typeof user.level === 'number'
    );
  }, []);

  // 筛选用户数据（使用 useMemo 缓存）
  const filteredUsers = useMemo(() => {
    try {
      // 数据验证
      if (!Array.isArray(usersData) || usersData.length === 0) {
        return [];
      }

      let filtered = usersData.filter(validateUser);
      
      // 1. 搜索筛选：按姓名、院系、技能、个人简介搜索
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase().trim();
        filtered = filtered.filter(user => {
          try {
            return (
              user.name?.toLowerCase().includes(query) ||
              user.department?.toLowerCase().includes(query) ||
              user.bio?.toLowerCase().includes(query) ||
              user.skills?.some(skill => skill.toLowerCase().includes(query))
            );
          } catch (error) {
            console.warn('搜索过滤用户时出错:', user.id, error);
            return false;
          }
        });
      }
      
      // 2. 快速筛选
      switch (quickFilter) {
        case 'undergrad':
          filtered = filtered.filter(user => isUndergraduate(user.grade));
          break;
        case 'graduate':
          filtered = filtered.filter(user => 
            user.grade === '研究生' || /研究生|graduate|master|phd/i.test(user.grade)
          );
          break;
        case 'active':
          // 活跃用户：最后活跃时间在24小时（1440分钟）内
          filtered = filtered.filter(user => {
            const minutes = parseLastActive(user.lastActive);
            return minutes < 1440; // 24小时 = 1440分钟
          });
          break;
        case 'lv10+':
          filtered = filtered.filter(user => user.level >= 10);
          break;
        case 'all':
        default:
          // 显示全部
          break;
      }
      
      // 3. 高级筛选
      // 院系筛选
      if (advancedFilters.departments.length > 0) {
        filtered = filtered.filter(user => 
          advancedFilters.departments.includes(user.department)
        );
      }
      
      // 年级筛选
      if (advancedFilters.grades.length > 0) {
        filtered = filtered.filter(user => 
          advancedFilters.grades.includes(user.grade)
        );
      }
      
      // 等级范围筛选
      if (advancedFilters.levelRange) {
        const [minLevel, maxLevel] = advancedFilters.levelRange;
        filtered = filtered.filter(user => 
          user.level >= minLevel && user.level <= maxLevel
        );
      }
      
      // 技能筛选
      if (advancedFilters.skillsFilter.trim()) {
        const skillQuery = advancedFilters.skillsFilter.toLowerCase().trim();
        filtered = filtered.filter(user =>
          user.skills?.some(skill => skill.toLowerCase().includes(skillQuery))
        );
      }
      
      return filtered;
    } catch (error) {
      console.error('筛选用户时发生错误:', error);
      return [];
    }
  }, [usersData, debouncedSearchQuery, quickFilter, advancedFilters, parseLastActive, isUndergraduate, validateUser]);

  // 用户相关处理函数
  const handleFollowUser = (userId, e) => {
    e.stopPropagation();
    console.log('关注/取消关注用户:', userId);
    // TODO: 调用API更新关注状态
  };

  const handleViewUserProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleChatUser = (userId, e) => {
    e.stopPropagation();
    console.log('与用户聊天:', userId);
    // TODO: 打开聊天界面
  };

  const handleGroupClick = (group) => {
    console.log('进入社区:', group);
  };

  const handleJoinGroup = (groupId, e) => {
    e.stopPropagation();
    console.log('加入社区:', groupId);
  };

  const handleStartMatch = () => {
    navigate('/match');
  };

  // 获取所有可用的院系列表
  const availableDepartments = useMemo(() => {
    return [...new Set(usersData.map(user => user.department))].sort();
  }, [usersData]);

  // 获取所有可用的年级列表
  const availableGrades = useMemo(() => {
    return [...new Set(usersData.map(user => user.grade))].sort();
  }, [usersData]);

  // 处理高级筛选变更
  const handleAdvancedFilterChange = useCallback((filterType, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  // 重置高级筛选
  const handleResetAdvancedFilters = useCallback(() => {
    setAdvancedFilters({
      departments: [],
      grades: [],
      levelRange: [0, 20],
      skillsFilter: '',
    });
  }, []);

  // 渲染高级筛选面板
  const renderAdvancedFilter = () => {
    const hasActiveFilters = 
      advancedFilters.departments.length > 0 ||
      advancedFilters.grades.length > 0 ||
      advancedFilters.levelRange[0] > 0 ||
      advancedFilters.levelRange[1] < 20 ||
      advancedFilters.skillsFilter.trim().length > 0;

    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-4 animate-slideDown">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">高级筛选</h3>
          {hasActiveFilters && (
            <button
              onClick={handleResetAdvancedFilters}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              清除全部
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* 院系筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              院系专业
            </label>
            <div className="flex flex-wrap gap-2">
              {availableDepartments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => {
                    const newDepts = advancedFilters.departments.includes(dept)
                      ? advancedFilters.departments.filter(d => d !== dept)
                      : [...advancedFilters.departments, dept];
                    handleAdvancedFilterChange('departments', newDepts);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    advancedFilters.departments.includes(dept)
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* 年级筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              年级
            </label>
            <div className="flex flex-wrap gap-2">
              {availableGrades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => {
                    const newGrades = advancedFilters.grades.includes(grade)
                      ? advancedFilters.grades.filter(g => g !== grade)
                      : [...advancedFilters.grades, grade];
                    handleAdvancedFilterChange('grades', newGrades);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    advancedFilters.grades.includes(grade)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          {/* 等级范围筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              等级范围：LV {advancedFilters.levelRange[0]} - LV {advancedFilters.levelRange[1]}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="20"
                value={advancedFilters.levelRange[0]}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value, 10);
                  if (newMin <= advancedFilters.levelRange[1]) {
                    handleAdvancedFilterChange('levelRange', [newMin, advancedFilters.levelRange[1]]);
                  }
                }}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <input
                type="range"
                min="0"
                max="20"
                value={advancedFilters.levelRange[1]}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value, 10);
                  if (newMax >= advancedFilters.levelRange[0]) {
                    handleAdvancedFilterChange('levelRange', [advancedFilters.levelRange[0], newMax]);
                  }
                }}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>LV 0</span>
              <span>LV 20</span>
            </div>
          </div>

          {/* 技能筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              技能关键词
            </label>
            <input
              type="text"
              placeholder="例如：Python、设计、数据分析..."
              value={advancedFilters.skillsFilter}
              onChange={(e) => handleAdvancedFilterChange('skillsFilter', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    );
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <UserX size={48} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">没有找到用户</h3>
      <p className="text-sm text-gray-500 text-center mb-4">
        {debouncedSearchQuery.trim() 
          ? `没有找到匹配"${debouncedSearchQuery}"的用户`
          : '当前筛选条件下没有用户'}
      </p>
      <button
        onClick={() => {
          setSearchQuery('');
          setDebouncedSearchQuery('');
          setQuickFilter('all');
          setAdvancedFilters({
            departments: [],
            grades: [],
            levelRange: [0, 20],
            skillsFilter: '',
          });
        }}
        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium hover:shadow-lg transition-all"
      >
        清除筛选条件
      </button>
    </div>
  );

  // 渲染加载状态
  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader size={48} className="text-purple-600 animate-spin mb-4" />
      <p className="text-sm text-gray-500">加载中...</p>
    </div>
  );

  // 渲染用户网格视图
  const renderUsersGrid = () => {
    if (isLoading) return renderLoadingState();
    if (filteredUsers.length === 0) return renderEmptyState();
    
    return (
      <div className="grid grid-cols-2 gap-4">
        {filteredUsers.map((user) => (
        <div
          key={user.id}
          onClick={() => handleViewUserProfile(user.id)}
          className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          {/* 用户头像 */}
          <div className="flex flex-col items-center mb-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-3xl mb-2">
              {user.avatar}
            </div>
            <h3 className="font-bold text-gray-800 text-center leading-tight">
              {user.name}
            </h3>
          </div>

          {/* 等级和积分 */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
              <span className="text-xs font-bold text-orange-600">LV{user.level}</span>
            </div>
            <span className="text-xs text-gray-500">{user.score}分</span>
          </div>

          {/* 院系和年级 */}
          <div className="text-center mb-3">
            <p className="text-xs text-gray-600 line-clamp-1">
              {user.department}
            </p>
            <p className="text-xs text-gray-500">{user.grade}</p>
          </div>

          {/* 技能标签（最多显示2个） */}
          <div className="flex flex-wrap gap-1 justify-center mb-3">
            {user.skills.slice(0, 2).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs"
              >
                {skill}
              </span>
            ))}
            {user.skills.length > 2 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                +{user.skills.length - 2}
              </span>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={(e) => handleFollowUser(user.id, e)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                user.isFollowing
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
              }`}
            >
              {user.isFollowing ? '已关注' : '关注'}
            </button>
            <button
              onClick={(e) => handleViewUserProfile(user.id)}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
            >
              <Icon icon="user" size="xs" />
            </button>
          </div>
        </div>
        ))}
      </div>
    );
  };

  // 渲染用户列表视图
  const renderUsersList = () => {
    if (isLoading) return renderLoadingState();
    if (filteredUsers.length === 0) return renderEmptyState();
    
    return (
      <div className="space-y-3">
        {filteredUsers.map((user) => (
        <div
          key={user.id}
          onClick={() => handleViewUserProfile(user.id)}
          className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-start gap-3">
            {/* 用户头像 */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl flex-shrink-0">
              {user.avatar}
            </div>

            {/* 用户信息 */}
            <div className="flex-1 min-w-0">
              {/* 第一行：姓名、等级、院系 */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-800">{user.name}</h3>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                  <span className="text-xs font-bold text-orange-600">LV{user.level}</span>
                </div>
                <span className="text-xs text-gray-400">🔥</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <span>{user.department}</span>
                <span>•</span>
                <span>{user.grade}</span>
                <span>•</span>
                <span className="text-gray-400">{user.lastActive}</span>
              </div>

              {/* 个人签名 */}
              {user.bio && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                  {user.bio}
                </p>
              )}

              {/* 技能标签 */}
              <div className="flex flex-wrap gap-1 mb-2">
                {user.skills.slice(0, 4).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
                {user.skills.length > 4 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                    +{user.skills.length - 4}
                  </span>
                )}
              </div>

              {/* 统计信息 */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{user.stats.topics} 话题</span>
                <span>{user.stats.comments} 评论</span>
                <span>{user.stats.followers} 粉丝</span>
                <span>{user.stats.following} 关注</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={(e) => handleFollowUser(user.id, e)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  user.isFollowing
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                }`}
              >
                {user.isFollowing ? '已关注' : '关注'}
              </button>
              {user.isFollowing && (
                <button
                  onClick={(e) => handleChatUser(user.id, e)}
                  className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-all"
                >
                  聊天
                </button>
              )}
            </div>
          </div>
        </div>
        ))}
      </div>
    );
  };

  // 渲染用户列表（根据视图模式）
  const renderUsers = () => (
    <div className="space-y-4">
      {/* 搜索和视图切换 */}
      <div className="flex gap-3">
        {/* 搜索框 */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="搜索用户..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* 视图切换按钮 */}
        <div className="flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-full transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-full transition-all ${
              viewMode === 'list'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* 快速筛选标签 */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { label: '全部', value: 'all' },
          { label: '本科生', value: 'undergrad' },
          { label: '研究生', value: 'graduate' },
          { label: '活跃用户', value: 'active' },
          { label: 'LV10+', value: 'lv10+' }
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setQuickFilter(filter.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              quickFilter === filter.value
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 用户数量统计 */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          共 <strong className="text-purple-600">{filteredUsers.length}</strong> 位用户
          {usersData.length !== filteredUsers.length && (
            <span className="text-gray-400 ml-1">（共 {usersData.length} 位）</span>
          )}
        </span>
        <button 
          onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
          className={`flex items-center gap-1 transition-all ${
            showAdvancedFilter 
              ? 'text-purple-600 font-medium' 
              : 'text-gray-600 hover:text-purple-600'
          }`}
        >
          <Filter size={14} />
          <span>高级筛选</span>
        </button>
      </div>

      {/* 高级筛选面板 */}
      {showAdvancedFilter && renderAdvancedFilter()}

      {/* 渲染对应的视图 */}
      {viewMode === 'grid' ? renderUsersGrid() : renderUsersList()}
    </div>
  );

  const renderGroups = () => (
    <div className="space-y-4">
      {communityGroups.map((group) => (
        <div
          key={group.id}
          onClick={() => handleGroupClick(group)}
          className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-start gap-4">
            {/* 群体头像 */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-3xl flex-shrink-0">
              {group.avatar}
            </div>

            {/* 群体信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-gray-800">{group.name}</h3>
                <button
                  onClick={(e) => handleJoinGroup(group.id, e)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    group.isJoined
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                  }`}
                >
                  {group.isJoined ? '已加入' : '+ 加入'}
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2 mb-3">
                {group.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 统计信息 */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{group.members} 成员</span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon="comment" size="xs" />
                  <span>{group.posts} 帖子</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMatch = () => (
    <div className="space-y-6">
      {/* 匹配介绍卡片 */}
      <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12 blur-2xl" />
        
        <div className="relative z-10">
          <div className="text-4xl mb-3">🎯</div>
          <h2 className="text-2xl font-bold mb-2">智能匹配</h2>
          <p className="text-sm opacity-90 mb-4">
            基于你的兴趣、技能和需求，为你推荐最合适的学习伙伴和项目团队
          </p>
          <button
            onClick={handleStartMatch}
            className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
          >
            开始匹配 →
          </button>
        </div>
      </div>

      {/* 匹配功能特点 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
            <Zap size={24} className="text-purple-600" />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">快速匹配</h3>
          <p className="text-xs text-gray-600">AI智能算法，秒级匹配</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mb-3">
            <Users size={24} className="text-pink-600" />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">精准推荐</h3>
          <p className="text-xs text-gray-600">多维度匹配度评估</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
            <Award size={24} className="text-orange-600" />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">实名认证</h3>
          <p className="text-xs text-gray-600">南科大学生身份验证</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <TrendingUp size={24} className="text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">持续优化</h3>
          <p className="text-xs text-gray-600">根据反馈不断改进</p>
        </div>
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-4">
      {/* 排行榜说明 */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200">
        <div className="flex items-center gap-3">
          <Trophy size={24} className="text-yellow-600" />
          <div>
            <h3 className="font-bold text-gray-800">社区贡献榜</h3>
            <p className="text-xs text-gray-600">根据发帖、回复、点赞等活动计算</p>
          </div>
        </div>
      </div>

      {/* 排行榜列表 */}
      {leaderboardData.map((user, index) => (
        <div
          key={user.rank}
          className={`bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${
            index < 3 ? 'border-2 border-yellow-200' : ''
          }`}
          onClick={() => navigate(`/user/${user.name}`)}
        >
          <div className="flex items-center gap-4">
            {/* 排名 */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
              user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
              user.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
              user.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
              'bg-gray-100 text-gray-600'
            }`}>
              {user.rank <= 3 ? (
                <Medal size={20} />
              ) : (
                user.rank
              )}
            </div>

            {/* 用户信息 */}
            <div className="flex-1 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl">
                {user.avatar}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{user.name}</h3>
                <p className="text-sm text-gray-500">声望值: {user.score}</p>
              </div>
            </div>

            {/* 变化趋势 */}
            <div className={`flex items-center gap-1 text-sm font-medium ${
              user.trend === 'up' ? 'text-green-600' :
              user.trend === 'down' ? 'text-red-600' :
              'text-gray-400'
            }`}>
              {user.trend === 'up' && (
                <>
                  <TrendingUp size={16} />
                  <span>+{user.change}</span>
                </>
              )}
              {user.trend === 'down' && (
                <>
                  <TrendingUp size={16} className="rotate-180" />
                  <span>{user.change}</span>
                </>
              )}
              {user.trend === 'same' && (
                <span className="text-gray-400">--</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="community-page pb-20">
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <span>👥</span>
            <span>社区</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">加入社群，结识志同道合的伙伴</p>
        </div>

        {/* Tab切换 */}
        <div className="flex border-t">
          <button
            onClick={() => setActiveSection('users')}
            className={`flex-1 py-3 text-center font-semibold transition-all relative ${
              activeSection === 'users' ? 'text-pink-600' : 'text-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={18} />
              <span>用户列表</span>
            </div>
            {activeSection === 'users' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-600 to-purple-600" />
            )}
          </button>
          
          <button
            onClick={() => setActiveSection('match')}
            className={`flex-1 py-3 text-center font-semibold transition-all relative ${
              activeSection === 'match' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Zap size={18} />
              <span>智能匹配</span>
            </div>
            {activeSection === 'match' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
            )}
          </button>

          <button
            onClick={() => setActiveSection('leaderboard')}
            className={`flex-1 py-3 text-center font-semibold transition-all relative ${
              activeSection === 'leaderboard' ? 'text-orange-600' : 'text-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Trophy size={18} />
              <span>排行榜</span>
            </div>
            {activeSection === 'leaderboard' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-orange-500" />
            )}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-4 py-4">
        {activeSection === 'users' && renderUsers()}
        {activeSection === 'match' && renderMatch()}
        {activeSection === 'leaderboard' && renderLeaderboard()}
      </div>
    </div>
  );
};

export { CommunityPage };
export default CommunityPage;

