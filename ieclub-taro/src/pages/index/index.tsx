import { View, ScrollView, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import TopicCard from '../../components/TopicCard'
import { getTopicList } from '../../services/topic'
import './index.scss'

// 分类选项
const CATEGORIES = [
  { label: '全部', value: '' },
  { label: '技术', value: 'tech' },
  { label: '项目', value: 'project' },
  { label: '生活', value: 'life' },
  { label: '活动', value: 'event' },
  { label: '资源', value: 'resource' }
]

// 排序方式
const SORT_OPTIONS = [
  { label: '热门', value: 'hot' },
  { label: '最新', value: 'latest' },
  { label: '最赞', value: 'popular' }
]

export default function Index() {
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // 筛选条件
  const [filters, setFilters] = useState({
    category: '',
    sortBy: 'hot'
  })

  // 分页
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true
  })

  // 获取话题列表
  const fetchTopics = async (isRefresh = false) => {
    if (loading) return

    const currentPage = isRefresh ? 1 : pagination.page

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const res = await getTopicList({
        page: currentPage,
        limit: pagination.limit,
        ...filters
      })

      if (res) {
        const newTopics = isRefresh
          ? res.topics
          : [...topics, ...res.topics]

        setTopics(newTopics)
        setPagination({
          ...res.pagination,
          hasMore: res.pagination.page < res.pagination.totalPages
        })
      }
    } catch (error) {
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 下拉刷新
  const onRefresh = () => {
    fetchTopics(true)
  }

  // 加载更多
  const onLoadMore = () => {
    if (pagination.hasMore && !loading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }

  // 改变筛选条件
  const onFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 跳转到话题详情
  const goToDetail = (topicId: string) => {
    Taro.navigateTo({
      url: `/pages/topics/detail/index?id=${topicId}`
    })
  }

  // 跳转到创建话题
  const goToCreate = () => {
    Taro.navigateTo({
      url: '/pages/topics/create/index'
    })
  }

  // 初始加载
  useEffect(() => {
    fetchTopics(true)
  }, [filters])

  // 滚动到底部加载更多
  useEffect(() => {
    if (pagination.page > 1) {
      fetchTopics()
    }
  }, [pagination.page])

  return (
    <View className='index-page'>
      {/* 筛选栏 */}
      <View className='filter-bar'>
        <ScrollView className='filter-scroll' scrollX>
          {CATEGORIES.map(item => (
            <View
              key={item.value}
              className={`filter-item ${filters.category === item.value ? 'active' : ''}`}
              onClick={() => onFilterChange('category', item.value)}
            >
              {item.label}
            </View>
          ))}
        </ScrollView>

        <View className='sort-section'>
          {SORT_OPTIONS.map(item => (
            <View
              key={item.value}
              className={`sort-item ${filters.sortBy === item.value ? 'active' : ''}`}
              onClick={() => onFilterChange('sortBy', item.value)}
            >
              {item.label}
            </View>
          ))}
        </View>
      </View>

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
        {topics.length === 0 && !loading ? (
          <View className='empty-state'>
            <Text className='empty-text'>暂无话题</Text>
            <View className='empty-action' onClick={goToCreate}>
              发布第一个话题
            </View>
          </View>
        ) : (
          <View className='topics-list'>
            {topics.map(topic => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onClick={() => goToDetail(topic.id)}
              />
            ))}

            {/* 加载状态 */}
            {loading && (
              <View className='loading-more'>
                <Text>加载中...</Text>
              </View>
            )}

            {!pagination.hasMore && topics.length > 0 && (
              <View className='no-more'>
                <Text>没有更多了</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 悬浮按钮 */}
      <View className='float-button' onClick={goToCreate}>
        <Text className='plus-icon'>+</Text>
      </View>
    </View>
  )
}