import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface CommunityItem {
  id: string
  name: string
  description: string
  memberCount: number
  topicCount: number
  icon: string
  color: string
}

export default function Community() {
  const [communities, setCommunities] = useState<CommunityItem[]>([])

  useEffect(() => {
    loadCommunities()
  }, [])

  const loadCommunities = () => {
    // Mock数据 - 展示不同的社区
    const mockCommunities: CommunityItem[] = [
      {
        id: '1',
        name: '学习交流',
        description: '分享学习经验，互帮互助',
        memberCount: 1234,
        topicCount: 567,
        icon: '📚',
        color: '#5B7FFF'
      },
      {
        id: '2',
        name: '创业项目',
        description: '创业想法交流，寻找合作伙伴',
        memberCount: 892,
        topicCount: 234,
        icon: '💡',
        color: '#FFA500'
      },
      {
        id: '3',
        name: '技术分享',
        description: '技术讨论，代码交流',
        memberCount: 2156,
        topicCount: 891,
        icon: '💻',
        color: '#00C853'
      },
      {
        id: '4',
        name: '竞赛组队',
        description: '各类竞赛信息，组队招募',
        memberCount: 678,
        topicCount: 145,
        icon: '🏆',
        color: '#FF6B9D'
      },
      {
        id: '5',
        name: '生活分享',
        description: '校园生活，兴趣爱好',
        memberCount: 3421,
        topicCount: 1234,
        icon: '🌟',
        color: '#9C27B0'
      },
      {
        id: '6',
        name: '求职招聘',
        description: '实习内推，求职经验分享',
        memberCount: 1567,
        topicCount: 423,
        icon: '💼',
        color: '#FF5722'
      }
    ]
    
    setCommunities(mockCommunities)
  }

  const goToCommunity = (id: string) => {
    Taro.showToast({
      title: '社区详情开发中',
      icon: 'none'
    })
  }

  return (
    <View className='community-page'>
      <View className='nav-bar'>
        <Text className='title'>社区</Text>
      </View>
      
      <ScrollView className='content' scrollY>
        <View className='community-grid'>
          {communities.map(community => (
            <View
              key={community.id}
              className='community-card'
              onClick={() => goToCommunity(community.id)}
              style={{ borderLeftColor: community.color }}
            >
              <View className='card-header'>
                <View className='icon' style={{ background: community.color }}>
                  {community.icon}
                </View>
                <View className='info'>
                  <Text className='name'>{community.name}</Text>
                  <Text className='description'>{community.description}</Text>
                </View>
              </View>
              
              <View className='card-footer'>
                <View className='stat'>
                  <Text className='stat-value'>{community.memberCount}</Text>
                  <Text className='stat-label'>成员</Text>
                </View>
                <View className='stat'>
                  <Text className='stat-value'>{community.topicCount}</Text>
                  <Text className='stat-label'>话题</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        
        <View className='create-hint'>
          <Text className='hint-text'>更多社区功能正在开发中...</Text>
        </View>
      </ScrollView>
    </View>
  )
}
