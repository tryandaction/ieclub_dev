// src/pages/index/index.tsx - 话题广场首页（小红书风格）

import { View, Text, Image, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

// 模拟数据
const MOCK_TOPICS = [
  {
    id: '1',
    type: 'supply', // supply: 我来讲, demand: 想听
    title: 'GPT-4教育应用实战：从零到一开发AI学习助手',
    content: '历时3个月，我开发了一个基于GPT-4的个性化学习助手，想分享一些实战经验...',
    author: {
      id: 'u1',
      nickname: '张三',
      avatar: 'https://via.placeholder.com/60/667eea/ffffff?text=Z'
    },
    cover: 'https://via.placeholder.com/400x300/667eea/ffffff?text=AI+Education',
    category: '技术',
    tags: ['AI', 'GPT-4', '教育'],
    wantToHearCount: 23,
    canHelpCount: 5,
    viewsCount: 328,
    likesCount: 42,
    commentsCount: 15,
    createdAt: '2小时前'
  },
  {
    id: '2',
    type: 'demand',
    title: '寻找React Native大神，一起做校园社交App',
    content: '我负责产品和设计，需要1-2名前端开发（React Native）和1名后端开发（Node.js）...',
    author: {
      id: 'u2',
      nickname: '李四',
      avatar: 'https://via.placeholder.com/60/3b82f6/ffffff?text=L'
    },
    cover: null,
    category: '项目',
    tags: ['React Native', '创业'],
    wantToHearCount: 8,
    canHelpCount: 12,
    viewsCount: 156,
    likesCount: 28,
    commentsCount: 12,
    createdAt: '5小时前'
  },
  {
    id: '3',
    type: 'supply',
    title: '前端性能优化实战：首屏加载从5s到1.2s',
    content: '分享我最近做的一个网站性能优化项目，包括代码分割、图片优化、缓存策略等...',
    author: {
      id: 'u3',
      nickname: '王五',
      avatar: 'https://via.placeholder.com/60/9333ea/ffffff?text=W'
    },
    cover: 'https://via.placeholder.com/400x300/9333ea/ffffff?text=Performance',
    category: '技术',
    tags: ['前端', '性能优化'],
    wantToHearCount: 45,
    canHelpCount: 3,
    viewsCount: 512,
    likesCount: 67,
    commentsCount: 23,
    createdAt: '1天前'
  }
]

const CATEGORIES = ['全部', '技术', '项目', '设计', '商业', '生活']

export default function IndexPage() {
  const [topics, setTopics] = useState(MOCK_TOPICS)
  const [activeTab, setActiveTab] = useState('发现')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [sortBy, setSortBy] = useState('hot') // hot: 热门, latest: 最新
  const [showAnnouncement, setShowAnnouncement] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: 'IEClub' })
  }, [])

  // 跳转到搜索页
  const goToSearch = () => {
    Taro.navigateTo({ url: '/pages/search/index' })
  }

  // 跳转到话题详情
  const goToDetail = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/topics/detail/index?id=${topicId}` })
  }

  // 跳转到发布页
  const goToCreate = () => {
    Taro.navigateTo({ url: '/pages/topics/create/index' })
  }

  // 切换分类
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    // TODO: 根据分类筛选数据
  }

  // 快速操作：想听 / 我能讲
  const handleQuickAction = (topicId: string, type: 'supply' | 'demand', action: 'wantToHear' | 'canHelp') => {
    Taro.showToast({
      title: action === 'wantToHear' ? '已标记想听' : '已标记我能讲',
      icon: 'success'
    })
    // TODO: 调用API
  }

  return (
    <View className='index-page'>
      {/* ===== 顶部导航栏 ===== */}
      <View className='top-nav'>
        {/* 搜索框 */}
        <View className='search-box' onClick={goToSearch}>
          <View className='search-icon'>🔍</View>
          <Text className='search-placeholder'>搜索话题、用户</Text>
        </View>

        {/* Tab切换 */}
        <View className='nav-tabs'>
          <View
            className={`tab-item ${activeTab === '关注' ? 'active' : ''}`}
            onClick={() => setActiveTab('关注')}
          >
            关注
          </View>
          <View
            className={`tab-item ${activeTab === '发现' ? 'active' : ''}`}
            onClick={() => setActiveTab('发现')}
          >
            发现
          </View>
          <View className='tab-item mystery'>
            神秘功能
            <View className='badge'>开发中</View>
          </View>
        </View>
      </View>

      {/* ===== 公告栏（可关闭）===== */}
      {showAnnouncement && (
        <View className='announcement-bar'>
          <View className='announcement-content'>
            <Text className='announcement-icon'>📢</Text>
            <Text className='announcement-text'>
              欢迎来到IEClub话题广场！发布「我来讲」吸引15人即可开讲
            </Text>
          </View>
          <View className='close-btn' onClick={() => setShowAnnouncement(false)}>
            ✕
          </View>
        </View>
      )}

      {/* ===== 分类筛选栏 ===== */}
      <View className='filter-bar'>
        <ScrollView className='category-scroll' scrollX>
          {CATEGORIES.map(cat => (
            <View
              key={cat}
              className={`category-item ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </View>
          ))}
        </ScrollView>

        {/* 排序按钮 */}
        <View className='sort-box'>
          <View
            className={`sort-btn ${sortBy === 'hot' ? 'active' : ''}`}
            onClick={() => setSortBy('hot')}
          >
            🔥 热门
          </View>
          <View
            className={`sort-btn ${sortBy === 'latest' ? 'active' : ''}`}
            onClick={() => setSortBy('latest')}
          >
            🕐 最新
          </View>
        </View>
      </View>

      {/* ===== 瀑布流话题列表 ===== */}
      <ScrollView className='topic-waterfall' scrollY>
        <View className='waterfall-container'>
          {topics.map((topic, index) => (
            <View
              key={topic.id}
              className={`topic-card ${index % 2 === 0 ? 'left' : 'right'}`}
              onClick={() => goToDetail(topic.id)}
            >
              {/* 封面图 */}
              {topic.cover && (
                <Image
                  className='topic-cover'
                  src={topic.cover}
                  mode='aspectFill'
                />
              )}

              {/* 话题类型标签 */}
              <View className={`type-badge ${topic.type}`}>
                {topic.type === 'supply' ? '💬 我来讲' : '🎯 想听'}
              </View>

              {/* 话题内容 */}
              <View className='topic-content'>
                <Text className='topic-title'>{topic.title}</Text>
                <Text className='topic-text'>{topic.content}</Text>

                {/* 标签 */}
                <View className='topic-tags'>
                  {topic.tags.slice(0, 2).map((tag, idx) => (
                    <Text key={idx} className='tag'>#{tag}</Text>
                  ))}
                </View>
              </View>

              {/* 作者信息 */}
              <View className='topic-author'>
                <Image
                  className='author-avatar'
                  src={topic.author.avatar}
                  mode='aspectFill'
                />
                <Text className='author-name'>{topic.author.nickname}</Text>
                <Text className='topic-time'>{topic.createdAt}</Text>
              </View>

              {/* 互动数据 */}
              <View className='topic-stats'>
                <View className='stat-item'>
                  <Text className='stat-icon'>❤️</Text>
                  <Text className='stat-text'>{topic.likesCount}</Text>
                </View>
                <View className='stat-item'>
                  {topic.type === 'supply' ? (
                    <>
                      <Text className='stat-icon'>👂</Text>
                      <Text className='stat-text'>{topic.wantToHearCount}人想听</Text>
                    </>
                  ) : (
                    <>
                      <Text className='stat-icon'>💪</Text>
                      <Text className='stat-text'>{topic.canHelpCount}人能讲</Text>
                    </>
                  )}
                </View>
              </View>

              {/* 快速操作按钮 */}
              <View className='quick-actions'>
                {topic.type === 'supply' ? (
                  <View
                    className='action-btn want-to-hear'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleQuickAction(topic.id, 'supply', 'wantToHear')
                    }}
                  >
                    👂 想听
                  </View>
                ) : (
                  <View
                    className='action-btn can-help'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleQuickAction(topic.id, 'demand', 'canHelp')
                    }}
                  >
                    💪 我能讲
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ===== 悬浮发布按钮（红底白加号）===== */}
      <View className='float-create-btn' onClick={goToCreate}>
        <Text className='plus-icon'>+</Text>
      </View>
    </View>
  )
}