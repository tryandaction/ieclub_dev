// ==================== 话题广场页面（增强版） ====================

import { View, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useTopicStore } from '../../store/topic'
import TopicCard from '../../components/TopicCard'
import TopicFilters from '../../components/TopicFilters'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import './index.scss'

export default function TopicsPage() {
  const {
    topics,
    hasMore,
    loading,
    filters,
    fetchTopics,
    setFilters,
    clearTopics
  } = useTopicStore()

  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const loadTopics = async () => {
      try {
        await fetchTopics({ page: 1 })
      } catch (error) {
        console.error('加载话题失败:', error)
      }
    }

    loadTopics()

    return () => {
      clearTopics()
    }
  }, [fetchTopics, clearTopics])

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchTopics({ page: 1 })
    } finally {
      setRefreshing(false)
    }
  }

  // 加载更多
  const onLoadMore = async () => {
    if (!hasMore || loading) return

    try {
      await fetchTopics({ page: filters.page! + 1 }, true)
    } catch (error) {
      console.error('加载更多失败:', error)
    }
  }

  // 筛选变化
  const onFilterChange = async (newFilters: any) => {
    setFilters({ ...newFilters, page: 1 })
    await fetchTopics({ ...newFilters, page: 1 })
  }

  // 跳转到创建页面
  const goToCreate = () => {
    Taro.navigateTo({ url: '/pages/topics/create/index' })
  }

  // 跳转到话题详情
  const goToDetail = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/topics/detail/index?id=${topicId}` })
  }

  return (
    <View className='topics-page'>
      {/* 筛选器 */}
      <TopicFilters
        filters={filters}
        onChange={onFilterChange}
      />

      {/* 话题列表 */}
      <ScrollView
        className='topics-scroll'
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={onRefresh}
        onScrollToLower={onLoadMore}
        lowerThreshold={100}
      >
        {loading && topics.length === 0 ? (
          <LoadingSpinner />
        ) : topics.length === 0 ? (
          <EmptyState
            title='暂无话题'
            description='快来发布第一个话题吧'
            actionText='发布话题'
            onAction={goToCreate}
          />
        ) : (
          <View className='topics-list'>
            {topics.map(topic => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onClick={() => goToDetail(topic.id)}
              />
            ))}

            {hasMore && (
              <View className='load-more'>
                {loading ? '加载中...' : '上拉加载更多'}
              </View>
            )}

            {!hasMore && topics.length > 0 && (
              <View className='no-more'>没有更多了</View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 发布按钮 */}
      <View className='create-btn' onClick={goToCreate}>
        <View className='create-icon'>+</View>
      </View>
    </View>
  )
}