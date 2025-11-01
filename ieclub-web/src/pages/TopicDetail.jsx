import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTopicDetail, toggleLike, toggleBookmark } from '../api/topic'
import { getComments, createComment, deleteComment, toggleCommentLike } from '../api/comment'
import { showToast } from '../components/Toast'
import { TopicDetailSkeleton, CommentListSkeleton } from '../components/Skeleton'

const typeConfig = {
  offer: { label: '我来讲', bg: 'bg-gradient-offer', icon: '🎤' },
  demand: { label: '想听', bg: 'bg-gradient-demand', icon: '👂' },
  project: { label: '项目', bg: 'bg-gradient-project', icon: '🚀' },
}

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

  const config = typeConfig[topic.type]

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
            {topic.description}
          </p>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2 mt-6">
            {topic.tags.map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

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
              <span className="font-medium">{topic.stats.likes}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <span className="text-xl">💬</span>
              <span className="font-medium">{topic.stats.comments}</span>
            </button>
            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-2 transition-all ${
                topic.isBookmarked ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500'
              }`}
            >
              <span className="text-xl">{topic.isBookmarked ? '⭐' : '☆'}</span>
              <span className="font-medium">{topic.stats.bookmarks}</span>
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

