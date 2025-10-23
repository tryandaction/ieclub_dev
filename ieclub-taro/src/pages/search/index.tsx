// src/pages/search/index.tsx - 高级搜索页面

import { View, Text, Input, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

// 使用统一的API配置
import { getApiBaseUrl } from '@/utils/api-config'

// 搜索类型
const SEARCH_TYPES = [
  { key: 'all', label: '全部', icon: '🔍' },
  { key: 'topics', label: '话题', icon: '📝' },
  { key: 'users', label: '用户', icon: '👤' },
  { key: 'projects', label: '项目', icon: '🚀' },
  { key: 'tags', label: '标签', icon: '🏷️' }
]

// 热门搜索
const HOT_SEARCHES = [
  'GPT-4', 'React', 'AI教育', '前端开发', 'Python',
  '创业', '机器学习', 'UI设计', 'Node.js', '数据分析'
]

export default function SearchPage() {
  const [searchType, setSearchType] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [activeFilter, setActiveFilter] = useState('relevant') // relevant, latest, hot

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '搜索' })
    // 加载搜索历史
    const history = Taro.getStorageSync('searchHistory') || []
    setSearchHistory(history)
  }, [])

  // 执行搜索
  const handleSearch = async (searchKeyword?: string) => {
    const kw = searchKeyword || keyword
    if (!kw.trim()) {
      Taro.showToast({ title: '请输入搜索内容', icon: 'none' })
      return
    }

    setIsSearching(true)

    try {
      const results: any = {
        topics: [],
        users: [],
        projects: [],
        tags: []
      }

      // 根据搜索类型调用不同的API
      if (searchType === 'all' || searchType === 'topics') {
        const topicsRes = await Taro.request({
          url: `${getApiBaseUrl()}/search/topics`,
          method: 'GET',
          data: {
            q: kw,
            sortBy: activeFilter === 'hot' ? 'hot' : activeFilter === 'latest' ? 'new' : 'relevance',
            page: 1,
            limit: 20
          }
        })

        if (topicsRes.data.success) {
          results.topics = topicsRes.data.data.topics.map((topic: any) => ({
            id: topic.id,
            type: topic.topicType === 'discussion' ? 'supply' : 'demand',
            title: topic.title,
            content: topic.content,
            author: topic.author,
            cover: topic.images?.[0] || null,
            category: topic.category,
            tags: topic.tags || [],
            likesCount: topic.likesCount || 0,
            commentsCount: topic.commentsCount || 0,
            createdAt: topic.createdAt
          }))
        }
      }

      if (searchType === 'all' || searchType === 'users') {
        const usersRes = await Taro.request({
          url: `${getApiBaseUrl()}/search/users`,
          method: 'GET',
          data: {
            q: kw,
            page: 1,
            limit: 20
          }
        })

        if (usersRes.data.success) {
          results.users = usersRes.data.data.users.map((user: any) => ({
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            bio: user.bio,
            tags: user.skills || [],
            followersCount: user._count?.followers || 0,
            topicsCount: user._count?.topics || 0
          }))
        }
      }

      setResults(results)

      // 保存搜索历史
      saveSearchHistory(kw)

    } catch (error: any) {
      console.error('搜索失败:', error)
      Taro.showToast({ 
        title: error.data?.message || '搜索失败', 
        icon: 'none' 
      })
    } finally {
      setIsSearching(false)
    }
  }

  // 保存搜索历史
  const saveSearchHistory = (kw: string) => {
    const newHistory = [kw, ...searchHistory.filter(h => h !== kw)].slice(0, 10)
    setSearchHistory(newHistory)
    Taro.setStorageSync('searchHistory', newHistory)
  }

  // 清空搜索历史
  const clearHistory = () => {
    Taro.showModal({
      title: '提示',
      content: '确定清空搜索历史？',
      success: (res) => {
        if (res.confirm) {
          setSearchHistory([])
          Taro.removeStorageSync('searchHistory')
        }
      }
    })
  }

  // 点击热门搜索
  const handleHotSearch = (word: string) => {
    setKeyword(word)
    handleSearch(word)
  }

  // 点击搜索历史
  const handleHistoryClick = (word: string) => {
    setKeyword(word)
    handleSearch(word)
  }

  // 跳转到详情页
  const goToDetail = (type: string, id: string) => {
    if (type === 'topic') {
      Taro.navigateTo({ url: `/pages/topics/detail/index?id=${id}` })
    } else if (type === 'user') {
      Taro.navigateTo({ url: `/pages/profile/index?id=${id}` })
    }
  }

  return (
    <View className='search-page'>
      {/* ===== 搜索栏 ===== */}
      <View className='search-bar'>
        <View className='search-input-box'>
          <Text className='search-icon'>🔍</Text>
          <Input
            className='search-input'
            placeholder='搜索话题、用户、项目...'
            value={keyword}
            id='search-keyword'
            name='keyword'
            onInput={(e) => setKeyword(e.detail.value)}
            onConfirm={() => handleSearch()}
            focus
          />
          {keyword && (
            <Text className='clear-btn' onClick={() => setKeyword('')}>✕</Text>
          )}
        </View>
        <Text className='search-btn' onClick={() => handleSearch()}>搜索</Text>
      </View>

      {/* ===== 搜索类型切换 ===== */}
      <View className='type-tabs'>
        <ScrollView className='tabs-scroll' scrollX>
          {SEARCH_TYPES.map(type => (
            <View
              key={type.key}
              className={`type-tab ${searchType === type.key ? 'active' : ''}`}
              onClick={() => setSearchType(type.key)}
            >
              <Text className='type-icon'>{type.icon}</Text>
              <Text className='type-label'>{type.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView className='content-area' scrollY>
        {/* ===== 搜索前：历史和热门 ===== */}
        {!results && (
          <View className='search-suggestions'>
            {/* 搜索历史 */}
            {searchHistory.length > 0 && (
              <View className='history-section'>
                <View className='section-header'>
                  <Text className='section-title'>🕐 搜索历史</Text>
                  <Text className='clear-text' onClick={clearHistory}>清空</Text>
                </View>
                <View className='history-list'>
                  {searchHistory.map((word, index) => (
                    <View
                      key={index}
                      className='history-item'
                      onClick={() => handleHistoryClick(word)}
                    >
                      {word}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 热门搜索 */}
            <View className='hot-section'>
              <View className='section-header'>
                <Text className='section-title'>🔥 热门搜索</Text>
              </View>
              <View className='hot-list'>
                {HOT_SEARCHES.map((word, index) => (
                  <View
                    key={index}
                    className='hot-item'
                    onClick={() => handleHotSearch(word)}
                  >
                    <Text className={`hot-rank ${index < 3 ? 'top' : ''}`}>
                      {index + 1}
                    </Text>
                    <Text className='hot-text'>{word}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ===== 搜索结果 ===== */}
        {results && (
          <View className='search-results'>
            {/* 筛选栏 */}
            <View className='filter-bar'>
              <View
                className={`filter-item ${activeFilter === 'relevant' ? 'active' : ''}`}
                onClick={() => setActiveFilter('relevant')}
              >
                综合
              </View>
              <View
                className={`filter-item ${activeFilter === 'latest' ? 'active' : ''}`}
                onClick={() => setActiveFilter('latest')}
              >
                最新
              </View>
              <View
                className={`filter-item ${activeFilter === 'hot' ? 'active' : ''}`}
                onClick={() => setActiveFilter('hot')}
              >
                最热
              </View>
            </View>

            {/* 话题结果 */}
            {(searchType === 'all' || searchType === 'topics') && results.topics && (
              <View className='results-section'>
                <Text className='section-title'>📝 话题 ({results.topics.length})</Text>
                {results.topics.map((topic: any) => (
                  <View
                    key={topic.id}
                    className='topic-result-item'
                    onClick={() => goToDetail('topic', topic.id)}
                  >
                    {topic.cover && (
                      <Image className='topic-cover' src={topic.cover} mode='aspectFill' />
                    )}
                    <View className='topic-info'>
                      <View className='topic-type-badge'>
                        {topic.type === 'supply' ? '💬 我来讲' : '🎯 想听'}
                      </View>
                      <Text className='topic-title'>
                        {highlightKeyword(topic.title, keyword)}
                      </Text>
                      <Text className='topic-content'>
                        {highlightKeyword(topic.content, keyword)}
                      </Text>
                      <View className='topic-footer'>
                        <Image
                          className='author-avatar'
                          src={topic.author.avatar}
                          mode='aspectFill'
                        />
                        <Text className='author-name'>{topic.author.nickname}</Text>
                        <Text className='topic-meta'>
                          ❤️ {topic.likesCount} · 💬 {topic.commentsCount}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 用户结果 */}
            {(searchType === 'all' || searchType === 'users') && results.users && (
              <View className='results-section'>
                <Text className='section-title'>👤 用户 ({results.users.length})</Text>
                {results.users.map((user: any) => (
                  <View
                    key={user.id}
                    className='user-result-item'
                    onClick={() => goToDetail('user', user.id)}
                  >
                    <Image className='user-avatar' src={user.avatar} mode='aspectFill' />
                    <View className='user-info'>
                      <Text className='user-nickname'>
                        {highlightKeyword(user.nickname, keyword)}
                      </Text>
                      <Text className='user-bio'>{user.bio}</Text>
                      <View className='user-tags'>
                        {user.tags.map((tag: string, index: number) => (
                          <Text key={index} className='tag'>#{tag}</Text>
                        ))}
                      </View>
                      <View className='user-stats'>
                        <Text className='stat-item'>{user.topicsCount} 话题</Text>
                        <Text className='stat-item'>{user.followersCount} 粉丝</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 项目结果 */}
            {(searchType === 'all' || searchType === 'projects') && results.projects && (
              <View className='results-section'>
                <Text className='section-title'>🚀 项目 ({results.projects.length})</Text>
                {results.projects.map((project: any) => (
                  <View key={project.id} className='project-result-item'>
                    <Image
                      className='project-cover'
                      src={project.cover}
                      mode='aspectFill'
                    />
                    <View className='project-info'>
                      <Text className='project-title'>
                        {highlightKeyword(project.title, keyword)}
                      </Text>
                      <Text className='project-desc'>{project.description}</Text>
                      <View className='project-tags'>
                        {project.tags.map((tag: string, index: number) => (
                          <Text key={index} className='tag'>#{tag}</Text>
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 标签结果 */}
            {(searchType === 'all' || searchType === 'tags') && results.tags && (
              <View className='results-section'>
                <Text className='section-title'>🏷️ 标签 ({results.tags.length})</Text>
                <View className='tags-grid'>
                  {results.tags.map((tag: any, index: number) => (
                    <View key={index} className='tag-result-item'>
                      <Text className='tag-name'>#{tag.name}</Text>
                      <Text className='tag-count'>{tag.count} 个话题</Text>
                      {tag.trend === 'up' && <Text className='tag-trend'>📈</Text>}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 空结果 */}
            {(!results.topics?.length && !results.users?.length &&
              !results.projects?.length && !results.tags?.length) && (
              <View className='empty-result'>
                <Text className='empty-icon'>🔍</Text>
                <Text className='empty-text'>未找到相关结果</Text>
                <Text className='empty-tip'>试试其他关键词吧</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

// 高亮关键词
function highlightKeyword(text: string, keyword: string) {
  if (!keyword) return text

  const regex = new RegExp(`(${keyword})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (part.toLowerCase() === keyword.toLowerCase()) {
      return `[${part}]` // 简化版高亮，实际应使用rich-text或自定义组件
    }
    return part
  }).join('')
}