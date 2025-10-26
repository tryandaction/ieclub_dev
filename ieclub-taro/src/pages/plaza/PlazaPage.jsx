/**
 * 广场页面
 * 包含两个Tab：话题和项目
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext.jsx';
import { useTopicStore, TopicType } from '../../store/topicStore';
import { TopicFilter, TopicList } from '../../components/topic';
import Icon from '../../components/common/Icon.jsx';

// 模拟话题数据
const mockTopics = [
  {
    id: 1,
    type: TopicType.OFFER,
    title: '线性代数期末重点串讲',
    content: '大家好！临近期末了，我整理了线性代数的核心知识点和常见题型。',
    author: '张明',
    avatar: '👨‍💻',
    tags: ['线性代数', '期末复习', '数学'],
    likesCount: 45,
    commentsCount: 12,
    viewsCount: 230,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    format: 'offline',
    maxParticipants: 30,
  },
  {
    id: 2,
    type: TopicType.DEMAND,
    title: '求Python数据分析入门指导',
    content: '我是生物医学专业的研究生，需要处理实验数据，想学习Python数据分析。',
    author: '李思',
    avatar: '👩‍🔬',
    tags: ['Python', '数据分析', '求助'],
    likesCount: 28,
    commentsCount: 8,
    viewsCount: 156,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    wantToHearCount: 16,
    isTeamFormed: true,
  },
];

const mockProjects = [
  {
    id: 3,
    type: TopicType.PROJECT,
    title: '智能排课系统 - 招募前端开发工程师',
    content: '我们正在开发一个基于AI的智能排课推荐系统，目前MVP已完成70%。',
    author: '王浩',
    avatar: '🧑‍💼',
    tags: ['前端开发', 'React', '项目招募'],
    likesCount: 67,
    commentsCount: 23,
    viewsCount: 445,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    projectStage: 'MVP开发中',
    teamSize: 5,
    recruiting: true,
  },
  {
    id: 4,
    type: TopicType.PROJECT,
    title: '校园二手交易平台开发',
    content: '打造专属南科大的二手交易平台，需要全栈工程师、UI设计师。',
    author: '陈晓',
    avatar: '👨‍🎨',
    tags: ['全栈', '微信小程序', '创业'],
    likesCount: 89,
    commentsCount: 31,
    viewsCount: 567,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    projectStage: '筹备中',
    teamSize: 3,
    recruiting: true,
  },
];

const PlazaPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'projects'
  
  const {
    topics,
    filters,
    isLoading,
    setTopics,
    setFilters,
    likeTopic,
    bookmarkTopic,
    incrementViews,
  } = useTopicStore();

  // 初始化数据
  useEffect(() => {
    if (topics.length === 0) {
      setTopics([...mockTopics, ...mockProjects]);
    }
  }, []);

  // 根据当前Tab筛选数据
  const displayedTopics = topics.filter(topic => {
    if (activeTab === 'topics') {
      return topic.type === TopicType.OFFER || topic.type === TopicType.DEMAND;
    } else {
      return topic.type === TopicType.PROJECT;
    }
  });

  const handleTopicClick = (topic) => {
    incrementViews(topic.id);
    console.log('查看详情:', topic);
  };

  const handleLike = (topicId) => {
    likeTopic(topicId);
  };

  const handleBookmark = (topicId) => {
    bookmarkTopic(topicId);
  };

  const handleComment = (topicId) => {
    console.log('评论:', topicId);
  };

  return (
    <div className="plaza-page pb-20">
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <span>🏛️</span>
            <span>话题广场</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">发现精彩内容，分享你的知识</p>
        </div>

        {/* Tab切换 */}
        <div className="flex border-t">
          <button
            onClick={() => setActiveTab('topics')}
            className={`flex-1 py-3 text-center font-semibold transition-all relative ${
              activeTab === 'topics'
                ? 'text-purple-600'
                : 'text-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon icon="topicOffer" size="sm" />
              <span>话题</span>
            </div>
            {activeTab === 'topics' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-3 text-center font-semibold transition-all relative ${
              activeTab === 'projects'
                ? 'text-orange-600'
                : 'text-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon icon="project" size="sm" />
              <span>项目</span>
            </div>
            {activeTab === 'projects' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500" />
            )}
          </button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="px-4 py-4 bg-gray-50">
        <TopicFilter
          filters={filters}
          onChange={setFilters}
        />
      </div>

      {/* 话题列表 */}
      <div className="px-4">
        <TopicList
          topics={displayedTopics}
          loading={isLoading}
          hasMore={false}
          onTopicClick={handleTopicClick}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onComment={handleComment}
          emptyType={activeTab === 'topics' ? 'topics' : 'projects'}
        />
      </div>
    </div>
  );
};

export default PlazaPage;

