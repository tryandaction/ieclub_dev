import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
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
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = async () => {
    try {
      setLoading(true)
      // Mock数据
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
        }
      ]
      
      setTopics(mockTopics)
    } catch (error) {
      console.error('加载话题失败', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const goToSearch = () => {
    Taro.navigateTo({ url: '/pages/search/index' })
  }

  const goToNotifications = () => {
    Taro.navigateTo({ url: '/pages/notifications/index' })
  }

  const goToDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/topics/detail/index?id=${id}` })
  }

  const handleLike = (e: any, id: string) => {
    e.stopPropagation()
    console.log('点赞话题', id)
  }

  const getTypeTag = (type: string) => {
    const typeMap = {
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
      >
        <View className='masonry-container'>
          {topics.map(topic => (
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
          ))}
        </View>

        {loading && (
          <View className='loading-more'>加载中...</View>
        )}
      </ScrollView>
    </View>
  )
}
