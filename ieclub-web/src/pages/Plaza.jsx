import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTopics, toggleLike } from '../api/topic'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { TopicListSkeleton } from '../components/Skeleton'

const tabs = [
  { id: 'all', label: '推荐', icon: '✨' },
  { id: 'offer', label: '我来讲', icon: '🎤' },
  { id: 'demand', label: '想听', icon: '👂' },
  { id: 'project', label: '项目', icon: '🚀' },
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
  offer: { label: '我来讲', bg: 'bg-gradient-offer', icon: '🎤' },
  demand: { label: '想听', bg: 'bg-gradient-demand', icon: '👂' },
  project: { label: '项目', bg: 'bg-gradient-project', icon: '🚀' },
}

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
    : topics.filter(t => t.type === activeTab)

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
      {/* 未登录提示 */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-5xl">👋</span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">欢迎来到 IEClub</h3>
                <p className="text-sm text-gray-600">登录后可以发布话题、参与讨论、结识伙伴</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 bg-white text-purple-600 font-medium rounded-xl hover:shadow-lg transition-all"
              >
                登录
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2.5 bg-gradient-primary text-white font-medium rounded-xl hover:shadow-lg transition-all"
              >
                注册
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab 切换栏 */}
      <div className="bg-white rounded-2xl p-2 shadow-sm">
        <div className="flex items-center space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-primary text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 加载状态 - 骨架屏 */}
      {loading && <TopicListSkeleton count={6} />}

      {/* 话题列表 - 瀑布流布局 */}
      {!loading && displayTopics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTopics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => navigate(`/topic/${topic.id}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer hover:scale-105"
          >
            {/* 封面 */}
            <div className={`${typeConfig[topic.type].bg} h-40 flex items-center justify-center relative`}>
              <span className="text-6xl">{topic.cover}</span>
              {/* 类型标识 */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
                <span>{typeConfig[topic.type].icon}</span>
                <span className="text-sm font-medium">{typeConfig[topic.type].label}</span>
              </div>
            </div>

            {/* 内容 */}
            <div className="p-4 space-y-3">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{topic.title}</h3>

              {/* 作者信息 */}
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{topic.author.avatar}</span>
                <span className="text-sm text-gray-600 flex-1">{topic.author.name}</span>
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-lg font-bold">
                  LV{topic.author.level}
                </span>
              </div>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2">
                {topic.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 统计信息 */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4 text-gray-500">
                  <span>💬 {topic.stats.comments}</span>
                  <span>👀 {topic.stats.views}</span>
                </div>
                <button
                  onClick={(e) => handleLike(e, topic.id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-all duration-300 ${
                    topic.isLiked
                      ? 'bg-red-100 text-red-500 scale-110'
                      : 'text-gray-500 hover:bg-red-50 hover:text-red-500 hover:scale-105'
                  }`}
                >
                  <span className="text-base">{topic.isLiked ? '❤️' : '🤍'}</span>
                  <span className="font-medium">{topic.stats.likes}</span>
                </button>
              </div>

              {/* 想听进度条 */}
              {topic.stats.wantCount && (
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-3 rounded-xl">
                  <p className="text-sm text-pink-600 font-bold text-center">
                    {topic.stats.wantCount}/15人想听
                  </p>
                </div>
              )}
            </div>
          </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && displayTopics.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">暂无内容</h3>
          <p className="text-gray-500">快来发布第一个话题吧！</p>
        </div>
      )}
    </div>
  )
}

