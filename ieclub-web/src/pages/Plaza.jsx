import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTopics, toggleLike } from '../api/topic'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { TopicListSkeleton } from '../components/Skeleton'
import Avatar from '../components/Avatar'

const tabs = [
  { id: 'all', label: '推荐', icon: '✨' },
  { id: 'demand', label: '我想听', icon: '👂' },
  { id: 'offer', label: '我来讲', icon: '🎤' },
  { id: 'project', label: '项目', icon: '🚀' },
  { id: 'share', label: '分享', icon: '💡' },
]

const mockTopics = [
  {
    id: 1,
    type: 'offer',
    title: 'Python爬虫实战',
    cover: '🐍',
    author: { name: '张三', avatar: '👨‍💻', level: 12 },
    tags: ['Python', '爬虫'],
    stats: { views: 456, likes: 89, comments: 34 },
    isLiked: false,
  },
  {
    id: 2,
    type: 'demand',
    title: '线性代数期末串讲',
    cover: '📐',
    author: { name: '李四', avatar: '👩‍🎓', level: 8 },
    tags: ['数学', '期末'],
    stats: { views: 234, likes: 45, comments: 23, wantCount: 12 },
    isLiked: false,
  },
  {
    id: 3,
    type: 'project',
    title: '智能选课助手',
    cover: '🚀',
    author: { name: '王五', avatar: '🎯', level: 10 },
    tags: ['创业', 'AI'],
    stats: { views: 890, likes: 156, comments: 67 },
    isLiked: false,
  },
]

const typeConfig = {
  demand: { label: '我想听', bg: 'bg-gradient-to-r from-blue-500 to-blue-600', icon: '👂' },
  offer: { label: '我来讲', bg: 'bg-gradient-to-r from-purple-500 to-purple-600', icon: '🎤' },
  project: { label: '项目', bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600', icon: '🚀' },
  share: { label: '分享', bg: 'bg-gradient-to-r from-orange-500 to-orange-600', icon: '💡' },
  discussion: { label: '讨论', bg: 'bg-gradient-to-r from-gray-500 to-gray-600', icon: '💬' },
}

// 获取话题类型配置，带默认值
const getTypeConfig = (type) => typeConfig[type] || typeConfig.discussion

export default function Plaza() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [topics, setTopics] = useState(mockTopics)
  const [loading, setLoading] = useState(false)

  // 加载话题列表
  useEffect(() => {
    loadTopics()
  }, [activeTab])

  const loadTopics = async () => {
    try {
      setLoading(true)
      const params = activeTab === 'all' ? {} : { type: activeTab }
      const data = await getTopics(params)
      
      // 如果后端返回数据，使用后端数据；否则使用mock数据
      if (data && Array.isArray(data)) {
        setTopics(data)
      } else if (data && data.topics && Array.isArray(data.topics)) {
        setTopics(data.topics)
      }
    } catch (error) {
      console.error('❌ 加载话题失败:', error)
      // 发生错误时继续使用mock数据，不打扰用户
      showToast('加载失败，显示示例数据', 'warning')
    } finally {
      setLoading(false)
    }
  }

  const displayTopics = activeTab === 'all' 
    ? topics 
    : topics.filter(t => (t.topicType || t.type) === activeTab)

  const handleLike = async (e, topicId) => {
    e.stopPropagation() // 阻止事件冒泡，避免跳转到详情页
    
    if (!isAuthenticated) {
      showToast('请先登录后再操作', 'warning')
      setTimeout(() => navigate('/login'), 500)
      return
    }

    try {
      await toggleLike(topicId)
      
      // 更新本地状态
      setTopics(topics.map(t =>
        t.id === topicId
          ? {
              ...t,
              isLiked: !t.isLiked,
              stats: {
                ...t.stats,
                likes: t.isLiked ? t.stats.likes - 1 : t.stats.likes + 1
              }
            }
          : t
      ))
      
      showToast('操作成功', 'success')
    } catch (error) {
      console.error('操作失败:', error)
      showToast(error.response?.data?.message || '操作失败，请稍后重试', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* 未登录提示 - 响应式 */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-resp-lg p-resp-4 sm:p-resp-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="icon-lg">👋</span>
              <div>
                <h3 className="title-sm text-gray-900 mb-0.5">欢迎来到 IEClub</h3>
                <p className="text-caption text-gray-600">登录后可以发布话题、参与讨论</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 sm:flex-none btn btn-secondary"
              >
                登录
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex-1 sm:flex-none btn btn-primary"
              >
                注册
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab 切换栏 - 响应式 */}
      <div className="bg-white rounded-resp-lg p-1 sm:p-2 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 sm:py-3 px-2 sm:px-4 rounded-resp transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-primary text-white shadow-md sm:shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="icon-sm">{tab.icon}</span>
              <span className="text-caption sm:text-body font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 加载状态 - 骨架屏 */}
      {loading && <TopicListSkeleton count={6} />}

      {/* 话题列表 - 小红书风格双列卡片流 */}
      {!loading && displayTopics.length > 0 && (
        <div className="card-grid">
          {displayTopics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => navigate(`/topic/${topic.id}`)}
            className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer min-w-0"
          >
            {/* 封面 - 紧凑正方形 */}
            <div className={`${getTypeConfig(topic.topicType || topic.type).bg} card-cover relative`}>
              <span className="card-cover-icon">{topic.cover || '📝'}</span>
              {/* 类型标识 */}
              <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <span className="text-[10px] sm:text-xs">{getTypeConfig(topic.topicType || topic.type).icon}</span>
                <span className="text-[10px] sm:text-xs font-medium hidden xs:inline">{getTypeConfig(topic.topicType || topic.type).label}</span>
              </div>
            </div>

            {/* 内容 - 紧凑内边距 */}
            <div className="p-1.5 sm:p-3 space-y-1 sm:space-y-2">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{topic.title}</h3>

              {/* 作者信息 */}
              <div className="flex items-center gap-1">
                <Avatar 
                  src={topic.author?.avatar} 
                  name={topic.author?.nickname || topic.author?.name || '用户'} 
                  size={16}
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                />
                <span className="text-[10px] sm:text-xs text-gray-500 truncate">{topic.author?.nickname || topic.author?.name || '用户'}</span>
              </div>

              {/* 统计信息 */}
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span>💬{topic.commentsCount || topic.stats?.comments || 0}</span>
                  <span>❤️{topic.likesCount || topic.stats?.likes || 0}</span>
                </div>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* 空状态 - 响应式 */}
      {!loading && displayTopics.length === 0 && (
        <div className="text-center py-12 sm:py-20">
          <div className="icon-lg mb-3 sm:mb-4">📭</div>
          <h3 className="title-md text-gray-900 mb-1 sm:mb-2">暂无内容</h3>
          <p className="text-body text-gray-500">快来发布第一个话题吧！</p>
        </div>
      )}
    </div>
  )
}

