import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface Community {
  id: string
  name: string
  description: string
  avatar: string
  memberCount: number
  topicCount: number
  tags: string[]
  isJoined: boolean
}

export default function Community() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [activeTab, setActiveTab] = useState('recommend')

  useEffect(() => {
    loadCommunities()
  }, [])

  const loadCommunities = async () => {
    // Mock数据
    const mockData: Community[] = [
      {
        id: '1',
        name: '高数学习小组',
        description: '一起攻克高数难题，分享学习心得',
        avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=math',
        memberCount: 1234,
        topicCount: 567,
        tags: ['学习', '数学'],
        isJoined: false
      },
      {
        id: '2',
        name: '创业交流社',
        description: '分享创业经验，寻找合作伙伴',
        avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=startup',
        memberCount: 856,
        topicCount: 423,
        tags: ['创业', '项目'],
        isJoined: true
      },
      {
        id: '3',
        name: '前端开发者',
        description: '前端技术交流，项目实战分享',
        avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=frontend',
        memberCount: 2341,
        topicCount: 1234,
        tags: ['技术', '前端'],
        isJoined: false
      }
    ]
    setCommunities(mockData)
  }

  const handleJoin = (e: any, id: string) => {
    e.stopPropagation()
    setCommunities(communities.map(c => 
      c.id === id ? { ...c, isJoined: !c.isJoined } : c
    ))
    Taro.showToast({
      title: '操作成功',
      icon: 'success'
    })
  }

  const goToDetail = (id: string) => {
    console.log('进入社区', id)
  }

  return (
    <View className='community-page'>
      {/* 顶部导航栏 */}
      <View className='nav-bar'>
        <Text className='title'>社区</Text>
      </View>

      {/* 标签栏 */}
      <View className='tab-bar'>
        <View 
          className={`tab-item ${activeTab === 'recommend' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommend')}
        >
          <Text>推荐</Text>
        </View>
        <View 
          className={`tab-item ${activeTab === 'joined' ? 'active' : ''}`}
          onClick={() => setActiveTab('joined')}
        >
          <Text>已加入</Text>
        </View>
      </View>

      {/* 社区列表 */}
      <ScrollView className='content' scrollY>
        <View className='community-list'>
          {communities.map(community => (
            <View 
              key={community.id}
              className='community-card'
              onClick={() => goToDetail(community.id)}
            >
              <Image 
                src={community.avatar}
                className='avatar'
                mode='aspectFill'
              />
              <View className='info'>
                <View className='name'>{community.name}</View>
                <View className='description'>{community.description}</View>
                <View className='tags'>
                  {community.tags.map((tag, index) => (
                    <View key={index} className='tag'>#{tag}</View>
                  ))}
                </View>
                <View className='stats'>
                  <Text>{community.memberCount} 成员</Text>
                  <Text className='divider'>·</Text>
                  <Text>{community.topicCount} 话题</Text>
                </View>
              </View>
              <View 
                className={`join-btn ${community.isJoined ? 'joined' : ''}`}
                onClick={(e) => handleJoin(e, community.id)}
              >
                {community.isJoined ? '已加入' : '加入'}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
