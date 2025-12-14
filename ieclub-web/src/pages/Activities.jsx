import { useState, useEffect, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActivities, joinActivity, leaveActivity } from '../api/activities'
import { showToast } from '../components/Toast'
import { ActivityListSkeleton } from '../components/Skeleton'

// 格式化时间显示
const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const isToday = date.toDateString() === now.toDateString()
  const isTomorrow = date.toDateString() === tomorrow.toDateString()
  
  const timeStr = date.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  if (isToday) return `今天 ${timeStr}`
  if (isTomorrow) return `明天 ${timeStr}`
  
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取活动状态
const getActivityStatus = (activity) => {
  const now = new Date()
  const start = new Date(activity.startTime)
  const end = new Date(activity.endTime)
  
  if (now < start) return { label: '即将开始', color: 'bg-blue-100 text-blue-700' }
  if (now >= start && now <= end) return { label: '进行中', color: 'bg-green-100 text-green-700' }
  return { label: '已结束', color: 'bg-gray-100 text-gray-500' }
}

// 优化：使用 memo 缓存活动卡片组件
const ActivityCard = memo(({ activity, onParticipate, onNavigate }) => {
  const status = getActivityStatus(activity)
  const images = activity.images || []
  const isPast = new Date() > new Date(activity.endTime)
  
  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
      onClick={() => onNavigate(`/activities/${activity.id}`)}
    >
      {/* 封面 */}
      {images.length > 0 ? (
        <img 
          src={images[0]} 
          alt={activity.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="bg-gradient-to-br from-blue-400 to-purple-500 h-48 flex items-center justify-center">
          <span className="text-8xl">🎉</span>
        </div>
      )}

      {/* 内容 */}
      <div className="p-6 space-y-4">
        {/* 状态标签 */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
          {activity.category && (
            <span className="text-xs text-gray-500">{activity.category}</span>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{activity.title}</h3>

        <div className="space-y-2 text-sm text-gray-600">
          <p>🕐 {formatTime(activity.startTime)}</p>
          <p>📍 {activity.location}</p>
          <p>👥 {activity.participantsCount || 0}/{activity.maxParticipants || '不限'} 人</p>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation()
            if (!isPast) onParticipate(activity.id)
          }}
          disabled={isPast}
          className={`w-full py-3 rounded-xl font-medium transition-all ${
            isPast
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : activity.isParticipating
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-gradient-primary text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {isPast ? '已结束' : activity.isParticipating ? '已报名' : '立即报名'}
        </button>
      </div>
    </div>
  )
})

ActivityCard.displayName = 'ActivityCard'

export default function Activities() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  // 加载活动列表
  const loadActivities = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getActivities()
      const data = res?.data?.data || res?.data || res
      
      if (data && Array.isArray(data)) {
        setActivities(data)
      } else if (data && data.activities && Array.isArray(data.activities)) {
        setActivities(data.activities)
      } else {
        setActivities([])
      }
    } catch (error) {
      console.error('❌ 加载活动列表失败:', error)
      showToast('加载失败，请稍后重试', 'error')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  const handleParticipate = useCallback(async (activityId) => {
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录', 'warning')
      navigate('/login')
      return
    }

    const activity = activities.find(a => a.id === activityId)
    if (!activity) return

    try {
      // 根据当前状态调用不同的 API
      if (activity.isParticipating) {
        await leaveActivity(activityId)
      } else {
        await joinActivity(activityId)
      }
      
      // 更新本地状态
      setActivities(prev => prev.map(a =>
        a.id === activityId 
          ? { 
              ...a, 
              isParticipating: !a.isParticipating,
              participantsCount: a.isParticipating 
                ? (a.participantsCount || 1) - 1 
                : (a.participantsCount || 0) + 1
            } 
          : a
      ))
      
      showToast(activity.isParticipating ? '已取消报名' : '报名成功 🎉', 'success')
    } catch (error) {
      console.error('操作失败:', error)
      showToast(error.message || '操作失败，请稍后重试', 'error')
    }
  }, [activities, navigate])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-gradient-primary text-white rounded-2xl p-8 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">精彩活动</h1>
          <p className="text-white/90">参与活动，收获成长</p>
        </div>
        <button
          onClick={() => navigate('/publish-activity')}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-all flex items-center gap-2"
        >
          <span className="text-xl">➕</span>
          发布活动
        </button>
      </div>

      {/* 加载状态 - 骨架屏 */}
      {loading && <ActivityListSkeleton count={6} />}

      {/* 活动网格 */}
      {!loading && activities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onParticipate={handleParticipate}
              onNavigate={navigate}
            />
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && activities.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">暂无活动</h3>
          <p className="text-gray-500 mb-6">快来发布第一个活动吧！</p>
          <button
            onClick={() => navigate('/publish-activity')}
            className="px-8 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            发布活动
          </button>
        </div>
      )}
    </div>
  )
}