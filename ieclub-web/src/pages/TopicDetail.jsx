import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTopicDetail, toggleLike, toggleBookmark } from '../api/topic'
import { getComments, createComment, deleteComment, toggleCommentLike } from '../api/comment'
import { showToast } from '../components/Toast'
import { TopicDetailSkeleton, CommentListSkeleton } from '../components/Skeleton'

const typeConfig = {
  offer: { label: '我来讲', bg: 'bg-gradient-to-r from-purple-500 to-purple-600', icon: '🎤' },
  demand: { label: '我想听', bg: 'bg-gradient-to-r from-blue-500 to-blue-600', icon: '👂' },
  project: { label: '项目招募', bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600', icon: '🚀' },
  share: { label: '分享', bg: 'bg-gradient-to-r from-orange-500 to-orange-600', icon: '💡' },
  discussion: { label: '讨论', bg: 'bg-gradient-to-r from-gray-500 to-gray-600', icon: '💬' },
}

// 获取类型配置，带默认值
const getTypeConfig = (type) => typeConfig[type] || typeConfig.discussion

// Mock数据
const mockTopic = {
  id: 1,
  type: 'offer',
  title: 'Python爬虫实战：从入门到精通',
  description: '本课程将带你深入学习Python爬虫技术，包括requests、BeautifulSoup、Selenium等常用库的使用，以及反爬虫策略的应对方法。适合有Python基础的同学学习。',
  cover: '🐍',
  author: { 
    id: 1,
    name: '张三', 
    avatar: '👨‍💻', 
    level: 12,
    major: '计算机科学',
    grade: '大三'
  },
  tags: ['Python', '爬虫', '数据采集'],
  stats: { 
    views: 456, 
    likes: 89, 
    comments: 34,
    bookmarks: 23
  },
  isLiked: false,
  isBookmarked: false,
  createdAt: '2024-03-20 14:30',
}

const mockComments = [
  {
    id: 1,
    author: { id: 2, name: '李四', avatar: '👩‍🎓', level: 8 },
    content: '太棒了！正好需要学习爬虫技术，期待开课！',
    likes: 12,
    isLiked: false,
    createdAt: '2024-03-20 15:20',
    replies: [
      {
        id: 2,
        author: { id: 1, name: '张三', avatar: '👨‍💻', level: 12 },
        content: '谢谢支持！我们会尽快安排时间的',
        likes: 5,
        isLiked: false,
        createdAt: '2024-03-20 15:25',
        replyTo: { id: 2, name: '李四' }
      }
    ]
  },
  {
    id: 3,
    author: { id: 3, name: '王五', avatar: '🎯', level: 10 },
    content: '能不能讲一下如何处理动态加载的网页？',
    likes: 8,
    isLiked: false,
    createdAt: '2024-03-20 16:10',
    replies: []
  }
]

export default function TopicDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [topic, setTopic] = useState(mockTopic)
  const [comments, setComments] = useState(mockComments)
  const [loading, setLoading] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // 加载话题详情
  useEffect(() => {
    loadTopicDetail()
    loadComments()
  }, [id])

  const loadTopicDetail = async () => {
    try {
      setLoading(true)
      const data = await getTopicDetail(id)
      if (data) {
        setTopic(data)
      }
    } catch (error) {
      console.error('加载话题详情失败:', error)
      // 失败时使用mock数据
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const data = await getComments(id)
      if (data && Array.isArray(data)) {
        setComments(data)
      } else if (data && data.comments && Array.isArray(data.comments)) {
        setComments(data.comments)
      }
    } catch (error) {
      console.error('加载评论失败:', error)
      // 失败时使用mock数据
    }
  }

  const handleLike = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录', 'warning')
      return
    }

    try {
      await toggleLike(id)
      const newIsLiked = !topic.isLiked
      setTopic({
        ...topic,
        isLiked: newIsLiked,
        stats: {
          ...topic.stats,
          likes: topic.isLiked ? topic.stats.likes - 1 : topic.stats.likes + 1
        }
      })
      showToast(newIsLiked ? '点赞成功 ❤️' : '已取消点赞', 'success')
    } catch (error) {
      console.error('操作失败:', error)
      showToast(error.response?.data?.message || '操作失败，请稍后重试', 'error')
    }
  }

  const handleBookmark = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录', 'warning')
      return
    }

    try {
      await toggleBookmark(id)
      const newIsBookmarked = !topic.isBookmarked
      setTopic({
        ...topic,
        isBookmarked: newIsBookmarked,
        stats: {
          ...topic.stats,
          bookmarks: topic.isBookmarked ? topic.stats.bookmarks - 1 : topic.stats.bookmarks + 1
        }
      })
      showToast(newIsBookmarked ? '收藏成功 ⭐' : '已取消收藏', 'success')
    } catch (error) {
      console.error('操作失败:', error)
      showToast(error.response?.data?.message || '操作失败，请稍后重试', 'error')
    }
  }

  // 快速操作（想听/我能讲/感兴趣）
  const handleQuickAction = async (actionType) => {
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录后再操作', 'warning')
      return
    }

    try {
      const res = await fetch(`https://ieclub.online/api/v1/topics/${id}/quick-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ actionType })
      })
      
      const data = await res.json()
      
      if (data.success) {
        // 更新本地状态
        const updates = {}
        if (actionType === 'want_hear') {
          updates.userWantHear = data.data.userAction
          updates.wantToHearCount = data.data.count
        } else if (actionType === 'can_tell') {
          updates.userCanTell = data.data.userAction
          updates.canTellCount = data.data.count
        } else if (actionType === 'interested') {
          updates.userInterested = data.data.userAction
          updates.interestedCount = data.data.count
        }
        
        setTopic({ ...topic, ...updates })
        
        const messages = {
          want_hear: data.data.userAction ? '已标记想听 👂' : '已取消',
          can_tell: data.data.userAction ? '已标记我能讲 🎤' : '已取消',
          interested: data.data.userAction ? '已标记感兴趣 🚀' : '已取消'
        }
        showToast(messages[actionType], 'success')
      } else {
        showToast(data.message || '操作失败', 'error')
      }
    } catch (error) {
      console.error('快速操作失败:', error)
      showToast('操作失败，请稍后重试', 'error')
    }
  }

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) {
      showToast('请输入评论内容', 'warning')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录', 'warning')
      return
    }

    try {
      setSubmitting(true)
      const data = {
        content: commentContent.trim(),
        parentId: replyTo?.id
      }
      
      await createComment(id, data)
      
      // 重新加载评论
      await loadComments()
      
      // 清空输入
      setCommentContent('')
      setReplyTo(null)
      
      // 更新评论数
      setTopic({
        ...topic,
        stats: {
          ...topic.stats,
          comments: topic.stats.comments + 1
        }
      })
      
      showToast('评论发表成功 💬', 'success')
    } catch (error) {
      console.error('发表评论失败:', error)
      showToast(error.response?.data?.message || '发表评论失败，请稍后重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    // 简化版，直接删除（实际应用中可能需要确认对话框组件）
    try {
      await deleteComment(id, commentId)
      await loadComments()
      
      // 更新评论数
      setTopic({
        ...topic,
        stats: {
          ...topic.stats,
          comments: topic.stats.comments - 1
        }
      })
      
      showToast('评论已删除', 'success')
    } catch (error) {
      console.error('删除评论失败:', error)
      showToast(error.response?.data?.message || '删除评论失败，请稍后重试', 'error')
    }
  }

  const handleCommentLike = async (commentId) => {
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录', 'warning')
      return
    }

    try {
      await toggleCommentLike(id, commentId)
      
      // 更新评论点赞状态
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
          }
        }
        // 处理回复
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply.id === commentId
                ? {
                    ...reply,
                    isLiked: !reply.isLiked,
                    likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1
                  }
                : reply
            )
          }
        }
        return comment
      }))
    } catch (error) {
      console.error('操作失败:', error)
      showToast(error.response?.data?.message || '操作失败，请稍后重试', 'error')
    }
  }

  if (loading) {
    return <TopicDetailSkeleton />
  }

  const config = getTypeConfig(topic.topicType || topic.type)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
      >
        <span>←</span>
        <span>返回</span>
      </button>

      {/* 话题主体 */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* 头部 */}
        <div className={`${config.bg} p-6 text-white`}>
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">{config.icon}</span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              {config.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{topic.title}</h1>
          <div className="flex items-center space-x-4 text-sm text-white/80">
            <span>👀 {topic.stats.views} 浏览</span>
            <span>•</span>
            <span>{topic.createdAt}</span>
          </div>
        </div>

        {/* 作者信息 */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">{topic.author.avatar}</div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900">{topic.author.name}</span>
                  <span className="text-xs bg-gradient-primary text-white px-2 py-1 rounded-full">
                    LV{topic.author.level}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {topic.author.major} · {topic.author.grade}
                </p>
              </div>
            </div>
            <button className="px-6 py-2 bg-gradient-primary text-white rounded-full hover:shadow-lg transition-all">
              关注
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 border-b">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {topic.description || topic.content}
          </p>

          {/* 标签 */}
          {topic.tags && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {(Array.isArray(topic.tags) ? topic.tags : JSON.parse(topic.tags || '[]')).map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 我想听/我来讲 专属信息 */}
        {(topic.topicType === 'demand' || topic.topicType === 'offer' || topic.type === 'demand' || topic.type === 'offer') && (topic.duration || topic.targetAudience || topic.threshold) && (
          <div className="p-6 border-b bg-gray-50">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">📅 详细信息</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {topic.duration && (
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-500">预计时长</div>
                  <div className="font-bold text-gray-900">{topic.duration}</div>
                </div>
              )}
              {topic.targetAudience && (
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-500">目标听众</div>
                  <div className="font-bold text-gray-900">{topic.targetAudience}</div>
                </div>
              )}
              {topic.threshold && (
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-500">成团人数</div>
                  <div className="font-bold text-purple-600">{topic.threshold} 人</div>
                </div>
              )}
              {topic.wantToHearCount !== undefined && (
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-500">想听人数</div>
                  <div className="font-bold text-blue-600">{topic.wantToHearCount} 人</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 项目专属信息 */}
        {(topic.topicType === 'project' || topic.type === 'project') && (
          <div className="p-6 border-b bg-gray-50 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">🚀 项目信息</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {topic.projectStage && (
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-500">项目阶段</div>
                  <div className="font-bold text-emerald-600">{topic.projectStage}</div>
                </div>
              )}
              {topic.teamSize && (
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-500">团队规模</div>
                  <div className="font-bold text-gray-900">{topic.teamSize} 人</div>
                </div>
              )}
              {topic.interestedCount !== undefined && (
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-500">感兴趣人数</div>
                  <div className="font-bold text-emerald-600">{topic.interestedCount} 人</div>
                </div>
              )}
            </div>
            
            {/* 招募角色 */}
            {topic.lookingForRoles && (
              <div>
                <div className="text-sm text-gray-500 mb-2">招募角色</div>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(topic.lookingForRoles) ? topic.lookingForRoles : JSON.parse(topic.lookingForRoles || '[]')).map((role, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm">{role}</span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 所需技能 */}
            {topic.skillsNeeded && (
              <div>
                <div className="text-sm text-gray-500 mb-2">所需技能</div>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(topic.skillsNeeded) ? topic.skillsNeeded : JSON.parse(topic.skillsNeeded || '[]')).map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-sm">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 链接 */}
            {(topic.website || topic.github || topic.contactInfo) && (
              <div className="pt-4 border-t flex flex-wrap gap-4">
                {topic.website && (
                  <a href={topic.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                    🌐 项目网站
                  </a>
                )}
                {topic.github && (
                  <a href={topic.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-800 hover:underline">
                    💻 GitHub
                  </a>
                )}
                {topic.contactInfo && (
                  <span className="flex items-center gap-2 text-gray-600">
                    📧 {topic.contactInfo}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* 供需匹配互动区 - 我想听/我来讲 */}
        {(topic.topicType === 'demand' || topic.topicType === 'offer' || topic.type === 'demand' || topic.type === 'offer') && (
          <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => handleQuickAction('want_hear')}
                className={`flex-1 max-w-xs flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-lg transition-all ${
                  topic.userWantHear
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-white text-blue-600 border-2 border-blue-200 hover:border-blue-400 hover:shadow-md'
                }`}
              >
                <span className="text-2xl">👂</span>
                <span>我想听</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-sm">{topic.wantToHearCount || 0}</span>
              </button>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{topic.wantToHearCount || 0}/{topic.threshold || 15}</div>
                <div className="text-sm text-gray-500">成团进度</div>
                <div className="w-24 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                    style={{ width: `${Math.min(100, ((topic.wantToHearCount || 0) / (topic.threshold || 15)) * 100)}%` }}
                  />
                </div>
              </div>
              
              <button
                onClick={() => handleQuickAction('can_tell')}
                className={`flex-1 max-w-xs flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-lg transition-all ${
                  topic.userCanTell
                    ? 'bg-purple-500 text-white shadow-lg scale-105'
                    : 'bg-white text-purple-600 border-2 border-purple-200 hover:border-purple-400 hover:shadow-md'
                }`}
              >
                <span className="text-2xl">🎤</span>
                <span>我能讲</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-sm">{topic.canTellCount || 0}</span>
              </button>
            </div>
            
            {topic.status === 'scheduled' && (
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium">
                  🎉 已达成团！等待开讲安排
                </span>
              </div>
            )}
          </div>
        )}

        {/* 项目感兴趣按钮 */}
        {(topic.topicType === 'project' || topic.type === 'project') && (
          <div className="p-6 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center justify-center">
              <button
                onClick={() => handleQuickAction('interested')}
                className={`flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-bold text-lg transition-all ${
                  topic.userInterested
                    ? 'bg-emerald-500 text-white shadow-lg scale-105'
                    : 'bg-white text-emerald-600 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-md'
                }`}
              >
                <span className="text-2xl">🚀</span>
                <span>{topic.userInterested ? '已感兴趣' : '感兴趣，想加入'}</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-sm">{topic.interestedCount || 0}</span>
              </button>
            </div>
          </div>
        )}

        {/* 操作栏 */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-all ${
                topic.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <span className="text-xl">{topic.isLiked ? '❤️' : '🤍'}</span>
              <span className="font-medium">{topic.stats?.likes || topic.likesCount || 0}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <span className="text-xl">💬</span>
              <span className="font-medium">{topic.stats?.comments || topic.commentsCount || 0}</span>
            </button>
            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-2 transition-all ${
                topic.isBookmarked ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500'
              }`}
            >
              <span className="text-xl">{topic.isBookmarked ? '⭐' : '☆'}</span>
              <span className="font-medium">{topic.stats?.bookmarks || topic.bookmarksCount || 0}</span>
            </button>
          </div>
          <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
            <span className="text-xl">🔗</span>
            <span>分享</span>
          </button>
        </div>
      </div>

      {/* 评论区 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          💬 评论 ({topic.stats.comments})
        </h2>

        {/* 发表评论 */}
        <div className="mb-8">
          {replyTo && (
            <div className="mb-3 flex items-center justify-between bg-purple-50 p-3 rounded-lg">
              <span className="text-sm text-gray-600">
                回复 <span className="font-medium text-purple-600">@{replyTo.name}</span>
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex space-x-3">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={replyTo ? `回复 @${replyTo.name}...` : '写下你的想法...'}
              className="flex-1 border border-gray-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows="3"
            />
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSubmitComment}
              disabled={submitting || !commentContent.trim()}
              className="px-6 py-2 bg-gradient-primary text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '发送中...' : '发表评论'}
            </button>
          </div>
        </div>

        {/* 评论列表 */}
        {loading ? (
          <CommentListSkeleton count={3} />
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💭</div>
            <p className="text-gray-500">还没有评论，快来抢沙发吧！</p>
          </div>
        ) : (
          <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              {/* 主评论 */}
              <div className="flex space-x-3">
                <div className="text-3xl flex-shrink-0">{comment.author.avatar}</div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900">{comment.author.name}</span>
                        <span className="text-xs bg-gradient-primary text-white px-2 py-1 rounded-full">
                          LV{comment.author.level}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{comment.createdAt}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                  </div>
                  
                  {/* 评论操作 */}
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <button
                      onClick={() => handleCommentLike(comment.id)}
                      className={`flex items-center space-x-1 transition-colors ${
                        comment.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <span>{comment.isLiked ? '❤️' : '🤍'}</span>
                      <span>{comment.likes}</span>
                    </button>
                    <button
                      onClick={() => setReplyTo({ id: comment.id, name: comment.author.name })}
                      className="text-gray-500 hover:text-purple-600 transition-colors"
                    >
                      回复
                    </button>
                    {/* 如果是当前用户的评论，显示删除按钮 */}
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-500 hover:text-red-600 transition-colors"
                    >
                      删除
                    </button>
                  </div>

                  {/* 回复列表 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex space-x-3">
                          <div className="text-2xl flex-shrink-0">{reply.author.avatar}</div>
                          <div className="flex-1">
                            <div className="bg-white rounded-xl p-3 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2 text-sm">
                                  <span className="font-bold text-gray-900">{reply.author.name}</span>
                                  {reply.replyTo && (
                                    <>
                                      <span className="text-gray-400">回复</span>
                                      <span className="text-purple-600">@{reply.replyTo.name}</span>
                                    </>
                                  )}
                                  <span className="text-xs bg-gradient-primary text-white px-2 py-1 rounded-full">
                                    LV{reply.author.level}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">{reply.createdAt}</span>
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed">{reply.content}</p>
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-sm">
                              <button
                                onClick={() => handleCommentLike(reply.id)}
                                className={`flex items-center space-x-1 transition-colors ${
                                  reply.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                                }`}
                              >
                                <span>{reply.isLiked ? '❤️' : '🤍'}</span>
                                <span>{reply.likes}</span>
                              </button>
                              <button
                                onClick={() => setReplyTo({ id: comment.id, name: reply.author.name })}
                                className="text-gray-500 hover:text-purple-600 transition-colors"
                              >
                                回复
                              </button>
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-gray-500 hover:text-red-600 transition-colors"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  )
}

