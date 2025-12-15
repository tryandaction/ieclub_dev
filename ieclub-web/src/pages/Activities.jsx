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
      className="bg-white rounded-resp-lg overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer active:scale-[0.98] sm:hover:scale-[1.02]"
      onClick={() => onNavigate(`/activities/${activity.id}`)}
    >
      {/* 封面 - 响应式高度 */}
      {images.length > 0 ? (
        <img 
          src={images[0]} 
          alt={activity.title}
          className="w-full aspect-[4/3] object-cover"
        />
      ) : (
        <div className="bg-gradient-to-br from-blue-400 to-purple-500 card-cover">
          <span className="card-cover-icon">🎉</span>
        </div>
      )}

      {/* 内容 - 响应式内边距 */}
      <div className="p-2 sm:p-4 space-y-1.5 sm:space-y-3">
        {/* 状态标签 */}
        <div className="flex items-center justify-between">
          <span className={`tag ${status.color}`}>
            {status.label}
          </span>
          {activity.category && (
            <span className="text-caption text-gray-500">{activity.category}</span>
          )}
        </div>
        
        <h3 className="title-sm text-gray-900 line-clamp-2">{activity.title}</h3>

        <div className="space-y-1 text-body text-gray-600">
          <p className="flex items-center gap-1">
            <span className="icon-sm">🕐</span>
            <span className="truncate">{formatTime(activity.startTime)}</span>
          </p>
          <p className="flex items-center gap-1">
            <span className="icon-sm">📍</span>
            <span className="truncate">{activity.location}</span>
          </p>
          <p className="flex items-center gap-1">
            <span className="icon-sm">👥</span>
            <span>{activity.participantsCount || 0}/{activity.maxParticipants || '不限'}</span>
          </p>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation()
            if (!isPast) onParticipate(activity.id)
          }}
          disabled={isPast}
          className={`w-full btn ${
            isPast
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : activity.isParticipating
                ? 'btn-secondary'
                : 'btn-primary'
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
      
      // API 返回格式: {list: [...], total: N, ...}
      if (data && data.list && Array.isArray(data.list)) {
        setActivities(data.list)
      } else if (data && Array.isArray(data)) {
        setActivities(data)
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
      if (activity.isParticipating) {
        await leaveActivity(activityId)
        setActivities(prev => prev.map(a =>
          a.id === activityId 
            ? { ...a, isParticipating: false, participantsCount: Math.max(0, (a.participantsCount || 1) - 1) } 
            : a
        ))
        showToast('已取消报名', 'success')
      } else {
        await joinActivity(activityId)
        setActivities(prev => prev.map(a =>
          a.id === activityId 
            ? { ...a, isParticipating: true, participantsCount: (a.participantsCount || 0) + 1 } 
            : a
        ))
        showToast('报名成功 🎉', 'success')
      }
    } catch (error) {
      console.error('操作失败:', error)
      const errorMsg = error.response?.data?.message || error.message || ''
      
      // 处理状态不同步
      if (errorMsg.includes('已报名') || errorMsg.includes('已经报名')) {
        setActivities(prev => prev.map(a =>
          a.id === activityId ? { ...a, isParticipating: true } : a
        ))
        showToast('已报名该活动', 'info')
      } else if (errorMsg.includes('未报名') || errorMsg.includes('没有报名')) {
        setActivities(prev => prev.map(a =>
          a.id === activityId ? { ...a, isParticipating: false } : a
        ))
        showToast('未报名该活动', 'info')
      } else {
        showToast(errorMsg || '操作失败', 'error')
      }
    }
  }, [activities, navigate])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 页面标题 - 响应式 */}
      <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1>精彩活动</h1>
          <p>参与活动，收获成长</p>
        </div>
        <button
          onClick={() => navigate('/publish-activity')}
          className="btn bg-white/20 hover:bg-white/30 text-white flex items-center gap-1 w-full sm:w-auto justify-center"
        >
          <span className="icon-sm">➕</span>
          发布活动
        </button>
      </div>

      {/* 加载状态 - 骨架屏 */}
      {loading && <ActivityListSkeleton count={6} />}

      {/* 活动网格 - 小红书风格双列 */}
      {!loading && activities.length > 0 && (
        <div className="card-grid">
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

      {/* 空状态 - 响应式 */}
      {!loading && activities.length === 0 && (
        <div className="text-center py-12 sm:py-20">
          <div className="icon-lg mb-3 sm:mb-4">🎉</div>
          <h3 className="title-md text-gray-900 mb-1 sm:mb-2">暂无活动</h3>
          <p className="text-body text-gray-500 mb-4 sm:mb-6">快来发布第一个活动吧！</p>
          <button
            onClick={() => navigate('/publish-activity')}
            className="btn btn-primary"
          >
            发布活动
          </button>
        </div>
      )}
    </div>
  )
}