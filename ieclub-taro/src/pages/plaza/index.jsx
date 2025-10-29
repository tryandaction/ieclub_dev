/**
 * IEClub 话题广场页
 * 小程序兼容版本 - 使用Taro组件
 */
import React, { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
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
    setFilters,
    likeTopic,
    favoriteTopic
  } = useTopicStore()

  const [activeTab, setActiveTab] = useState('all')

  // 模拟话题数据
  const mockTopics = [
    {
      id: 't1',
      type: TOPIC_TYPES.OFFER,
      title: 'Python数据分析入门',
      content: '分享Python数据分析的基础知识和实战技巧，适合初学者',
      author: '张明',
      authorAvatar: '👨‍💻',
      category: 'study',
      tags: ['Python', '数据分析', '编程'],
      likesCount: 156,
      commentsCount: 23,
      viewsCount: 890,
      createdAt: '2025-10-28T10:00:00Z',
      isLiked: false,
      isFavorited: false
    },
    {
      id: 't2',
      type: TOPIC_TYPES.DEMAND,
      title: '想学前端开发',
      content: '希望有经验的同学分享前端学习路线和资源推荐',
      author: '李思',
      authorAvatar: '👩‍🔬',
      category: 'study',
      tags: ['前端', '学习', 'Web'],
      likesCount: 89,
      commentsCount: 15,
      viewsCount: 345,
      participantsCount: 3,
      maxParticipants: 15,
      createdAt: '2025-10-27T14:30:00Z',
      isLiked: true,
      isFavorited: false
    }
  ]

  useEffect(() => {
    // 暂时使用模拟数据
    // fetchTopics(true, activeTab)
  }, [activeTab])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setFilters({ type: tab === 'all' ? null : tab })
  }

  const handleTopicClick = (topic) => {
    Taro.showToast({
      title: `查看话题: ${topic.title}`,
      icon: 'none'
    })
  }

  const handleLike = (topicId, isLiked) => {
    Taro.showToast({
      title: isLiked ? '已点赞' : '取消点赞',
      icon: 'success'
    })
  }

  const handleFavorite = (topicId, isFavorited) => {
    Taro.showToast({
      title: isFavorited ? '已收藏' : '取消收藏',
      icon: 'success'
    })
  }

  const tabs = [
    { key: 'all', label: '全部' },
    { key: TOPIC_TYPES.OFFER, label: '我来讲' },
    { key: TOPIC_TYPES.DEMAND, label: '想听' },
    { key: TOPIC_TYPES.PROJECT, label: '项目' }
  ]

  return (
    <MainLayout title="话题广场">
      <View className="w-full mx-auto px-3 py-4 lg:px-8 lg:py-6">
        {/* Tab切换栏 */}
        <View className="bg-white rounded-2xl p-2 mb-6 shadow-sm border border-gray-100">
          <View className="grid grid-cols-4 gap-2">
            {tabs.map((tab) => (
              <View
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`py-3 px-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30 transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Text>{tab.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 话题列表 */}
        <View className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
          {mockTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={handleTopicClick}
              onLike={handleLike}
              onFavorite={handleFavorite}
            />
          ))}
        </View>

        {/* 空状态 */}
        {mockTopics.length === 0 && (
          <View className="col-span-2 lg:col-span-3 text-center py-12">
            <Text className="text-gray-500 text-lg mb-2">暂无话题</Text>
            <Text className="text-gray-400 text-sm">快来发布第一个话题吧！</Text>
          </View>
        )}
      </View>
    </MainLayout>
  )
}

export default PlazaPage
