/**
 * IEClub 话题广场页面
 * 展示我来讲、想听、项目三种类型的话题
 */
import React, { useState, useEffect } from 'react'
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
    updateFilters,
    likeTopic,
    favoriteTopic 
  } = useTopicStore()
  
  const [activeTab, setActiveTab] = useState('all')
  
  // 页面加载时获取话题
  useEffect(() => {
    fetchTopics(true)
  }, [])
  
  // Tab切换
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    updateFilters({ type: tab })
  }
  
  // 加载更多
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchTopics(false)
    }
  }
  
  // 话题点击
  const handleTopicClick = (topic) => {
    console.log('点击话题:', topic.title)
    // TODO: 跳转到话题详情页
  }
  
  // 点赞
  const handleLike = async (topicId, isLiked) => {
    await likeTopic(topicId)
  }
  
  // 收藏
  const handleFavorite = async (topicId, isFavorited) => {
    await favoriteTopic(topicId)
  }
  
  // 申请加入
  const handleJoin = (topicId, isJoined) => {
    console.log('申请加入:', topicId, isJoined)
    // TODO: 实现申请加入逻辑
  }
  
  // 筛选话题
  const filteredTopics = topics.filter(topic => {
    if (activeTab === 'all') return true
    return topic.type === activeTab
  })
  
  const tabs = [
    { key: 'all', label: '全部' },
    { key: TOPIC_TYPES.OFFER, label: '我来讲' },
    { key: TOPIC_TYPES.DEMAND, label: '想听' },
    { key: TOPIC_TYPES.PROJECT, label: '项目' }
  ]
  
  return (
    <MainLayout title="话题广场">
      <div className="max-w-screen-2xl mx-auto p-4 lg:p-6">
        {/* Tab切换栏 */}
        <div className="bg-white rounded-2xl p-1.5 mb-6 shadow-sm">
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30 transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 话题列表 - 响应式网格布局 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {filteredTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={handleTopicClick}
              onLike={handleLike}
              onFavorite={handleFavorite}
              onJoin={handleJoin}
            />
          ))}
        </div>
        
        {/* 加载更多 */}
        {hasMore && (
          <div className="col-span-2 lg:col-span-4 mt-6 text-center">
            <Button
              variant="outline"
              loading={isLoading}
              onClick={handleLoadMore}
              className="w-full lg:w-auto lg:px-12"
            >
              {isLoading ? '加载中...' : '加载更多'}
            </Button>
          </div>
        )}
        
        {/* 空状态 */}
        {!isLoading && filteredTopics.length === 0 && (
          <div className="col-span-2 lg:col-span-4 text-center py-12">
            <p className="text-gray-500 text-lg mb-2">暂无话题</p>
            <p className="text-gray-400 text-sm">快来发布第一个话题吧！</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default PlazaPage
