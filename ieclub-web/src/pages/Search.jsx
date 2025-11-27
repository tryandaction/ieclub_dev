/**
 * 搜索页面
 * 支持搜索话题、用户等
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { searchTopics } from '../api/topic'
import { showToast } from '../components/Toast'
import { TopicListSkeleton } from '../components/Skeleton'
import { useDebounce } from '../hooks/useDebounce'

const typeConfig = {
  demand: { label: '我想听', bg: 'bg-gradient-to-r from-blue-500 to-blue-600', icon: '👂' },
  offer: { label: '我来讲', bg: 'bg-gradient-to-r from-purple-500 to-purple-600', icon: '🎤' },
  project: { label: '项目', bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600', icon: '🚀' },
  share: { label: '分享', bg: 'bg-gradient-to-r from-orange-500 to-orange-600', icon: '💡' },
  discussion: { label: '讨论', bg: 'bg-gradient-to-r from-gray-500 to-gray-600', icon: '💬' },
}

const getTypeConfig = (type) => typeConfig[type] || typeConfig.discussion

const tabs = [
  { id: 'all', label: '全部', icon: '🔍' },
  { id: 'topic', label: '话题', icon: '💬' },
  { id: 'user', label: '用户', icon: '👤' },
]

const typeFilters = [
  { id: 'all', label: '全部类型' },
  { id: 'demand', label: '👂 我想听' },
  { id: 'offer', label: '🎤 我来讲' },
  { id: 'project', label: '🚀 项目' },
  { id: 'share', label: '💡 分享' },
]

const sortOptions = [
  { id: 'new', label: '最新发布' },
  { id: 'hot', label: '最热门' },
  { id: 'trending', label: '趋势上升' },
]

export default function Search() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryFromUrl = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(queryFromUrl)
  const [activeTab, setActiveTab] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('new')
  const [showFilters, setShowFilters] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // 优化：使用防抖，避免频繁搜索
  const debouncedQuery = useDebounce(query, 500)

  // 优化：使用 useCallback 缓存搜索函数
  const performSearch = useCallback(async (searchQuery = query) => {
    if (!searchQuery.trim()) {
      showToast('请输入搜索关键词', 'warning')
      return
    }

    try {
      setLoading(true)
      setSearched(true)
      
      // 更新URL
      setSearchParams({ q: searchQuery })

      // 调用API搜索
      const data = await searchTopics({ 
        keyword: searchQuery,
        type: activeTab === 'all' ? undefined : activeTab,
        topicType: typeFilter === 'all' ? undefined : typeFilter,
        sortBy: sortBy
      })
      
      // 处理返回数据
      if (data && Array.isArray(data)) {
        setResults(data)
      } else if (data && data.topics && Array.isArray(data.topics)) {
        setResults(data.topics)
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('搜索失败:', error)
      showToast(error.response?.data?.message || '搜索失败，请稍后重试', 'error')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, activeTab, setSearchParams])

  // URL参数变化时自动搜索
  useEffect(() => {
    if (queryFromUrl) {
      setQuery(queryFromUrl)
      performSearch(queryFromUrl)
    }
  }, [queryFromUrl, performSearch])

  // 优化：防抖后自动搜索（用户停止输入500ms后）
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.trim().length >= 2) {
      performSearch(debouncedQuery)
    }
  }, [debouncedQuery, performSearch])

  const handleSearch = (e) => {
    e.preventDefault()
    performSearch()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      performSearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* 搜索框 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索话题、用户..."
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                autoFocus
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-gradient-primary text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>

          {/* Tab切换 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* 筛选按钮 */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                showFilters || typeFilter !== 'all' || sortBy !== 'new'
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>⚙️</span>
              <span>筛选</span>
              {(typeFilter !== 'all' || sortBy !== 'new') && (
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              )}
            </button>
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4">
              {/* 类型筛选 */}
              <div>
                <div className="text-sm text-gray-500 mb-2">话题类型</div>
                <div className="flex flex-wrap gap-2">
                  {typeFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setTypeFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        typeFilter === filter.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 排序方式 */}
              <div>
                <div className="text-sm text-gray-500 mb-2">排序方式</div>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSortBy(option.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        sortBy === option.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 重置筛选 */}
              {(typeFilter !== 'all' || sortBy !== 'new') && (
                <button
                  type="button"
                  onClick={() => { setTypeFilter('all'); setSortBy('new'); }}
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  重置筛选
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      {/* 搜索结果 */}
      {loading && <TopicListSkeleton count={6} />}

      {/* 结果展示 */}
      {!loading && searched && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {results.length > 0 ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  找到 <span className="text-purple-600">{results.length}</span> 个结果
                </h2>
              </div>

              {/* 话题列表 */}
              <div className="space-y-4">
                {results.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => navigate(`/topic/${topic.id}`)}
                    className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start space-x-4">
                      {/* 封面/图标 */}
                      <div className={`${getTypeConfig(topic.topicType || topic.type).bg} w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <span className="text-3xl">{topic.cover || '📝'}</span>
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        {/* 类型标签 */}
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                            {getTypeConfig(topic.topicType || topic.type).icon} {getTypeConfig(topic.topicType || topic.type).label}
                          </span>
                        </div>

                        {/* 标题 */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                          {topic.title}
                        </h3>

                        {/* 描述 */}
                        {topic.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {topic.description}
                          </p>
                        )}

                        {/* 元信息 */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>👤 {topic.author?.name || '匿名'}</span>
                          <span>❤️ {topic.stats?.likes || 0}</span>
                          <span>💬 {topic.stats?.comments || 0}</span>
                          <span>👀 {topic.stats?.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // 空状态
            <div className="text-center py-16">
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                没有找到相关结果
              </h3>
              <p className="text-gray-500">
                试试其他关键词或调整搜索条件
              </p>
            </div>
          )}
        </div>
      )}

      {/* 未搜索状态 */}
      {!searched && !loading && (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <div className="text-8xl mb-6">🔍</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            开始搜索
          </h3>
          <p className="text-gray-500 mb-6">
            输入关键词，发现感兴趣的内容
          </p>

          {/* 热门搜索 */}
          <div className="max-w-md mx-auto">
            <h4 className="text-sm font-bold text-gray-700 mb-3">热门搜索</h4>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Python', '机器学习', '考研', '前端', '数据分析', '期末复习'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag)
                    performSearch(tag)
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-600 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

