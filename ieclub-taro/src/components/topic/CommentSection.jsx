/**
 * 评论区组件
 * 支持评论、回复、点赞等功能
 */
import React, { useState, useEffect } from 'react';
import Icon from '../common/Icon.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Button } from '../common/Button.jsx';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api.js';

/**
 * 单条评论组件
 */
const CommentItem = ({ comment, onReply, onLike, onDelete, currentUserId, level = 0 }) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likes, setLikes] = useState(comment.likes || 0);

  const isAuthor = currentUserId === comment.author?.id;
  const canReply = level < 2; // 最多支持2级嵌套

  // 处理点赞
  const handleLike = async () => {
    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikes(newLikedState ? likes + 1 : likes - 1);
      await onLike(comment.id);
    } catch (err) {
      console.error('点赞失败:', err);
      // 回滚
      setIsLiked(!isLiked);
      setLikes(isLiked ? likes + 1 : likes - 1);
    }
  };

  // 处理回复提交
  const handleReplySubmit = async () => {
    if (!replyContent.trim()) {
      alert('请输入回复内容');
      return;
    }

    try {
      setSubmitting(true);
      await onReply(comment.id, replyContent);
      setReplyContent('');
      setShowReplyBox(false);
    } catch (err) {
      console.error('回复失败:', err);
      alert('回复失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${level > 0 ? 'ml-12 mt-3' : 'mt-4'}`}>
      <div className="flex gap-3">
        {/* 头像 */}
        <Avatar
          src={comment.author?.avatar}
          name={comment.author?.name}
          size={level > 0 ? 'sm' : 'md'}
          className="flex-shrink-0"
        />

        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          {/* 用户信息和时间 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900 text-sm">
              {comment.author?.name}
            </span>
            {comment.author?.badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-primary text-white text-xs font-bold">
                {comment.author.badge}
              </span>
            )}
            <span className="text-xs text-gray-500">
              {formatTime(comment.createdAt)}
            </span>
          </div>

          {/* 评论内容 */}
          <div className="text-gray-700 text-sm leading-relaxed mb-2">
            {comment.replyTo && (
              <span className="text-purple-600 font-medium">
                @{comment.replyTo.name}{' '}
              </span>
            )}
            {comment.content}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-4 text-xs">
            {/* 点赞 */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Icon
                icon={isLiked ? 'heart-solid' : 'heart'}
                size="xs"
                color={isLiked ? '#EF4444' : 'currentColor'}
              />
              <span>{likes > 0 ? likes : '赞'}</span>
            </button>

            {/* 回复 */}
            {canReply && (
              <button
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="flex items-center gap-1 text-gray-500 hover:text-purple-600 transition-colors"
              >
                <Icon icon="chat-bubble" size="xs" />
                <span>回复</span>
              </button>
            )}

            {/* 删除（仅作者可见） */}
            {isAuthor && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors"
              >
                <Icon icon="trash" size="xs" />
                <span>删除</span>
              </button>
            )}
          </div>

          {/* 回复输入框 */}
          {showReplyBox && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`回复 @${comment.author?.name}`}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none resize-none text-sm"
                rows="2"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyContent('');
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim() || submitting}
                  className="px-3 py-1.5 rounded-lg text-sm font-bold bg-gradient-primary text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? '发送中...' : '发送'}
                </button>
              </div>
            </div>
          )}

          {/* 子评论 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  onDelete={onDelete}
                  currentUserId={currentUserId}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 评论区主组件
 */
const CommentSection = ({ topicId }) => {
  const { currentUser } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('hot'); // 'hot' | 'latest'

  // 获取评论列表
  useEffect(() => {
    fetchComments();
  }, [topicId, sortBy]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/topics/${topicId}/comments`, {
        params: { sortBy }
      });
      setComments(response.data || []);
    } catch (err) {
      console.error('获取评论失败:', err);
      // 使用模拟数据
      setComments(getMockComments());
    } finally {
      setLoading(false);
    }
  };

  // 提交评论
  const handleCommentSubmit = async () => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    if (!commentContent.trim()) {
      alert('请输入评论内容');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/topics/${topicId}/comments`, {
        content: commentContent
      });

      // 添加新评论到列表
      const newComment = {
        id: response.data.id || Date.now(),
        content: commentContent,
        author: currentUser,
        createdAt: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        replies: []
      };

      setComments([newComment, ...comments]);
      setCommentContent('');
      alert('评论成功！');
    } catch (err) {
      console.error('评论失败:', err);
      alert('评论失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 回复评论
  const handleReply = async (commentId, content) => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    try {
      const response = await api.post(`/topics/${topicId}/comments/${commentId}/reply`, {
        content
      });

      // 更新评论列表
      const updateComments = (comments) => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            const newReply = {
              id: response.data.id || Date.now(),
              content,
              author: currentUser,
              createdAt: new Date().toISOString(),
              likes: 0,
              isLiked: false,
              replyTo: comment.author
            };
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply]
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateComments(comment.replies)
            };
          }
          return comment;
        });
      };

      setComments(updateComments(comments));
      alert('回复成功！');
    } catch (err) {
      console.error('回复失败:', err);
      throw err;
    }
  };

  // 点赞评论
  const handleLike = async (commentId) => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    try {
      await api.post(`/topics/${topicId}/comments/${commentId}/like`);
    } catch (err) {
      console.error('点赞失败:', err);
      throw err;
    }
  };

  // 删除评论
  const handleDelete = async (commentId) => {
    if (!window.confirm('确定要删除这条评论吗？')) {
      return;
    }

    try {
      await api.delete(`/topics/${topicId}/comments/${commentId}`);

      // 从列表中移除
      const removeComment = (comments) => {
        return comments.filter(comment => {
          if (comment.id === commentId) return false;
          if (comment.replies) {
            comment.replies = removeComment(comment.replies);
          }
          return true;
        });
      };

      setComments(removeComment(comments));
      alert('删除成功');
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请重试');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Icon icon="chat-bubble" size="md" color="#667eea" />
          评论 {comments.length > 0 && `(${comments.length})`}
        </h2>

        {/* 排序切换 */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('hot')}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              sortBy === 'hot'
                ? 'bg-gradient-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            热门
          </button>
          <button
            onClick={() => setSortBy('latest')}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              sortBy === 'latest'
                ? 'bg-gradient-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            最新
          </button>
        </div>
      </div>

      {/* 评论输入框 */}
      {currentUser ? (
        <div className="mb-6">
          <div className="flex gap-3">
            <Avatar
              src={currentUser.avatar}
              name={currentUser.name}
              size="md"
              className="flex-shrink-0"
            />
            <div className="flex-1">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="说说你的想法..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none"
                rows="3"
              />
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                  {commentContent.length}/500
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCommentSubmit}
                  disabled={!commentContent.trim() || submitting}
                  className="px-6"
                >
                  {submitting ? '发布中...' : '发布评论'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-xl bg-gray-50 text-center">
          <p className="text-gray-600 mb-3">登录后可以发表评论</p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.location.href = '/login'}
          >
            立即登录
          </Button>
        </div>
      )}

      {/* 评论列表 */}
      {loading ? (
        <div className="text-center py-8">
          <Icon icon="loading" size="xl" color="#667eea" className="animate-spin" />
          <p className="text-gray-500 mt-2">加载评论中...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <Icon icon="chat-bubble" size="3xl" color="#D1D5DB" />
          <p className="text-gray-500 mt-4">暂无评论，快来抢沙发吧！</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onLike={handleLike}
              onDelete={handleDelete}
              currentUserId={currentUser?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 时间格式化工具
function formatTime(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000);

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
  
  return time.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 模拟评论数据
function getMockComments() {
  return [
    {
      id: 1,
      content: '这个话题太棒了！我一直在找这方面的资源，期待能参与！',
      author: {
        id: 2,
        name: '张三',
        avatar: null,
        badge: 'VIP'
      },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      likes: 12,
      isLiked: false,
      replies: [
        {
          id: 11,
          content: '同感！这个话题确实很有价值',
          author: {
            id: 3,
            name: '李四',
            avatar: null
          },
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          likes: 3,
          isLiked: false,
          replyTo: { name: '张三' }
        }
      ]
    },
    {
      id: 2,
      content: '请问对初学者友好吗？需要什么前置知识？',
      author: {
        id: 4,
        name: '王五',
        avatar: null
      },
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      likes: 5,
      isLiked: false,
      replies: []
    }
  ];
}

export default CommentSection;

