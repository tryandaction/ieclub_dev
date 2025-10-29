/**
 * IEClub 话题广场页
 * 完全按照设计文档实现 - 小红书风格
 */
import React, { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import MainLayout from '../../components/layout/MainLayout'
import TopicCard from '../../components/topic/TopicCard'
import Button from '../../components/common/Button'
import { useTopicStore } from '../../store/topicStore'
import { TOPIC_TYPES } from '../../constants'

const PlazaPage = () => {
  const { 
    topics, 
    filters, 
    isLoading,
    hasMore,
    fetchTopics,
    createTopic,
    likeTopic,
    favoriteTopic,
    joinTopic
  } = useTopicStore()
  
  const [activeTab, setActiveTab] = useState('all')
  
  // 页面加载时获取话题
  useEffect(() => {
    fetchTopics(true)
  }, [])
  
  // Tab切换
  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }
  
  // 话题点击
  const handleTopicClick = (topic) => {
    Taro.showToast({
      title: `查看：${topic.title}`,
      icon: 'none'
    })
  }
  
  // 点赞
  const handleLike = (topicId, isLiked) => {
    likeTopic(topicId, isLiked)
  }
  
  // 收藏
  const handleFavor = (topicId, isFavored) => {
    favoriteTopic(topicId, isFavored)
  }
  
  // 加入/申请
  const handleJoin = (topicId, isJoined) => {
    joinTopic(topicId, isJoined)
  }
  
  // 加载更多
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchTopics(false)
    }
  }
  
  // 过滤话题
  const filteredTopics = topics.filter(topic => {
    if (activeTab === 'all') return true
    return topic.type === activeTab
  })
  
  // Tab配置
  const tabs = [
    { key: 'all', label: '全部' },
    { key: TOPIC_TYPES.OFFER, label: '我来讲' },
    { key: TOPIC_TYPES.DEMAND, label: '想听' },
    { key: TOPIC_TYPES.PROJECT, label: '项目' }
  ]
  
  // 模拟数据（如果没有真实数据）
  const mockTopics = [
    {
      id: 1,
      type: TOPIC_TYPES.OFFER,
      title: '线性代数期末重点串讲',
      content: '覆盖线性代数期末考试重点内容，包括矩阵运算、向量空间、特征值等',
      author: '张同学',
      tags: ['数学', '考试'],
      likesCount: 15,
      commentsCount: 8,
      viewsCount: 128,
      participantsCount: 8,
      coverImage: null
    },
    {
      id: 2,
      type: TOPIC_TYPES.DEMAND,
      title: 'Python数据分析入门求教',
      content: '想系统学习Python数据分析，希望有大佬指导pandas和matplotlib的使用',
      author: '李同学',
      tags: ['Python', '数据分析'],
      likesCount: 23,
      commentsCount: 12,
      viewsCount: 95,
      participantsCount: 3,
      coverImage: null
    },
    {
      id: 3,
      type: TOPIC_TYPES.PROJECT,
      title: 'AI学习助手项目招募',
      content: '基于大模型的个性化学习推荐系统，寻找前端、后端、AI工程师',
      author: '王同学',
      tags: ['AI', '项目'],
      likesCount: 45,
      commentsCount: 18,
      viewsCount: 234,
      participantsCount: 3,
      maxParticipants: 5,
      coverImage: null
    },
    {
      id: 4,
      type: TOPIC_TYPES.OFFER,
      title: '数据科学竞赛经验分享',
      content: '参加过多次Kaggle竞赛，分享数据预处理、特征工程和模型调优经验',
      author: '赵同学',
      tags: ['竞赛', '数据科学'],
      likesCount: 67,
      commentsCount: 25,
      viewsCount: 312,
      participantsCount: 5,
      coverImage: null
    },
    {
      id: 5,
      type: TOPIC_TYPES.DEMAND,
      title: 'UI设计入门学习交流',
      content: '想学习UI/UX设计，希望找小伙伴一起学习Figma和设计理论',
      author: '孙同学',
      tags: ['设计', 'UI'],
      likesCount: 34,
      commentsCount: 15,
      viewsCount: 156,
      participantsCount: 12,
      coverImage: null
    },
    {
      id: 6,
      type: TOPIC_TYPES.PROJECT,
      title: '科研项目招募实验助手',
      content: '生物医学工程方向的科研项目，需要协助进行数据采集和分析',
      author: '周同学',
      tags: ['科研', '生物'],
      likesCount: 28,
      commentsCount: 9,
      viewsCount: 98,
      participantsCount: 2,
      maxParticipants: 3,
      coverImage: null
    }
  ]
  
  const displayTopics = filteredTopics.length > 0 ? filteredTopics : mockTopics.filter(topic => {
    if (activeTab === 'all') return true
    return topic.type === activeTab
  })
  
  return (
    <MainLayout title="话题广场">
      <div className="max-w-screen-2xl mx-auto p-4 lg:p-6">
        {/* Tab切换栏 - 按文档设计 */}
        <div className="bg-white rounded-2xl p-2 mb-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-4 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`py-3 px-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30 transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={{
                  fontSize: activeTab === tab.key ? '15px' : '14px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 话题列表 - 响应式网格布局 */}
        {/* 手机端: 2列 (48%宽), PC端: 4列 (23%宽) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {displayTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={handleTopicClick}
              onLike={handleLike}
              onFavorite={handleFavor}
              onJoin={handleJoin}
            />
          ))}
        </div>
        
        {/* 加载更多 */}
        {hasMore && displayTopics.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-12 py-3.5 bg-white border-2 border-purple-200 text-purple-600 rounded-2xl font-bold text-base hover:bg-purple-50 hover:border-purple-300 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
        
        {/* 空状态 */}
        {displayTopics.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="text-7xl mb-6">📚</div>
            <p className="text-xl font-bold text-gray-900 mb-2">暂无话题</p>
            <p className="text-gray-500">快来发布第一个话题吧！</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default PlazaPage
