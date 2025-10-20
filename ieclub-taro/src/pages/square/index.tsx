// src/pages/square/index.tsx - 话题广场页面（新版首页）

import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

// 模拟话题数据
const MOCK_TOPICS = [
  {
    id: '1',
    title: 'GPT-4 与教育变革：AI如何重塑个性化学习',
    content: '最近在开发一个 AI 学习助手，发现大模型在教育领域有巨大潜力。特别是GPT-4的上下文理解能力和生成式回答，让个性化教育成为可能。我们正在探索如何将这些技术应用到实际的教学场景中...',
    author: {
      id: 'u1',
      nickname: '张三',
      avatar: 'https://via.placeholder.com/40'
    },
    category: '技术',
    tags: ['AI', 'GPT-4', '教育'],
    likesCount: 42,
    commentsCount: 15,
    viewsCount: 328,
    createdAt: '2小时前'
  },
  {
    id: '2',
    title: '寻找懂 React Native 的小伙伴，一起做个校园社交App',
    content: '有个想法想做个校园社交App，需要前端和后端开发。主要是想解决校园内信息交流不便捷的问题，比如课程讨论、活动组织、资源共享等。有兴趣的小伙伴可以一起交流！',
    author: {
      id: 'u2',
      nickname: '李四',
      avatar: 'https://via.placeholder.com/40'
    },
    category: '项目',
    tags: ['React Native', '创业', '校园'],
    likesCount: 28,
    commentsCount: 12,
    viewsCount: 156,
    createdAt: '5小时前'
  },
  {
    id: '3',
    title: '分享一个前端性能优化的实战经验',
    content: '上周帮公司网站做性能优化，首屏加载时间从 5s 降到 1.2s。主要采用了以下几个策略：1. 代码分割 2. 图片懒加载 3. CDN加速 4. 缓存策略优化。效果很明显，用户体验提升了很多。',
    author: {
      id: 'u3',
      nickname: '王五',
      avatar: 'https://via.placeholder.com/40'
    },
    category: '技术',
    tags: ['前端', '性能优化', 'React'],
    likesCount: 67,
    commentsCount: 23,
    viewsCount: 512,
    createdAt: '1天前'
  }
]

// 分类选项
const CATEGORIES = ['全部', '技术', '项目', '生活', '活动', '资源']

export default function SquarePage() {
  const [topics, setTopics] = useState(MOCK_TOPICS)
  const [activeCategory, setActiveCategory] = useState('全部')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: 'IEClub 话题广场' })
  }, [])

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true)
    // 模拟网络请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    setTopics(MOCK_TOPICS)
    setRefreshing(false)
    Taro.showToast({ title: '刷新成功', icon: 'success' })
  }

  // 切换分类
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    // 这里可以根据分类筛选话题
    if (category === '全部') {
      setTopics(MOCK_TOPICS)
    } else {
      setTopics(MOCK_TOPICS.filter(t => t.category === category))
    }
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

  return (
    <View className='square-page'>
      {/* 分类筛选栏 */}
      <View className='category-tabs'>
        <ScrollView className='tabs-scroll' scrollX>
          {CATEGORIES.map(category => (
            <View
              key={category}
              className={`tab-item ${activeCategory === category ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 话题列表 */}
      <ScrollView
        className='topic-list'
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={onRefresh}
      >
        {topics.length === 0 ? (
          <View className='empty-state'>
            <Text className='empty-icon'>📝</Text>
            <Text className='empty-text'>暂无话题</Text>
            <View className='empty-btn' onClick={goToCreate}>
              发布第一个话题
            </View>
          </View>
        ) : (
          topics.map(topic => (
            <View
              key={topic.id}
              className='topic-card'
              onClick={() => goToDetail(topic.id)}
            >
              {/* 话题头部 */}
              <View className='topic-header'>
                <View className='author-info'>
                  <Image
                    className='avatar'
                    src={topic.author.avatar}
                    mode='aspectFill'
                  />
                  <View className='author-detail'>
                    <Text className='nickname'>{topic.author.nickname}</Text>
                    <Text className='time'>{topic.createdAt}</Text>
                  </View>
                </View>
                <View className='category-tag'>{topic.category}</View>
              </View>

              {/* 话题内容 */}
              <View className='topic-content'>
                <Text className='title'>{topic.title}</Text>
                <Text className='content'>{topic.content}</Text>
              </View>

              {/* 话题标签 */}
              {topic.tags && topic.tags.length > 0 && (
                <View className='topic-tags'>
                  {topic.tags.map((tag, index) => (
                    <Text key={index} className='tag-item'>
                      #{tag}
                    </Text>
                  ))}
                </View>
              )}

              {/* 话题底部统计 */}
              <View className='topic-footer'>
                <View className='stat-item'>
                  <Text className='stat-icon'>❤️</Text>
                  <Text className='stat-text'>{topic.likesCount}</Text>
                </View>
                <View className='stat-item'>
                  <Text className='stat-icon'>💬</Text>
                  <Text className='stat-text'>{topic.commentsCount}</Text>
                </View>
                <View className='stat-item'>
                  <Text className='stat-icon'>👁</Text>
                  <Text className='stat-text'>{topic.viewsCount}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 悬浮创建按钮 */}
      <View className='float-button' onClick={goToCreate}>
        <Text className='plus-icon'>+</Text>
      </View>
    </View>
  )
}