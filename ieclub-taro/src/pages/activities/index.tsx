import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface Activity {
  id: string
  title: string
  description: string
  cover: string
  location: string
  startTime: string
  maxParticipants: number
  participantsCount: number
  organizer: {
    nickname: string
    avatar: string
  }
  tags: string[]
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    const mockActivities: Activity[] = [
      {
        id: '1',
        title: '高等数学期末串讲',
        description: '覆盖微积分、级数、多元函数等核心考点，带你突破高数难关！',
        cover: 'https://picsum.photos/800/400?random=10',
        location: '图书馆301讨论室',
        startTime: '2024-10-28T14:00:00Z',
        maxParticipants: 30,
        participantsCount: 18,
        organizer: {
          nickname: '数学小天才',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=10'
        },
        tags: ['学习', '数学', '期末']
      },
      {
        id: '2',
        title: 'Python爬虫实战工作坊',
        description: '从零开始学习Python爬虫，完成一个完整的爬虫项目',
        cover: 'https://picsum.photos/800/400?random=11',
        location: '实验楼B201机房',
        startTime: '2024-10-29T09:00:00Z',
        maxParticipants: 25,
        participantsCount: 23,
        organizer: {
          nickname: '代码侠',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=11'
        },
        tags: ['编程', '技能', 'Python']
      }
    ]
    setActivities(mockActivities)
  }

  const goToDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/activities/detail/index?id=${id}` })
  }

  const handleJoin = (e: any, id: string) => {
    e.stopPropagation()
    Taro.showToast({
      title: '报名成功！',
      icon: 'success'
    })
  }

  const formatDate = (time: string) => {
    const date = new Date(time)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    return `${month}月${day}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  return (
    <View className='activities-page'>
      <View className='nav-bar'>
        <Text className='title'>活动</Text>
        <View className='nav-right'>
          <View className='nav-icon' onClick={() => Taro.navigateTo({ url: '/pages/activities/create/index' })}>
            <View className='iconify-icon' data-icon='mdi:plus' />
          </View>
        </View>
      </View>

      <View className='tab-bar'>
        <View 
          className={`tab-item ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <Text>即将开始</Text>
        </View>
        <View 
          className={`tab-item ${activeTab === 'ongoing' ? 'active' : ''}`}
          onClick={() => setActiveTab('ongoing')}
        >
          <Text>进行中</Text>
        </View>
        <View 
          className={`tab-item ${activeTab === 'ended' ? 'active' : ''}`}
          onClick={() => setActiveTab('ended')}
        >
          <Text>已结束</Text>
        </View>
      </View>

      <ScrollView className='content' scrollY>
        <View className='activity-list'>
          {activities.map(activity => (
            <View 
              key={activity.id} 
              className='activity-card'
              onClick={() => goToDetail(activity.id)}
            >
              <Image 
                src={activity.cover} 
                className='cover'
                mode='aspectFill'
              />

              <View className='card-content'>
                <View className='card-title'>{activity.title}</View>
                <View className='card-desc'>{activity.description}</View>

                <View className='info-row'>
                  <View className='info-item'>
                    <View className='iconify-icon' data-icon='mdi:clock-outline' />
                    <Text>{formatDate(activity.startTime)}</Text>
                  </View>
                  <View className='info-item'>
                    <View className='iconify-icon' data-icon='mdi:map-marker-outline' />
                    <Text>{activity.location}</Text>
                  </View>
                </View>

                <View className='card-footer'>
                  <View className='organizer'>
                    <Image 
                      src={activity.organizer.avatar} 
                      className='avatar'
                      mode='aspectFill'
                    />
                    <Text className='nickname'>{activity.organizer.nickname}</Text>
                  </View>

                  <View className='participants'>
                    <Text className='count'>{activity.participantsCount}/{activity.maxParticipants}</Text>
                    <View 
                      className='join-btn'
                      onClick={(e) => handleJoin(e, activity.id)}
                    >
                      报名
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
