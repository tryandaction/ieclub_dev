import { useState, useEffect } from 'react'
import { getActivities, toggleParticipation } from '../api/activities'
import { showToast } from '../components/Toast'
import { ActivityListSkeleton } from '../components/Skeleton'

const mockActivities = [
  {
    id: 1,
    title: 'Python数据分析工作坊',
    cover: '🐍',
    time: '明天 14:00-17:00',
    location: '图书馆301',
    participants: { current: 23, max: 30 },
    isParticipating: false,
  },
]

export default function Activities() {
  const [activities, setActivities] = useState(mockActivities)
  const [loading, setLoading] = useState(false)

  // 加载活动列表
  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const data = await getActivities()
      
      // 如果后端返回数据，使用后端数据；否则使用mock数据
      if (data && Array.isArray(data)) {
        setActivities(data)
      } else if (data && data.activities && Array.isArray(data.activities)) {
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('加载活动列表失败:', error)
      // 发生错误时继续使用mock数据
    } finally {
      setLoading(false)
    }
  }

  const handleParticipate = async (activityId) => {
    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录', 'warning')
      return
    }

    const activity = activities.find(a => a.id === activityId)
    if (!activity) return

    try {
      await toggleParticipation(activityId)
      
      // 更新本地状态
      setActivities(activities.map(a =>
        a.id === activityId 
          ? { 
              ...a, 
              isParticipating: !a.isParticipating,
              participants: {
                ...a.participants,
                current: a.isParticipating 
                  ? a.participants.current - 1 
                  : a.participants.current + 1
              }
            } 
          : a
      ))
      
      showToast(activity.isParticipating ? '已取消报名' : '报名成功 🎉', 'success')
    } catch (error) {
      console.error('操作失败:', error)
      showToast(error.response?.data?.message || '操作失败，请稍后重试', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-gradient-primary text-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">精彩活动</h1>
        <p className="text-white/90">参与活动，收获成长</p>
      </div>

      {/* 加载状态 - 骨架屏 */}
      {loading && <ActivityListSkeleton count={6} />}

      {/* 活动网格 */}
      {!loading && activities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
          <div key={activity.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
            {/* 封面 */}
            <div className="bg-gradient-to-br from-blue-400 to-purple-500 h-48 flex items-center justify-center">
              <span className="text-8xl">{activity.cover}</span>
            </div>

            {/* 内容 */}
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">{activity.title}</h3>

              <div className="space-y-2 text-sm text-gray-600">
                <p>🕐 {activity.time}</p>
                <p>📍 {activity.location}</p>
                <p>👥 {activity.participants.current}/{activity.participants.max} 人</p>
              </div>

              <button 
                onClick={() => handleParticipate(activity.id)}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  activity.isParticipating
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gradient-primary text-white hover:shadow-lg hover:scale-105'
                }`}
              >
                {activity.isParticipating ? '已报名' : '立即报名'}
              </button>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && activities.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">暂无活动</h3>
          <p className="text-gray-500">敬请期待更多精彩活动！</p>
        </div>
      )}
    </div>
  )
}

