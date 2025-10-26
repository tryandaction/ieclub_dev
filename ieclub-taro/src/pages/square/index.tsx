import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useDebounce } from '@/hooks/useDebounce'
import './index.scss'

interface Topic {
  id: string
  title: string
  content: string
  author: {
    nickname: string
    avatar: string
  }
  images?: string[]
  likesCount: number
  commentsCount: number
  viewsCount: number
  tags?: string[]
  contentType: string
  createdAt: string
}

export default function Square() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // 使用 useMemo 缓存过滤后的话题列表
  const filteredTopics = useMemo(() => {
    if (activeTab === 'all') return topics
    const typeMap: Record<string, string> = {
      offer: 'topic_offer',
      demand: 'topic_demand',
      project: 'project'
    }
    return topics.filter(topic => topic.contentType === typeMap[activeTab])
  }, [topics, activeTab])

  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = async () => {
    setLoading(true)
    
    // Mock数据 - 快速展示界面
    const mockTopics: Topic[] = [
      {
        id: '1',
        title: '高等数学期末重点串讲',
        content: '马上期末了，整理了一些高数的重点内容，包括微积分、级数、多元函数等核心考点...',
        author: {
          nickname: '数学小天才',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'
        },
        images: ['https://picsum.photos/400/300?random=1'],
        likesCount: 128,
        commentsCount: 45,
        viewsCount: 892,
        tags: ['学习', '数学', '期末'],
        contentType: 'topic_offer',
        createdAt: '2024-10-25T10:30:00Z'
      },
      {
        id: '2',
        title: '求线性代数复习指导',
        content: '线代学得有点懵，特别是特征值和矩阵对角化部分，有没有大佬能分享一下复习经验？',
        author: {
          nickname: '迷茫的小萌新',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2'
        },
        likesCount: 67,
        commentsCount: 23,
        viewsCount: 445,
        tags: ['学习', '求助'],
        contentType: 'topic_demand',
        createdAt: '2024-10-25T09:15:00Z'
      },
      {
        id: '3',
        title: '创业项目：校园二手交易平台',
        content: '我们团队正在开发一个校园二手交易小程序，目前需要前端和UI设计师加入...',
        author: {
          nickname: '创业者Leo',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3'
        },
        images: [
          'https://picsum.photos/400/300?random=2',
          'https://picsum.photos/400/300?random=3'
        ],
        likesCount: 234,
        commentsCount: 78,
        viewsCount: 1523,
        tags: ['创业', '项目', '招募'],
        contentType: 'project',
        createdAt: '2024-10-24T16:20:00Z'
      },
      {
        id: '4',
        title: 'Python爬虫实战教程',
        content: '从零开始学习Python爬虫，涵盖requests、BeautifulSoup、Scrapy等主流框架...',
        author: {
          nickname: '代码侠',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4'
        },
        images: ['https://picsum.photos/400/500?random=4'],
        likesCount: 189,
        commentsCount: 56,
        viewsCount: 1234,
        tags: ['编程', 'Python', '爬虫'],
        contentType: 'topic_offer',
        createdAt: '2024-10-24T14:00:00Z'
      },
      {
        id: '5',
        title: '寻找算法竞赛队友',
        content: '准备参加ACM-ICPC区域赛，现在缺一名算法选手，要求熟悉动态规划和图论...',
        author: {
          nickname: '算法爱好者',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5'
        },
        likesCount: 45,
        commentsCount: 18,
        viewsCount: 567,
        tags: ['竞赛', '算法', '组队'],
        contentType: 'project',
        createdAt: '2024-10-24T10:30:00Z'
      }
    ]
    
    setTopics(mockTopics)
    setLoading(false)
  }

  // 使用 useCallback 避免不必要的重新渲染
  const goToSearch = useCallback(() => {
    Taro.navigateTo({ url: '/pages/search/index' })
  }, [])

  const goToNotifications = useCallback(() => {
    Taro.navigateTo({ url: '/pages/notifications/index' })
  }, [])

  const goToDetail = useCallback((id: string) => {
    Taro.navigateTo({ url: `/pages/topics/detail/index?id=${id}` })
  }, [])

  const handleLike = useCallback((e: any, id: string) => {
    e.stopPropagation()
    console.log('点赞话题', id)
    // 乐观更新：立即更新UI
    setTopics(prevTopics => 
      prevTopics.map(topic => 
        topic.id === id 
          ? { ...topic, likesCount: topic.likesCount + 1 }
          : topic
      )
    )
  }, [])

  // 加载更多
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setPage(prev => prev + 1)
    // 这里可以调用API加载更多数据
  }, [loading, hasMore])

  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { text: string; color: string }> = {
      topic_offer: { text: '我来讲', color: '#5B7FFF' },
      topic_demand: { text: '想听', color: '#FF6B9D' },
      project: { text: '项目', color: '#FFA500' }
    }
    return typeMap[type] || { text: '话题', color: '#999' }
  }

  const formatTime = (time: string) => {
    const now = new Date().getTime()
    const past = new Date(time).getTime()
    const diff = now - past
    
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    
    if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`
    } else {
      return `${Math.floor(diff / day)}天前`
    }
  }

  return (
    <View className='square-page'>
      {/* 顶部导航栏 */}
      <View className='nav-bar'>
        <View className='nav-left'>
          <Text className='logo'>IEClub</Text>
        </View>
        <View className='nav-right'>
          <View className='nav-icon' onClick={goToSearch}>
            <View className='iconify-icon' data-icon='mdi:magnify' />
          </View>
          <View className='nav-icon' onClick={goToNotifications}>
            <View className='iconify-icon' data-icon='mdi:bell-outline' />
            <View className='badge'>3</View>
          </View>
        </View>
      </View>

      {/* 标签栏 */}
      <View className='tab-bar'>
        <View
          className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Text>全部</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'offer' ? 'active' : ''}`}
          onClick={() => setActiveTab('offer')}
        >
          <Text>我来讲</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'demand' ? 'active' : ''}`}
          onClick={() => setActiveTab('demand')}
        >
          <Text>想听</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'project' ? 'active' : ''}`}
          onClick={() => setActiveTab('project')}
        >
          <Text>项目</Text>
        </View>
      </View>

      {/* 话题瀑布流 */}
      <ScrollView
        className='content'
        scrollY
        enableBackToTop
        refresherEnabled
        refresherTriggered={loading}
        onScrollToLower={loadMore}
        lowerThreshold={100}
      >
        <View className='masonry-container'>
          {filteredTopics.length === 0 && !loading ? (
            <View className='empty-state'>
              <Text className='empty-text'>暂无内容</Text>
              <Text className='empty-hint'>换个分类看看吧~</Text>
            </View>
          ) : (
            filteredTopics.map(topic => (
              <View
                key={topic.id}
                className='topic-card'
                onClick={() => goToDetail(topic.id)}
              >
                {/* 图片 */}
                {topic.images && topic.images.length > 0 && (
                  <View className='card-image'>
                    <Image
                      src={topic.images[0]}
                      mode='widthFix'
                      className='image'
                      lazyLoad
                      showMenuByLongpress
                    />
                    {topic.images.length > 1 && (
                      <View className='image-count'>
                        <View className='iconify-icon' data-icon='mdi:image-multiple' />
                        <Text>{topic.images.length}</Text>
                      </View>
                    )}
                  </View>
                )}

              {/* 内容 */}
              <View className='card-content'>
                <View className='card-title'>{topic.title}</View>
                <View className='card-desc'>{topic.content}</View>

                {/* 标签 */}
                {topic.tags && topic.tags.length > 0 && (
                  <View className='card-tags'>
                    {topic.tags.map((tag, index) => (
                      <View key={index} className='tag'>#{tag}</View>
                    ))}
                  </View>
                )}

                {/* 底部信息 */}
                <View className='card-footer'>
                  <View className='author-info'>
                    <Image
                      src={topic.author.avatar}
                      className='avatar'
                      mode='aspectFill'
                    />
                    <Text className='nickname'>{topic.author.nickname}</Text>
                  </View>

                  <View className='actions'>
                    <View
                      className='action-item'
                      onClick={(e) => handleLike(e, topic.id)}
                    >
                      <View className='iconify-icon' data-icon='mdi:heart-outline' />
                      <Text>{topic.likesCount}</Text>
                    </View>
                    <View className='action-item'>
                      <View className='iconify-icon' data-icon='mdi:comment-outline' />
                      <Text>{topic.commentsCount}</Text>
                    </View>
                  </View>
                </View>

                {/* 类型标签 */}
                <View
                  className='type-tag'
                  style={{ background: getTypeTag(topic.contentType).color }}
                >
                  {getTypeTag(topic.contentType).text}
                </View>
              </View>
            </View>
            ))
          )}
        </View>

        {loading && (
          <View className='loading-more'>
            <View className='loading-spinner' />
            <Text>加载中...</Text>
          </View>
        )}
        
        {!loading && !hasMore && filteredTopics.length > 0 && (
          <View className='no-more'>没有更多了~</View>
        )}
      </ScrollView>
    </View>
  )
}
