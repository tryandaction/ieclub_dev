import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface Activity {
  id: string
  title: string
  description: string
  cover: string
  startTime: string
  endTime: string
  location: string
  participants: number
  maxParticipants: number
  organizer: {
    nickname: string
    avatar: string
  }
  status: 'upcoming' | 'ongoing' | 'ended'
  tags: string[]
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    // Mock数据
    const mockData: Activity[] = [
      {
        id: '1',
        title: '创业项目路演分享会',
        description: '邀请优秀创业团队分享项目经验，探讨创业路上的机遇与挑战',
        cover: 'https://picsum.photos/800/400?random=10',
        startTime: '2024-10-28T14:00:00Z',
        endTime: '2024-10-28T17:00:00Z',
        location: '创业园一楼会议室',
        participants: 45,
        maxParticipants: 100,
        organizer: {
          nickname: '创业俱乐部',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=org1'
        },
        status: 'upcoming',
        tags: ['创业', '路演']
      },
      {
        id: '2',
        title: '高数期末复习讲座',
        description: '资深助教带你梳理高数重点，攻克期末难题',
        cover: 'https://picsum.photos/800/400?random=11',
        startTime: '2024-10-26T19:00:00Z',
        endTime: '2024-10-26T21:00:00Z',
        location: '教学楼A201',
        participants: 78,
        maxParticipants: 150,
        organizer: {
          nickname: '数学学习社',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=org2'
        },
        status: 'ongoing',
        tags: ['学习', '讲座']
      }
    ]
    setActivities(mockData)
  }

  const formatDate = (time: string) => {
    const date = new Date(time)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      upcoming: { text: '即将开始', color: '#5B7FFF' },
      ongoing: { text: '进行中', color: '#FFA500' },
      ended: { text: '已结束', color: '#999' }
    }
    return statusMap[status] || statusMap.upcoming
  }

  const handleJoin = (e: any, id: string) => {
    e.stopPropagation()
    Taro.showToast({
      title: '报名成功',
      icon: 'success'
    })
  }

  const goToDetail = (id: string) => {
    console.log('查看活动详情', id)
  }

  return (
    <View className='activities-page'>
      {/* 顶部导航栏 */}
      <View className='nav-bar'>
        <Text className='title'>活动</Text>
        <View className='nav-right' onClick={() => console.log('创建活动')}>
          <View className='iconify-icon' data-icon='mdi:plus-circle-outline' />
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
          className={`tab-item ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <Text>即将开始</Text>
        </View>
        <View 
          className={`tab-item ${activeTab === 'joined' ? 'active' : ''}`}
          onClick={() => setActiveTab('joined')}
        >
          <Text>我参加的</Text>
        </View>
      </View>

      {/* 活动列表 */}
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
              
              <View 
                className='status-badge'
                style={{ background: getStatusText(activity.status).color }}
              >
                {getStatusText(activity.status).text}
              </View>

              <View className='card-content'>
                <View className='title'>{activity.title}</View>
                <View className='description'>{activity.description}</View>

                <View className='info-row'>
                  <View className='info-item'>
                    <View className='iconify-icon' data-icon='mdi:clock-outline' />
                    <Text>{formatDate(activity.startTime)}</Text>
                  </View>
                  <View className='info-item'>
                    <View className='iconify-icon' data-icon='mdi:map-marker' />
                    <Text>{activity.location}</Text>
                  </View>
                </View>

                <View className='tags'>
                  {activity.tags.map((tag, index) => (
                    <View key={index} className='tag'>#{tag}</View>
                  ))}
                </View>

                <View className='footer'>
                  <View className='organizer'>
                    <Image 
                      src={activity.organizer.avatar}
                      className='avatar'
                      mode='aspectFill'
                    />
                    <Text>{activity.organizer.nickname}</Text>
                  </View>

                  <View className='participants'>
                    <Text>{activity.participants}/{activity.maxParticipants}人</Text>
                  </View>

                  <View 
                    className='join-btn'
                    onClick={(e) => handleJoin(e, activity.id)}
                  >
                    报名
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
