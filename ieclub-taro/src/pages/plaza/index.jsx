import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

/**
 * 话题广场 - 核心功能页
 * 包含：我来讲、想听、项目宣传
 */
export default class PlazaPage extends Component {
  
  state = {
    activeTab: 'offer', // offer, demand, project
    topics: []
  }

  componentDidMount() {
    console.log('[Plaza] Page mounted')
    this.loadTopics()
  }

  loadTopics() {
    // 模拟数据
    const mockTopics = [
      {
        id: 1,
        type: 'offer',
        title: '线性代数期末重点串讲',
        author: '张同学',
        participants: 8,
        targetCount: 15,
        tags: ['数学', '期末复习']
      },
      {
        id: 2,
        type: 'demand',
        title: '求Python数据分析入门指导',
        author: '李同学',
        matches: 3,
        tags: ['Python', '数据分析']
      },
      {
        id: 3,
        type: 'project',
        title: 'AI学习助手项目招募',
        author: '王同学',
        team: 3,
        needed: 5,
        tags: ['AI', '创业']
      }
    ]
    
    this.setState({ topics: mockTopics })
  }

  switchTab = (tab) => {
    this.setState({ activeTab: tab })
  }

  handleTopicClick = (topic) => {
    Taro.showToast({
      title: `点击了：${topic.title}`,
      icon: 'none'
    })
  }

  render() {
    const { activeTab, topics } = this.state
    
    const filteredTopics = topics.filter(t => t.type === activeTab)

    return (
      <View className="plaza-page">
        {/* 顶部Tab */}
        <View className="tab-bar">
          <View 
            className={`tab-item ${activeTab === 'offer' ? 'active' : ''}`}
            onClick={() => this.switchTab('offer')}
          >
            <Text>🎤 我来讲</Text>
          </View>
          <View 
            className={`tab-item ${activeTab === 'demand' ? 'active' : ''}`}
            onClick={() => this.switchTab('demand')}
          >
            <Text>👂 想听</Text>
          </View>
          <View 
            className={`tab-item ${activeTab === 'project' ? 'active' : ''}`}
            onClick={() => this.switchTab('project')}
          >
            <Text>🚀 项目</Text>
          </View>
        </View>

        {/* 话题列表 */}
        <ScrollView scrollY className="topic-list">
          {filteredTopics.map(topic => (
            <View 
              key={topic.id}
              className="topic-card"
              onClick={() => this.handleTopicClick(topic)}
            >
              <Text className="topic-title">{topic.title}</Text>
              <Text className="topic-author">发布者：{topic.author}</Text>
              
              {topic.type === 'offer' && (
                <Text className="topic-stat">
                  {topic.participants}/{topic.targetCount} 人想听
                </Text>
              )}
              
              {topic.type === 'demand' && (
                <Text className="topic-stat">
                  {topic.matches} 个匹配
                </Text>
              )}
              
              {topic.type === 'project' && (
                <Text className="topic-stat">
                  团队 {topic.team}/{topic.needed}
                </Text>
              )}

              <View className="topic-tags">
                {topic.tags.map((tag, idx) => (
                  <Text key={idx} className="tag">{tag}</Text>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* 发布按钮 */}
        <View className="fab" onClick={() => Taro.showToast({title: '发布功能', icon: 'none'})}>
          <Text>+</Text>
        </View>
      </View>
    )
  }
}

