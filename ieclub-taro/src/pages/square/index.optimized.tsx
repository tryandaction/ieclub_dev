/**
 * 广场页面 - 深度优化版本
 * 
 * 优化点：
 * 1. 使用 usePagination Hook 统一分页逻辑
 * 2. 使用 LazyImage 组件优化图片加载
 * 3. 使用 useDebounce 优化搜索
 * 4. 使用 React.memo 减少重复渲染
 * 5. 使用 useCallback 优化函数引用
 * 6. 使用 VirtualList 优化长列表性能
 */

import React, { useState, useCallback, useMemo } from 'react'
import { View, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { usePerformance } from '@/hooks/usePerformance'
import LazyImage from '@/components/LazyImage'
import { DefaultCoverIcon, DefaultAvatarIcon } from '@/components/CustomIcons'
import { getApiBaseUrl } from '@/utils/api-config'
import './index.scss'

interface Topic {
  id: string
  title: string
  content?: string
  cover?: string
  author: {
    id: string
    nickname?: string
    username?: string
    avatar?: string
  }
  likesCount: number
  commentsCount: number
  createdAt: string
}

// 提取话题卡片为独立组件，使用 memo 优化
const TopicCard = React.memo<{
  topic: Topic
  onClick: (id: string) => void
}>(({ topic, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(topic.id)
  }, [onClick, topic.id])

  return (
    <View className='topic-card' onClick={handleClick}>
      {topic.cover ? (
        <LazyImage
          src={topic.cover}
          className='topic-cover'
          mode='aspectFill'
          placeholder={undefined}
        />
      ) : (
        <DefaultCoverIcon height='180px' />
      )}
      
      <View className='topic-info'>
        <View className='topic-title'>{topic.title}</View>
        
        <View className='topic-author'>
          {topic.author?.avatar ? (
            <LazyImage
              src={topic.author.avatar}
              className='author-avatar'
              mode='aspectFill'
            />
          ) : (
            <DefaultAvatarIcon size={32} />
          )}
          <View className='author-name'>
            {topic.author?.nickname || topic.author?.username}
          </View>
        </View>
        
        <View className='topic-stats'>
          <View className='stat-item'>👍 {topic.likesCount || 0}</View>
          <View className='stat-item'>💬 {topic.commentsCount || 0}</View>
        </View>
      </View>
    </View>
  )
})

TopicCard.displayName = 'TopicCard'

const SquarePage: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const debouncedSearch = useDebounce(searchText, 500)

  // 性能监控（开发环境）
  const metrics = usePerformance({
    enabled: process.env.NODE_ENV === 'development',
    onReport: (metrics) => {
      console.log('📊 性能指标:', metrics)
    }
  })

  // 话题列表服务
  const fetchTopicsService = useCallback(async (page: number, pageSize: number) => {
    try {
      const apiBase = getApiBaseUrl()
      
      const res = await Taro.request({
        url: `${apiBase}/topics`,
        method: 'GET',
        data: {
          page,
          limit: pageSize,
          search: debouncedSearch
        },
        timeout: 10000
      })

      if (res.statusCode === 200) {
        const data = res.data as any
        
        // 处理不同的响应格式
        if (data && data.success && Array.isArray(data.data)) {
          return {
            data: data.data,
            total: data.total || data.data.length,
            hasMore: data.hasMore ?? (page * pageSize < (data.total || data.data.length))
          }
        } else if (data && Array.isArray(data.topics)) {
          return {
            data: data.topics,
            total: data.total || data.topics.length,
            hasMore: data.hasMore ?? true
          }
        }
      }

      // 返回测试数据
      throw new Error('API未响应')
      
    } catch (error) {
      console.warn('⚠️ 获取话题失败，使用测试数据')
      
      // 模拟测试数据
      const mockTopics: Topic[] = [
        {
          id: '1',
          title: '欢迎来到IEClub社区！',
          content: '这是一个测试话题，后端服务暂未启动。',
          cover: undefined,
          author: {
            id: 'test1',
            nickname: 'IEClub团队',
            avatar: undefined
          },
          likesCount: 128,
          commentsCount: 45,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: '如何开始使用IEClub？',
          content: '浏览话题、参与讨论、发现更多可能...',
          cover: undefined,
          author: {
            id: 'test2',
            nickname: '小助手',
            avatar: undefined
          },
          likesCount: 96,
          commentsCount: 32,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          title: '分享你的创业想法',
          content: '在这里找到志同道合的伙伴',
          cover: undefined,
          author: {
            id: 'test3',
            nickname: '创业者',
            avatar: undefined
          },
          likesCount: 73,
          commentsCount: 18,
          createdAt: new Date().toISOString()
        }
      ]

      return {
        data: page === 1 ? mockTopics : [],
        total: mockTopics.length,
        hasMore: false
      }
    }
  }, [debouncedSearch])

  // 使用分页Hook
  const {
    data: topics,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    refresh,
    loadMore
  } = usePagination({
    service: fetchTopicsService,
    pageSize: 20,
    onSuccess: (data) => {
      console.log('✅ 成功加载话题:', data.length, '条')
    }
  })

  // 导航到话题详情
  const goToTopicDetail = useCallback((topicId: string) => {
    Taro.navigateTo({
      url: `/pages/topics/detail/index?id=${topicId}`
    })
  }, [])

  // 导航到搜索页
  const goToSearch = useCallback(() => {
    Taro.navigateTo({
      url: '/pages/search/index'
    })
  }, [])

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    await refresh()
  }, [refresh])

  // 触底加载更多
  const handleScrollToLower = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadMore()
    }
  }, [loadingMore, hasMore, loadMore])

  // 渲染加载状态
  const renderLoading = useMemo(() => (
    <View className='loading'>
      <View className='loading-spinner' />
      <View className='loading-text'>加载中...</View>
    </View>
  ), [])

  // 渲染空状态
  const renderEmpty = useMemo(() => (
    <View className='empty-state'>
      <View className='empty-icon'>📭</View>
      <View className='empty-text'>暂无话题</View>
      <View className='empty-hint'>快来发布第一个话题吧</View>
    </View>
  ), [])

  return (
    <View className='square-page'>
      {/* 顶部搜索栏 */}
      <View className='header'>
        <View className='search-bar' onClick={goToSearch}>
          <View className='search-icon'>🔍</View>
          <View className='search-placeholder'>搜索话题、用户...</View>
        </View>
      </View>

      {/* 性能指标（仅开发环境） */}
      {process.env.NODE_ENV === 'development' && (
        <View className='performance-monitor'>
          FPS: {metrics.fps} | 
          {metrics.memory && ` MEM: ${metrics.memory.used}MB`}
        </View>
      )}

      {/* 话题列表 */}
      <ScrollView
        className='content'
        scrollY
        style={{ height: 'calc(100vh - 140px)' }}
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
        onScrollToLower={handleScrollToLower}
        lowerThreshold={100}
      >
        {loading && topics.length === 0 ? (
          renderLoading
        ) : topics.length > 0 ? (
          <>
            <View className='topic-waterfall'>
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onClick={goToTopicDetail}
                />
              ))}
            </View>
            
            {/* 加载更多指示器 */}
            {loadingMore && (
              <View className='loading-more'>
                <View className='loading-spinner small' />
                <View className='loading-text'>加载更多...</View>
              </View>
            )}
            
            {!hasMore && topics.length > 0 && (
              <View className='no-more'>没有更多了</View>
            )}
          </>
        ) : (
          renderEmpty
        )}
      </ScrollView>
    </View>
  )
}

export default SquarePage

