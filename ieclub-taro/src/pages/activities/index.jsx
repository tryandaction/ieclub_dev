/**
 * IEClub 活动页面
 * 展示活动列表、报名等功能
 */
import React, { useState, useEffect } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { formatTime, formatNumber } from '../../utils'

const ActivitiesPage = () => {
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setIsMore] = useState(true)
  
  // 模拟活动数据
  const mockActivities = [
    {
      id: 1,
      title: '跨学科创新论坛',
      subtitle: 'AI时代的教育变革',
      time: '2024-11-01 14:00',
      endTime: '2024-11-01 17:00',
      location: '慧园报告厅',
      participants: 45,
      maxParticipants: 100,
      organizer: '张明',
      category: '学术讲座',
      description: '探讨人工智能在教育领域的应用与挑战',
      isJoined: false
    },
    {
      id: 2,
      title: 'Python数据分析工作坊',
      subtitle: '从入门到实战',
      time: '2024-11-02 10:00',
      endTime: '2024-11-02 12:00',
      location: '图书馆204',
      participants: 28,
      maxParticipants: 30,
      organizer: '李思',
      category: '技能培训',
      description: '学习使用Python进行数据分析和可视化',
      isJoined: false
    },
    {
      id: 3,
      title: 'UI设计工作坊',
      subtitle: '用户体验设计',
      time: '2024-11-03 15:00',
      endTime: '2024-11-03 17:00',
      location: '设计学院',
      participants: 15,
      maxParticipants: 20,
      organizer: '王浩',
      category: '技能培训',
      description: '学习现代UI设计理念和工具使用',
      isJoined: true
    },
    {
      id: 4,
      title: '科研项目展示',
      subtitle: '成果分享会',
      time: '2024-11-04 19:00',
      endTime: '2024-11-04 21:00',
      location: '实验室',
      participants: 8,
      maxParticipants: 15,
      organizer: '赵六',
      category: '科研分享',
      description: '展示最新的科研成果和项目进展',
      isJoined: false
    }
  ]
  
  // 页面加载时获取活动
  useEffect(() => {
    fetchActivities(true)
  }, [])
  
  // 获取活动列表
  const fetchActivities = async (reset = false) => {
    setIsLoading(true)
    
    // 模拟API调用
    setTimeout(() => {
      if (reset) {
        setActivities(mockActivities)
      } else {
        setActivities(prev => [...prev, ...mockActivities])
      }
      setIsMore(false)
      setIsLoading(false)
    }, 1000)
  }
  
  // 加载更多
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchActivities(false)
    }
  }
  
  // 报名/取消报名
  const handleJoin = (activityId, isJoined) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              isJoined: !isJoined,
              participants: isJoined 
                ? activity.participants - 1 
                : activity.participants + 1
            }
          : activity
      )
    )
  }
  
  // 活动点击
  const handleActivityClick = (activity) => {
    console.log('点击活动:', activity.title)
    // TODO: 跳转到活动详情页
  }
  
  return (
    <MainLayout title="活动">
      <div className="max-w-screen-2xl mx-auto p-4 lg:p-6">
        {/* 活动列表 - 响应式网格布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {activities.map((activity) => (
            <Card
              key={activity.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => handleActivityClick(activity)}
            >
              {/* 活动头部 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {activity.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {activity.subtitle}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Icon icon={ICONS.event} size="sm" className="mr-1" />
                    {activity.category}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.isJoined 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {activity.isJoined ? '已报名' : '可报名'}
                </div>
              </div>
              
              {/* 活动信息 */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">🕐</span>
                  {formatTime(activity.time, 'MM-DD HH:mm')} - {formatTime(activity.endTime, 'HH:mm')}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📍</span>
                  {activity.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">👥</span>
                  {activity.participants}/{activity.maxParticipants}人
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">👤</span>
                  组织者：{activity.organizer}
                </div>
              </div>
              
              {/* 活动描述 */}
              <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                {activity.description}
              </p>
              
              {/* 报名按钮 */}
              <Button
                variant={activity.isJoined ? 'secondary' : 'primary'}
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleJoin(activity.id, activity.isJoined)
                }}
                disabled={!activity.isJoined && activity.participants >= activity.maxParticipants}
              >
                {activity.isJoined 
                  ? '取消报名' 
                  : activity.participants >= activity.maxParticipants 
                    ? '已满员' 
                    : '立即报名'
                }
              </Button>
            </Card>
          ))}
        </div>
        
        {/* 加载更多 */}
        {hasMore && (
          <div className="col-span-full text-center mt-6">
            <Button
              variant="outline"
              loading={isLoading}
              onClick={handleLoadMore}
              className="w-full lg:w-auto lg:px-12"
            >
              {isLoading ? '加载中...' : '加载更多'}
            </Button>
          </div>
        )}
        
        {/* 空状态 */}
        {!isLoading && activities.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg mb-2">暂无活动</p>
            <p className="text-gray-400 text-sm">快来发现更多精彩活动吧！</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default ActivitiesPage
