import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext.jsx';
import { useTopicStore, TopicType, TopicCategory, TopicSortBy } from '../../store/topicStore';
import { TopicFilter, TopicList } from '../../components/topic';
import Icon from '../../components/common/Icon.jsx';

// 模拟话题数据
const mockTopics = [
  {
    id: 1,
    type: TopicType.OFFER,
    title: '线性代数期末重点串讲',
    content: '大家好！临近期末了，我整理了线性代数的核心知识点和常见题型。包括：行列式计算、矩阵运算、特征值与特征向量、线性方程组等。适合想要系统复习的同学。',
    author: '张明',
    avatar: '👨‍💻',
    category: TopicCategory.STUDY,
    tags: ['线性代数', '期末复习', '数学'],
    likesCount: 45,
    commentsCount: 12,
    viewsCount: 230,
    bookmarksCount: 18,
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
    format: 'offline',
    maxParticipants: 30,
    availableTimes: ['周六14:00-16:00', '周日10:00-12:00'],
  },
  {
    id: 2,
    type: TopicType.DEMAND,
    title: '求Python数据分析入门指导',
    content: '我是生物医学专业的研究生，需要处理实验数据，想学习Python数据分析（Pandas, NumPy, Matplotlib）。希望能找到愿意教我的大神，线上线下都可以！',
    author: '李思',
    avatar: '👩‍🔬',
    category: TopicCategory.SKILL,
    tags: ['Python', '数据分析', '求助'],
    likesCount: 28,
    commentsCount: 8,
    viewsCount: 156,
    bookmarksCount: 6,
    isLiked: true,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5小时前
    wantToHearCount: 16,
    isTeamFormed: true,
  },
  {
    id: 3,
    type: TopicType.PROJECT,
    title: '智能排课系统 - 招募前端开发工程师',
    content: '我们正在开发一个基于AI的智能排课推荐系统，目前MVP已完成70%。寻找熟悉React/Vue的前端工程师加入团队。项目有完整的产品规划和技术架构，适合想积累项目经验的同学。',
    author: '王浩',
    avatar: '🧑‍💼',
    category: TopicCategory.STARTUP,
    tags: ['前端开发', 'React', '项目招募'],
    likesCount: 67,
    commentsCount: 23,
    viewsCount: 445,
    bookmarksCount: 34,
    isLiked: false,
    isBookmarked: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
    projectStage: 'MVP开发中',
    teamSize: 5,
    recruiting: true,
  },
  {
    id: 4,
    type: TopicType.OFFER,
    title: 'React Hooks 实战分享',
    content: '从useState到useContext，从useEffect到自定义Hooks，全面讲解React Hooks的使用技巧和最佳实践。会结合实际项目案例进行讲解。',
    author: '赵六',
    avatar: '👨‍💻',
    category: TopicCategory.SKILL,
    tags: ['React', 'Hooks', '前端'],
    likesCount: 89,
    commentsCount: 31,
    viewsCount: 567,
    bookmarksCount: 45,
    isLiked: true,
    isBookmarked: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
    format: 'online',
    maxParticipants: 50,
  },
];

export const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // 使用Zustand store
  const {
    topics,
    filters,
    pagination,
    isLoading,
    setTopics,
    setFilters,
    likeTopic,
    bookmarkTopic,
    incrementViews,
  } = useTopicStore();

  const [showCreateModal, setShowCreateModal] = useState(false);

  // 初始化：加载模拟数据
  useEffect(() => {
    // 实际项目中这里应该调用API
    // const fetchTopics = async () => {
    //   setLoading(true);
    //   try {
    //     const data = await api.topics.getList(filters);
    //     setTopics(data.topics);
    //     setPagination(data.pagination);
    //   } catch (error) {
    //     console.error('加载话题失败:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchTopics();

    // 使用模拟数据
    if (topics.length === 0) {
      setTopics(mockTopics);
    }
  }, []);

  // 筛选话题
  const filteredTopics = topics.filter((topic) => {
    // 类型筛选
    if (filters.type && topic.type !== filters.type) return false;
    // 分类筛选
    if (filters.category !== TopicCategory.ALL && topic.category !== filters.category) return false;
    return true;
  });

  // 排序话题
  const sortedTopics = [...filteredTopics].sort((a, b) => {
    switch (filters.sortBy) {
      case TopicSortBy.LATEST:
        return new Date(b.createdAt) - new Date(a.createdAt);
      case TopicSortBy.HOT:
        return (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount);
      case TopicSortBy.TRENDING:
        // 简化的趋势算法：结合热度和时间
        const scoreA = (a.likesCount + a.commentsCount) / Math.max(1, (Date.now() - new Date(a.createdAt)) / (1000 * 60 * 60));
        const scoreB = (b.likesCount + b.commentsCount) / Math.max(1, (Date.now() - new Date(b.createdAt)) / (1000 * 60 * 60));
        return scoreB - scoreA;
      case TopicSortBy.RECOMMENDED:
      default:
        return 0; // 保持原顺序（实际应该有推荐算法）
    }
  });

  // 处理筛选变化
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // 处理话题点击
  const handleTopicClick = (topic) => {
    incrementViews(topic.id);
    // 跳转到话题详情页（暂未实现）
    console.log('查看话题详情:', topic);
  };

  // 处理点赞
  const handleLike = (topicId) => {
    likeTopic(topicId);
  };

  // 处理收藏
  const handleBookmark = (topicId) => {
    bookmarkTopic(topicId);
  };

  // 处理评论
  const handleComment = (topicId) => {
    console.log('评论话题:', topicId);
  };

  // 处理加载更多
  const handleLoadMore = () => {
    console.log('加载更多');
    // loadNextPage();
  };

  return (
    <div className="home-page">
      {/* 精简的欢迎区 - 小红书风格 */}
      <div className="mb-6 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        {/* 装饰元素 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <span>欢迎来到 IEclub</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-sm opacity-90">南科大跨学科交流社区 · 学习分享 · 资源对接</p>
        </div>
      </div>

      {/* 话题筛选器 */}
      <div className="mb-5">
        <TopicFilter
          filters={filters}
          onChange={handleFilterChange}
        />
      </div>

      {/* 话题列表 - 瀑布流 */}
      <TopicList
        topics={sortedTopics}
        loading={isLoading}
        hasMore={pagination.hasMore}
        onLoadMore={handleLoadMore}
        onTopicClick={handleTopicClick}
        onLike={handleLike}
        onBookmark={handleBookmark}
        onComment={handleComment}
        emptyType={filters.type}
      />

      {/* 悬浮发布按钮 - 小红书风格 */}
      <button
        onClick={() => !isAuthenticated ? navigate('/login') : setShowCreateModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all flex items-center justify-center z-50 group"
        style={{ boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4)' }}
      >
        <Icon icon="publish" size="lg" color="#ffffff" />
        <span className="sr-only">发布话题</span>
      </button>

      {/* 发布话题模态框（待实现） */}
      {/* <CreateTopicModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      /> */}
    </div>
  );
};