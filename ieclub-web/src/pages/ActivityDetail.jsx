import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getActivityDetail, joinActivity, leaveActivity, checkIn, generateCheckInQRCode, getCheckInStats } from '../api/activities'
import toast from '../utils/toast'
import Loading from '../components/Loading'
import logger from '../utils/logger'

/**
 * 活动详情页 - 支持签到功能
 */
export default function ActivityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState(null)
  const [isParticipating, setIsParticipating] = useState(false)
  const [hasCheckedIn, setHasCheckedIn] = useState(false)
  const [isOrganizer, setIsOrganizer] = useState(false)
  
  // 签到相关状态
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeData, setQRCodeData] = useState(null)
  const [showStats, setShowStats] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadActivityDetail()
  }, [id])

  const loadActivityDetail = async () => {
    try {
      setLoading(true)
      const res = await getActivityDetail(id)
      
      // 安全解析响应数据
      const data = res?.data?.data || res?.data || res
      
      if (!data || !data.id) {
        throw new Error('活动数据无效')
      }
      
      setActivity(data)
      setIsParticipating(data.isParticipating || false)
      setHasCheckedIn(data.hasCheckedIn || false)
      
      // 检查是否是组织者
      const userStr = localStorage.getItem('user')
      const currentUserId = userStr ? JSON.parse(userStr)?.id : null
      setIsOrganizer(data.organizer?.id === currentUserId)
      
      logger.info('加载活动详情成功', { activityId: id })
    } catch (error) {
      logger.error('加载活动详情失败', error)
      toast.error(error.message || '加载失败')
      navigate('/activities')
    } finally {
      setLoading(false)
    }
  }

  const handleParticipate = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.warning('请先登录')
      navigate('/login')
      return
    }

    try {
      // 根据当前状态调用不同的 API
      if (isParticipating) {
        await leaveActivity(id)
      } else {
        await joinActivity(id)
      }
      setIsParticipating(!isParticipating)
      toast.success(isParticipating ? '已取消报名' : '报名成功 🎉')
      loadActivityDetail() // 重新加载以更新参与人数
    } catch (error) {
      logger.error('报名操作失败', error)
      toast.error(error.message || '操作失败')
    }
  }

  const handleCheckIn = async () => {
    try {
      await checkIn(id)
      setHasCheckedIn(true)
      toast.success('签到成功 ✅')
      loadActivityDetail()
    } catch (error) {
      logger.error('签到失败', error)
      toast.error(error.response?.data?.message || '签到失败')
    }
  }

  const handleGenerateQRCode = async () => {
    try {
      const res = await generateCheckInQRCode(id)
      const data = res.data.data || res.data
      setQRCodeData(data)
      setShowQRCode(true)
      toast.success('签到二维码已生成')
      logger.info('生成签到二维码', { activityId: id })
    } catch (error) {
      logger.error('生成二维码失败', error)
      toast.error(error.response?.data?.message || '生成失败')
    }
  }

  const handleViewStats = async () => {
    try {
      const res = await getCheckInStats(id)
      const data = res.data.data || res.data
      setStats(data)
      setShowStats(true)
      logger.info('查看签到统计', { activityId: id })
    } catch (error) {
      logger.error('获取统计失败', error)
      toast.error(error.response?.data?.message || '获取失败')
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isActivityOngoing = () => {
    if (!activity) return false
    const now = new Date()
    const start = new Date(activity.startTime)
    const end = new Date(activity.endTime)
    return now >= start && now <= end
  }

  if (loading) {
    return <Loading show={true} fullscreen={false} />
  }

  if (!activity) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">😕</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">活动不存在</h3>
        <button
          onClick={() => navigate('/activities')}
          className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          返回活动列表
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/activities')}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
      >
        <span className="mr-2">←</span>
        返回活动列表
      </button>

      {/* 活动信息卡片 */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* 封面图 */}
        {activity.images && activity.images.length > 0 ? (
          <img
            src={activity.images[0]}
            alt={activity.title}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-8xl">🎉</span>
          </div>
        )}

        {/* 内容 */}
        <div className="p-8">
          {/* 标题 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{activity.title}</h1>

          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-gray-700">
              <span className="text-2xl mr-3">🕐</span>
              <div>
                <div className="text-sm text-gray-500">开始时间</div>
                <div className="font-medium">{formatTime(activity.startTime)}</div>
              </div>
            </div>
            <div className="flex items-center text-gray-700">
              <span className="text-2xl mr-3">🏁</span>
              <div>
                <div className="text-sm text-gray-500">结束时间</div>
                <div className="font-medium">{formatTime(activity.endTime)}</div>
              </div>
            </div>
            <div className="flex items-center text-gray-700">
              <span className="text-2xl mr-3">📍</span>
              <div>
                <div className="text-sm text-gray-500">活动地点</div>
                <div className="font-medium">{activity.location}</div>
              </div>
            </div>
            <div className="flex items-center text-gray-700">
              <span className="text-2xl mr-3">👥</span>
              <div>
                <div className="text-sm text-gray-500">参与人数</div>
                <div className="font-medium">
                  {activity.participantsCount || 0}/{activity.maxParticipants || '不限'}
                </div>
              </div>
            </div>
          </div>

          {/* 活动描述 */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">活动介绍</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{activity.description}</p>
          </div>

          {/* 组织者信息 */}
          {activity.organizer && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2">组织者</h3>
              <div className="flex items-center gap-3">
                <img
                  src={activity.organizer.avatar || '/default-avatar.png'}
                  alt={activity.organizer.nickname}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="font-medium text-gray-900">{activity.organizer.nickname}</div>
                  {activity.organizer.bio && (
                    <div className="text-sm text-gray-500">{activity.organizer.bio}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            {!isOrganizer && (
              <>
                <button
                  onClick={handleParticipate}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    isParticipating
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gradient-primary text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  {isParticipating ? '已报名' : '立即报名'}
                </button>

                {isParticipating && isActivityOngoing() && !hasCheckedIn && (
                  <button
                    onClick={handleCheckIn}
                    className="flex-1 py-3 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-all"
                  >
                    立即签到 ✅
                  </button>
                )}

                {hasCheckedIn && (
                  <div className="flex-1 py-3 rounded-xl font-medium bg-green-100 text-green-700 text-center">
                    已签到 ✅
                  </div>
                )}
              </>
            )}

            {isOrganizer && (
              <>
                <button
                  onClick={handleGenerateQRCode}
                  className="flex-1 py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
                >
                  生成签到二维码 📱
                </button>
                <button
                  onClick={handleViewStats}
                  className="flex-1 py-3 rounded-xl font-medium bg-purple-600 text-white hover:bg-purple-700 transition-all"
                >
                  查看签到统计 📊
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 签到二维码弹窗 */}
      {showQRCode && qrCodeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">签到二维码</h3>
            <p className="text-gray-600 text-center mb-6">
              参与者扫描此二维码即可签到
            </p>
            <div className="flex justify-center mb-6">
              <img
                src={qrCodeData.qrCodeDataURL}
                alt="签到二维码"
                className="w-64 h-64 border-4 border-gray-200 rounded-lg"
              />
            </div>
            <div className="text-sm text-gray-500 text-center mb-6">
              <p>有效期至：{formatTime(qrCodeData.expiresAt)}</p>
            </div>
            <button
              onClick={() => setShowQRCode(false)}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 签到统计弹窗 */}
      {showStats && stats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full my-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">签到统计</h3>
            
            {/* 统计概览 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">总报名</div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalParticipants}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">已签到</div>
                <div className="text-2xl font-bold text-green-600">{stats.checkedInCount}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">未签到</div>
                <div className="text-2xl font-bold text-red-600">{stats.notCheckedInCount}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">签到率</div>
                <div className="text-2xl font-bold text-purple-600">{stats.checkInRate}%</div>
              </div>
            </div>

            {/* 参与者列表 */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-4">参与者列表</h4>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">用户</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">报名时间</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">签到状态</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">签到时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.participants.map((participant) => (
                      <tr key={participant.userId} className="border-t">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={participant.avatar || '/default-avatar.png'}
                              alt={participant.nickname}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{participant.nickname}</div>
                              <div className="text-xs text-gray-500">{participant.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatTime(participant.joinedAt)}
                        </td>
                        <td className="px-4 py-3">
                          {participant.checkedIn ? (
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              已签到 ✅
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              未签到
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {participant.checkedInAt ? formatTime(participant.checkedInAt) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => setShowStats(false)}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

