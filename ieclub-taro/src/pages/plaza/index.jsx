/**
 * IEClub 话题广场页面 - Taro版本
 * 支持小程序和H5，使用Flex布局（兼容小程序）
 */
import React, { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import MainLayout from '../../components/layout/MainLayout'
import TopicCard from '../../components/topic/TopicCard'
import Button from '../../components/common/Button'
import { useTopicStore } from '../../store/topicStore'
import { TOPIC_TYPES } from '../../constants'

const PlazaPage = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [filters, setFilters] = useState({})
  
  // 模拟数据
  const mockTopics = [
    {
      id: 1,
      type: TOPIC_TYPES.OFFER,
      title: 'Python数据分析入门教学',
      content: '分享数据分析的基础知识和实践经验',
      author: '张三',
      authorAvatar: '👨‍💻',
      tags: ['Python', '数据分析'],
      likesCount: 42,
      commentsCount: 8,
      viewsCount: 156,
      createdAt: '2025-10-27T10:30:00Z',
      isLiked: false,
      isFavorited: false
    },
    {
      id: 2,
      type: TOPIC_TYPES.DEMAND,
      title: '想学习Web前端开发',
      content: '寻找前端开发学习资源和学习伙伴',
      author: '李四',
      authorAvatar: '👩‍🎨',
      tags: ['前端', '学习'],
      likesCount: 23,
      commentsCount: 5,
      viewsCount: 89,
      createdAt: '2025-10-27T12:00:00Z',
      isLiked: false,
      isFavorited: true
    },
    {
      id: 3,
      type: TOPIC_TYPES.PROJECT,
      title: '组队开发校园二手交易平台',
      content: '招募有意向的前后端开发和UI设计同学',
      author: '王五',
      authorAvatar: '🧑‍💼',
      tags: ['项目', '组队'],
      likesCount: 67,
      commentsCount: 12,
      viewsCount: 234,
      createdAt: '2025-10-27T14:30:00Z',
      isLiked: true,
      isFavorited: false
    }
  ]

  useEffect(() => {
    // 暂时使用模拟数据
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
        {/* Tab切换栏 - 使用Flex布局 */}
        <View className="bg-white rounded-2xl p-2 mb-6 shadow-sm border border-gray-100">
          <View className="flex flex-row gap-2">
            {tabs.map((tab) => (
              <View
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 py-3 px-2 rounded-xl font-bold text-sm transition-all duration-300 text-center ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30 transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Text className={activeTab === tab.key ? 'text-white' : 'text-gray-600'}>{tab.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 话题列表 - 使用Flex布局替代Grid */}
        <View className="flex flex-row flex-wrap -mx-1.5">
          {mockTopics.map((topic) => (
            <View key={topic.id} className="w-1/2 lg:w-1/3 px-1.5 mb-3">
              <TopicCard
                topic={topic}
                onClick={handleTopicClick}
                onLike={handleLike}
                onFavorite={handleFavorite}
              />
            </View>
          ))}
        </View>

        {/* 空状态 */}
        {mockTopics.length === 0 && (
          <View className="text-center py-12">
            <Text className="text-gray-500 text-lg mb-2 block">暂无话题</Text>
            <Text className="text-gray-400 text-sm block">快来发布第一个话题吧！</Text>
          </View>
        )}
      </View>
    </MainLayout>
  )
}

export default PlazaPage
