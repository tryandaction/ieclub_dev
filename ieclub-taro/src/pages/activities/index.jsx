/**
 * IEClub 活动页面
 * 完全按照设计文档实现 - 活动卡片完整信息
 */
import React, { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import MainLayout from '../../components/layout/MainLayout'
import Card from '../../components/common/Card'
import { formatTime, formatNumber } from '../../utils'

const ActivitiesPage = () => {
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  
  // 模拟数据
  const mockActivities = [
    {
      id: 1,
      title: '跨学科创新论坛',
      subtitle: 'AI时代的教育变革',
      emoji: '🎤',
      time: '2025-10-15 14:00',
      endTime: '2025-10-15 17:00',
      location: '慧园报告厅',
      participants: 45,
      maxParticipants: 100,
      organizer: '学生会',
      description: '探讨人工智能对教育领域的影响，邀请多位专家学者分享见解',
      isJoined: false,
      status: 'upcoming' // upcoming, ongoing, finished
    },
    {
      id: 2,
      title: 'Python数据分析工作坊',
      subtitle: '从入门到实战',
      emoji: '💻',
      time: '2025-10-20 19:00',
      endTime: '2025-10-20 21:00',
      location: '图书馆204',
      participants: 28,
      maxParticipants: 30,
      organizer: '计算机系',
      description: '实战演练数据处理、可视化和机器学习基础',
      isJoined: true,
      status: 'upcoming'
    },
    {
      id: 3,
      title: 'UI设计工作坊',
      subtitle: '用户体验设计实践',
      emoji: '🎨',
      time: '2025-10-25 15:00',
      endTime: '2025-10-25 18:00',
      location: '设计学院',
      participants: 15,
      maxParticipants: 20,
      organizer: '设计协会',
      description: '学习Figma工具使用，完成一个完整的APP设计',
      isJoined: false,
      status: 'upcoming'
    },
    {
      id: 4,
      title: '科研项目展示会',
      subtitle: '学生创新成果分享',
      emoji: '🔬',
      time: '2025-10-30 16:00',
      endTime: '2025-10-30 18:00',
      location: '实验室大厅',
      participants: 8,
      maxParticipants: 15,
      organizer: '科研处',
      description: '展示本学期优秀学生科研项目和创新成果',
      isJoined: false,
      status: 'upcoming'
    },
    {
      id: 5,
      title: '校园音乐分享会',
      subtitle: '音乐与生活',
      emoji: '🎵',
      time: '2025-11-01 20:00',
      endTime: '2025-11-01 22:00',
      location: '音乐厅',
      participants: 20,
      maxParticipants: 30,
      organizer: '音乐社',
      description: '分享音乐创作心得，现场演奏交流',
      isJoined: false,
      status: 'upcoming'
    },
    {
      id: 6,
      title: '晨跑健身团',
      subtitle: '健康生活从早晨开始',
      emoji: '🏃‍♂️',
      time: '2025-11-05 06:30',
      endTime: '2025-11-05 07:30',
      location: '学校操场',
      participants: 12,
      maxParticipants: 20,
      organizer: '体育部',
      description: '每周定期晨跑活动，强身健体结交朋友',
      isJoined: false,
      status: 'upcoming'
    }
  ]
  
  useEffect(() => {
    setActivities(mockActivities)
  }, [])
  
  // 活动点击
  const handleActivityClick = (activity) => {
    Taro.showToast({
      title: `查看活动：${activity.title}`,
      icon: 'none'
    })
  }
  
  // 报名
  const handleJoin = (e, activityId) => {
    e.stopPropagation()
    setActivities(activities.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          isJoined: !activity.isJoined,
          participants: activity.isJoined ? activity.participants - 1 : activity.participants + 1
        }
      }
      return activity
    }))
    Taro.showToast({
      title: activities.find(a => a.id === activityId)?.isJoined ? '已取消报名' : '报名成功',
      icon: 'success'
    })
  }
  
  // 加载更多
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        setHasMore(false)
      }, 1000)
    }
  }
  
  return (
      <MainLayout title="活动">
        <div className="w-full mx-auto px-3 py-4 lg:px-8 lg:py-6">
        {/* 活动列表 - 响应式网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => handleActivityClick(activity)}
            >
              {/* 活动头部 - 带emoji的渐变背景 */}
              <div className="relative h-32 bg-gradient-to-br from-purple-400 via-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-6xl opacity-90">{activity.emoji}</span>
                {activity.isJoined && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-purple-600">
                    已报名
                  </div>
                )}
              </div>
              
              {/* 活动内容 */}
              <div className="p-4">
                {/* 标题 */}
                <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">
                  {activity.title}
                </h3>
                <p className="text-xs text-gray-600 mb-3 line-clamp-1">
                  {activity.subtitle}
                </p>
                
                {/* 活动信息 - 按文档要求 */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-xs text-gray-600">
                    <span className="mr-2">🕐</span>
                    <span className="line-clamp-1">
                      {formatTime(activity.time, 'MM-DD HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <span className="mr-2">📍</span>
                    <span className="line-clamp-1">{activity.location}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <span className="mr-2">👥</span>
                    <span>
                      {activity.participants}/{activity.maxParticipants}人
                    </span>
                  </div>
                </div>
                
                {/* 报名按钮 - 按文档设计 */}
                <button
                  onClick={(e) => handleJoin(e, activity.id)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                    activity.isJoined
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : activity.participants >= activity.maxParticipants
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                  }`}
                  disabled={!activity.isJoined && activity.participants >= activity.maxParticipants}
                >
                  {activity.isJoined 
                    ? '已报名' 
                    : activity.participants >= activity.maxParticipants 
                    ? '已满员' 
                    : '立即报名'}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* 加载更多 */}
        {hasMore && activities.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-12 py-3.5 bg-white border-2 border-purple-200 text-purple-600 rounded-2xl font-bold text-base hover:bg-purple-50 hover:border-purple-300 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
        
        {/* 空状态 */}
        {activities.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="text-7xl mb-6">📅</div>
            <p className="text-xl font-bold text-gray-900 mb-2">暂无活动</p>
            <p className="text-gray-500">快来发现更多精彩活动吧！</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default ActivitiesPage
