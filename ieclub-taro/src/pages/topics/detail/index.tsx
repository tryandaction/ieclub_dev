// src/pages/topics/detail/index.tsx - 话题详情页（含评论互动）

import { View, Text, Image, ScrollView, Input, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import './index.scss'

// 获取API基础URL
function getApiBaseUrl(): string {
  const env = Taro.getEnv()
  
  switch (env) {
    case 'WEAPP':
      return 'https://api.ieclub.online/api'
    case 'H5':
      return '/api'
    case 'RN':
      return 'https://api.ieclub.online/api'
    default:
      return 'http://localhost:3000/api'
  }
}

// 表情包列表
const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '🤗', '🤩', '🤔', '🤨',
  '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮',
  '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛',
  '😜', '😝', '🤑', '🤗', '🤭', '🤫', '🤥', '😶',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
  '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💪', '🦾',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣',
  '💬', '👁️', '🗨️', '💭', '💤', '🎉', '🎊', '🎈'
]

// 模拟数据
const MOCK_TOPIC = {
  id: '1',
  type: 'supply',
  title: 'GPT-4教育应用实战：从零到一开发AI学习助手',
  content: `历时3个月，我开发了一个基于GPT-4的个性化学习助手。

主要功能：
1. 根据学生水平自动调整教学难度
2. 实时答疑和知识点讲解
3. 生成个性化练习题
4. 学习进度追踪和分析

技术栈：
• 前端：React + TypeScript
• 后端：Node.js + Python
• AI：OpenAI GPT-4 API
• 数据库：PostgreSQL

想和大家分享开发过程中的经验和踩过的坑，也欢迎提问交流！`,
  author: {
    id: 'u1',
    nickname: '张三',
    avatar: 'https://via.placeholder.com/60/667eea/ffffff?text=Z',
    bio: 'AI工程师 | 教育科技爱好者'
  },
  images: [
    'https://via.placeholder.com/800x600/667eea/ffffff?text=AI+1',
    'https://via.placeholder.com/800x600/3b82f6/ffffff?text=AI+2'
  ],
  category: '技术',
  tags: ['AI', 'GPT-4', '教育', 'React'],
  wantToHearCount: 23,
  targetCount: 15,
  viewsCount: 328,
  likesCount: 42,
  commentsCount: 15,
  isLiked: false,
  isInterested: false,
  createdAt: '2小时前'
}

const MOCK_COMMENTS = [
  {
    id: 'c1',
    author: {
      id: 'u2',
      nickname: '李四',
      avatar: 'https://via.placeholder.com/40/3b82f6/ffffff?text=L'
    },
    content: '这个项目太棒了！请问GPT-4的API成本大概是多少？',
    likesCount: 5,
    isLiked: false,
    createdAt: '1小时前',
    replies: [
      {
        id: 'c2',
        author: {
          id: 'u1',
          nickname: '张三',
          avatar: 'https://via.placeholder.com/40/667eea/ffffff?text=Z'
        },
        replyTo: '李四',
        content: '根据使用量，平均每个学生每月成本在10-20元左右 👍',
        likesCount: 3,
        isLiked: false,
        createdAt: '50分钟前'
      }
    ]
  },
  {
    id: 'c3',
    author: {
      id: 'u3',
      nickname: '王五',
      avatar: 'https://via.placeholder.com/40/9333ea/ffffff?text=W'
    },
    content: '非常期待你的分享！我也在做教育相关的AI应用 🎉',
    likesCount: 8,
    isLiked: false,
    createdAt: '30分钟前',
    replies: []
  }
]

