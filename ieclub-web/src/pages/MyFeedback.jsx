import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from '../utils/toast'
import Loading from '../components/Loading'

/**
 * 我的反馈列表页面
 */
export default function MyFeedback() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [feedbacks, setFeedbacks] = useState([])
  const [filter, setFilter] = useState({
    type: '',
    status: ''
  })

  const typeMap = {
    bug: { label: '🐛 Bug反馈', color: 'text-red-600' },
    feature: { label: '✨ 功能建议', color: 'text-blue-600' },
    improvement: { label: '💡 体验优化', color: 'text-green-600' },
    other: { label: '💬 其他反馈', color: 'text-gray-600' }
  }

  const statusMap = {
    pending: { label: '待处理', color: 'bg-gray-100 text-gray-700' },
    processing: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
    resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
    closed: { label: '已关闭', color: 'bg-red-100 text-red-700' }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [filter])

  const fetchFeedbacks = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filter.type) params.type = filter.type
      if (filter.status) params.status = filter.status

      const res = await api.get('/feedback/my', { params })
      setFeedbacks(res.data || [])
    } catch (error) {
      console.error('获取反馈列表失败:', error)
      toast.error(error.response?.data?.message || '获取反馈列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条反馈吗？')) return

    try {
      await api.delete(`/feedback/${id}`)
      toast.success('删除成功')
      fetchFeedbacks()
    } catch (error) {
      console.error('删除失败:', error)
      toast.error(error.response?.data?.message || '删除失败')
    }
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return d.toLocaleDateString('zh-CN')
  }

  if (loading) {
    return <Loading show={true} fullscreen={false} />
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">我的反馈</h1>
        <button
          onClick={() => navigate('/feedback')}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
        >
          + 新建反馈
        </button>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* 类型筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">类型:</span>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部</option>
              <option value="bug">Bug反馈</option>
              <option value="feature">功能建议</option>
              <option value="improvement">体验优化</option>
              <option value="other">其他反馈</option>
            </select>
          </div>

          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">状态:</span>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
        </div>
      </div>

      {/* 反馈列表 */}
      {feedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">暂无反馈记录</h3>
          <p className="text-gray-500 mb-6">
            遇到问题或有好的建议？欢迎随时反馈给我们
          </p>
          <button
            onClick={() => navigate('/feedback')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            提交反馈
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map(feedback => (
            <div
              key={feedback.id}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              {/* 顶部：类型、状态、时间 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className={`text-lg ${typeMap[feedback.type]?.color}`}>
                    {typeMap[feedback.type]?.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusMap[feedback.status]?.color}`}>
                    {statusMap[feedback.status]?.label}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(feedback.createdAt)}
                </span>
              </div>

              {/* 标题和内容 */}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {feedback.title}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {feedback.content}
              </p>

              {/* 截图预览 */}
              {feedback.images && feedback.images.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {feedback.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`截图${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  ))}
                </div>
              )}

              {/* 管理员回复 */}
              {feedback.reply && feedback.reply.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="font-medium text-blue-900">管理员回复:</span>
                  </div>
                  {feedback.reply.map((r, index) => (
                    <div key={index} className="text-blue-800 text-sm">
                      {r.content}
                    </div>
                  ))}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/feedback/${feedback.id}`)}
                  className="flex-1 px-4 py-2 text-sm text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  查看详情
                </button>
                {feedback.status === 'pending' && (
                  <button
                    onClick={() => handleDelete(feedback.id)}
                    className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

