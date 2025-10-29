import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { usePlazaStore } from '../../store'
import './index.scss'

// 话题卡片组件
function TopicCard({ topic }) {
  const typeConfig = {
    offer: { gradient: 'from-blue-400 to-blue-600', icon: '🎤', label: '我来讲' },
    demand: { gradient: 'from-pink-400 to-pink-600', icon: '👂', label: '想听' },
    project: { gradient: 'from-orange-400 to-orange-600', icon: '🚀', label: '项目' }
  }
  const config = typeConfig[topic.type]

  const handleClick = () => {
    Taro.showToast({
      title: `点击了: ${topic.title}`,
      icon: 'none',
      duration: 2000
    })
  }

  return (
    <View className="topic-card" onClick={handleClick}>
      <View className={`topic-cover ${config.gradient}`}>
        <Text className="topic-emoji">{topic.cover}</Text>
        <View className="topic-type-badge">
          <Text className="badge-icon">{config.icon}</Text>
          <Text className="badge-label">{config.label}</Text>
        </View>
      </View>
      
      <View className="topic-content">
        <Text className="topic-title">{topic.title}</Text>
        
        <View className="topic-author">
          <Text className="author-emoji">{topic.author.avatar}</Text>
          <Text className="author-name">{topic.author.name}</Text>
          <View className="author-level">
            <Text className="level-text">LV{topic.author.level}</Text>
          </View>
        </View>

        <View className="topic-stats">
          <View className="stat-item">
            <Text className="stat-icon">❤️</Text>
            <Text className="stat-text">{topic.stats.likes}</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-icon">💬</Text>
            <Text className="stat-text">{topic.stats.comments}</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-icon">👀</Text>
            <Text className="stat-text">{topic.stats.views}</Text>
          </View>
        </View>

        {topic.type === 'demand' && topic.stats.wantCount && (
          <View className="want-count">
            <Text className="want-text">{topic.stats.wantCount}/15人想听</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default function PlazaPage() {
  const { topics } = usePlazaStore()
  const [activeTab, setActiveTab] = useState('all')

  const filteredTopics = activeTab === 'all' 
    ? topics 
    : topics.filter(t => t.type === activeTab)

  // 分成两列
  const leftColumn = filteredTopics.filter((_, i) => i % 2 === 0)
  const rightColumn = filteredTopics.filter((_, i) => i % 2 === 1)

  return (
    <View className="plaza-page">
      {/* Tab 切换栏 */}
      <View className="tab-bar">
        {[
          { id: 'all', label: '推荐', icon: '✨' },
          { id: 'offer', label: '我来讲', icon: '🎤' },
          { id: 'demand', label: '想听', icon: '👂' },
          { id: 'project', label: '项目', icon: '🚀' }
        ].map(tab => (
          <View
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Text className="tab-icon">{tab.icon}</Text>
            <Text className="tab-label">{tab.label}</Text>
          </View>
        ))}
      </View>

      {/* 瀑布流布局 */}
      <ScrollView scrollY className="topic-list">
        <View className="waterfall-container">
          <View className="waterfall-column">
            {leftColumn.map(topic => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </View>
          <View className="waterfall-column">
            {rightColumn.map(topic => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
