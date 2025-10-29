/**
 * IEClub 话题广场页面
 * 展示我来讲、想听、项目三种类型的话题
 */
import React, { useState, useEffect } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import TopicCard from '../../components/topic/TopicCard'
import Button from '../../components/common/Button'
import Icon from '../../components/common/Icon'
import { useTopicStore } from '../../store/topicStore'
import { TOPIC_TYPES, ICONS } from '../../constants'

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
    { key: 'all', label: '全部', icon: ICONS.square },
    { key: TOPIC_TYPES.OFFER, label: '我来讲', icon: ICONS.topicOffer },
    { key: TOPIC_TYPES.DEMAND, label: '想听', icon: ICONS.topicDemand },
    { key: TOPIC_TYPES.PROJECT, label: '项目', icon: ICONS.project }
  ]
  
  return (
    <MainLayout title="话题广场">
      <div className="p-4">
        {/* Tab切换栏 */}
        <div className="bg-white rounded-xl p-1 mb-4 shadow-sm">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Icon 
                  icon={tab.icon} 
                  size="sm" 
                  className="mr-2" 
                  color={activeTab === tab.key ? 'white' : '#6b7280'}
                />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 话题列表 */}
        <div className="space-y-4">
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
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              loading={isLoading}
              onClick={handleLoadMore}
              className="w-full"
            >
              {isLoading ? '加载中...' : '加载更多'}
            </Button>
          </div>
        )}
        
        {/* 空状态 */}
        {!isLoading && filteredTopics.length === 0 && (
          <div className="text-center py-12">
            <Icon icon="mdi:inbox-outline" size="2xl" color="#9ca3af" className="mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">暂无话题</p>
            <p className="text-gray-400 text-sm">快来发布第一个话题吧！</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default PlazaPage