export default function TopicDetailPage() {
  const router = useRouter()
  const topicId = router.params.id

  const [topic, setTopic] = useState(MOCK_TOPIC)
  const [comments, setComments] = useState(MOCK_COMMENTS)
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '话题详情' })
    loadTopicDetail()
    loadComments()
  }, [topicId])

  // 加载话题详情
  const loadTopicDetail = async () => {
    try {
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/topics/${topicId}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      })

      if (res.data.success) {
        const topicData = res.data.data
        setTopic({
          id: topicData.id,
          type: topicData.topicType === 'discussion' ? 'supply' : 'demand',
          title: topicData.title,
          content: topicData.content,
          author: topicData.author,
          images: topicData.images || [],
          category: topicData.category,
          tags: topicData.tags || [],
          wantToHearCount: topicData.wantToHearCount || 0,
          targetCount: topicData.targetCount || 15,
          viewsCount: topicData.viewsCount || 0,
          likesCount: topicData.likesCount || 0,
          commentsCount: topicData.commentsCount || 0,
          isLiked: topicData.isLiked || false,
          isInterested: topicData.isInterested || false,
          createdAt: topicData.createdAt
        })
      }
    } catch (error) {
      console.error('加载话题详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  // 加载评论列表
  const loadComments = async () => {
    try {
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/topics/${topicId}/comments`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      })

      if (res.data.success) {
        setComments(res.data.data)
      }
    } catch (error) {
      console.error('加载评论失败:', error)
    }
  }

  // 点赞话题
  const handleLikeTopic = async () => {
    try {
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/topics/${topicId}/like`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      })

      if (res.data.success) {
        setTopic({
          ...topic,
          isLiked: res.data.data.isLiked,
          likesCount: res.data.data.likesCount
        })
        Taro.showToast({
          title: res.data.message || (res.data.data.isLiked ? '点赞成功' : '已取消点赞'),
          icon: 'success'
        })
      } else {
        Taro.showToast({ title: res.data.message || '操作失败', icon: 'none' })
      }
    } catch (error) {
      console.error('点赞失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  // 标记想听
  const handleInterested = async () => {
    try {
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/topics/${topicId}/quick-action`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`,
          'Content-Type': 'application/json'
        },
        data: {
          actionType: 'interested'
        }
      })

      if (res.data.success) {
        setTopic({
          ...topic,
          isInterested: res.data.data.userAction,
          wantToHearCount: res.data.data.count
        })
        Taro.showToast({
          title: res.data.message || (res.data.data.userAction ? '已标记想听' : '已取消'),
          icon: 'success'
        })
      } else {
        Taro.showToast({ title: res.data.message || '操作失败', icon: 'none' })
      }
    } catch (error) {
      console.error('标记想听失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  // 点赞评论
  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          isLiked: !comment.isLiked,
          likesCount: comment.isLiked ? comment.likesCount - 1 : comment.likesCount + 1
        }
      }
      return comment
    }))
  }

  // 回复评论
  const handleReply = (comment: any) => {
    setReplyingTo(comment)
    Taro.pageScrollTo({ scrollTop: 999999 })
  }

  // 插入表情
  const insertEmoji = (emoji: string) => {
    setCommentText(commentText + emoji)
    setShowEmojiPicker(false)
  }

  // 发送评论
  const handleSendComment = async () => {
    if (!commentText.trim()) {
      Taro.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }

    try {
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/comments`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`,
          'Content-Type': 'application/json'
        },
        data: {
          topicId: topicId,
          content: commentText,
          parentId: replyingTo?.id || null
        }
      })

      if (res.data.success) {
        Taro.showToast({ title: '评论成功', icon: 'success' })
        setCommentText('')
        setReplyingTo(null)
        // 重新加载评论列表
        loadComments()
        // 更新话题评论数
        setTopic({
          ...topic,
          commentsCount: topic.commentsCount + 1
        })
      } else {
        Taro.showToast({ title: res.data.message || '评论失败', icon: 'none' })
      }
    } catch (error) {
      console.error('评论失败:', error)
      Taro.showToast({ title: '评论失败', icon: 'none' })
    }
  }

  return (
    <View className='topic-detail-page'>
      <ScrollView className='content-scroll' scrollY>
        {/* ===== 话题内容 ===== */}
        <View className='topic-content'>
          {/* 作者信息 */}
          <View className='author-header'>
            <Image className='author-avatar' src={topic.author.avatar} mode='aspectFill' />
            <View className='author-info'>
              <Text className='author-name'>{topic.author.nickname}</Text>
              <Text className='author-bio'>{topic.author.bio}</Text>
              <Text className='publish-time'>{topic.createdAt}</Text>
            </View>
            <Button className='follow-btn'>+ 关注</Button>
          </View>

          {/* 话题标题 */}
          <Text className='topic-title'>{topic.title}</Text>

          {/* 话题正文 */}
          <Text className='topic-text'>{topic.content}</Text>

          {/* 话题图片 */}
          {topic.images && topic.images.length > 0 && (
            <View className='topic-images'>
              {topic.images.map((img, index) => (
                <Image
                  key={index}
                  className='topic-image'
                  src={img}
                  mode='aspectFill'
                  onClick={() => {
                    Taro.previewImage({
                      urls: topic.images,
                      current: img
                    })
                  }}
                />
              ))}
            </View>
          )}

          {/* 话题标签 */}
          <View className='topic-tags'>
            <View className='category-tag'>{topic.category}</View>
            {topic.tags.map((tag, index) => (
              <Text key={index} className='tag-item'>#{tag}</Text>
            ))}
          </View>

          {/* 互动数据 */}
          <View className='topic-stats'>
            <Text className='stat-item'>👁 {topic.viewsCount} 浏览</Text>
            <Text className='stat-item'>❤️ {topic.likesCount} 点赞</Text>
            <Text className='stat-item'>💬 {topic.commentsCount} 评论</Text>
          </View>

          {/* 15人成团进度 */}
          {topic.type === 'supply' && (
            <View className='team-progress'>
              <View className='progress-header'>
                <Text className='progress-title'>🎯 {topic.wantToHearCount}人想听</Text>
                <Text className='progress-target'>目标{topic.targetCount}人</Text>
              </View>
              <View className='progress-bar'>
                <View
                  className='progress-fill'
                  style={{ width: `${(topic.wantToHearCount / topic.targetCount) * 100}%` }}
                />
              </View>
              <Text className='progress-tip'>
                {topic.wantToHearCount >= topic.targetCount
                  ? '✅ 已达成目标，即将安排分享'
                  : `还差${topic.targetCount - topic.wantToHearCount}人`}
              </Text>
            </View>
          )}
        </View>

        {/* ===== 评论列表 ===== */}
        <View className='comments-section'>
          <View className='section-title'>
            <Text className='title-text'>评论 {topic.commentsCount}</Text>
          </View>

          {comments.map(comment => (
            <View key={comment.id} className='comment-item'>
              <Image className='comment-avatar' src={comment.author.avatar} mode='aspectFill' />
              <View className='comment-content'>
                <Text className='comment-author'>{comment.author.nickname}</Text>
                <Text className='comment-text'>{comment.content}</Text>
                <View className='comment-footer'>
                  <Text className='comment-time'>{comment.createdAt}</Text>
                  <View className='comment-actions'>
                    <View
                      className='action-btn'
                      onClick={() => handleLikeComment(comment.id)}
                    >
                      <Text className={comment.isLiked ? 'liked' : ''}>
                        ❤️ {comment.likesCount}
                      </Text>
                    </View>
                    <View className='action-btn' onClick={() => handleReply(comment)}>
                      <Text>💬 回复</Text>
                    </View>
                  </View>
                </View>

                {/* 回复列表 */}
                {comment.replies && comment.replies.length > 0 && (
                  <View className='replies-list'>
                    {comment.replies.map(reply => (
                      <View key={reply.id} className='reply-item'>
                        <Text className='reply-author'>{reply.author.nickname}</Text>
                        <Text className='reply-to'> 回复 {reply.replyTo}：</Text>
                        <Text className='reply-text'>{reply.content}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ===== 底部操作栏 ===== */}
      <View className='bottom-action-bar'>
        {/* 评论输入 */}
        <View className='comment-input-box'>
          {replyingTo && (
            <View className='replying-tip'>
              <Text>回复 {replyingTo.author.nickname}</Text>
              <Text className='cancel-reply' onClick={() => setReplyingTo(null)}>✕</Text>
            </View>
          )}
          <View className='input-row'>
            <Input
              className='comment-input'
              placeholder={replyingTo ? `回复 ${replyingTo.author.nickname}` : '说点什么...'}
              value={commentText}
              id='comment-input'
              name='comment'
              onInput={(e) => setCommentText(e.detail.value)}
            />
            <View className='emoji-btn' onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              😀
            </View>
            <Button className='send-btn' onClick={handleSendComment}>
              发送
            </Button>
          </View>
        </View>

        {/* 表情选择器 */}
        {showEmojiPicker && (
          <View className='emoji-picker'>
            <ScrollView className='emoji-list' scrollY>
              {EMOJIS.map((emoji, index) => (
                <Text
                  key={index}
                  className='emoji-item'
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 快捷操作按钮 */}
        <View className='quick-actions'>
          <View
            className={`action-btn ${topic.isLiked ? 'active' : ''}`}
            onClick={handleLikeTopic}
          >
            <Text className='action-icon'>❤️</Text>
            <Text className='action-text'>{topic.likesCount}</Text>
          </View>

          {topic.type === 'supply' && (
            <Button
              className={`interest-btn ${topic.isInterested ? 'active' : ''}`}
              onClick={handleInterested}
            >
              <Text className='btn-icon'>👂</Text>
              <Text className='btn-text'>
                {topic.isInterested ? '已想听' : '想听'}
              </Text>
            </Button>
          )}

          <View className='action-btn'>
            <Text className='action-icon'>📤</Text>
            <Text className='action-text'>分享</Text>
          </View>
        </View>
      </View>
    </View>
  )
}