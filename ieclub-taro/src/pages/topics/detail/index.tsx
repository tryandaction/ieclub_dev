// ==================== 话题详情页面（增强版） ====================

import { View, ScrollView, Image, Text } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { useTopicStore } from '../../../store/topic'
import { useCommentStore } from '../../../store/comment'
import CommentList from '../../../components/CommentList'
import CommentInput from '../../../components/CommentInput'
import LoadingSpinner from '../../../components/LoadingSpinner'
import { formatRelativeTime } from '../../../utils/format'
import './index.scss'

export default function TopicDetailPage() {
  const router = useRouter()
  const topicId = router.params.id!

  const { currentTopic, fetchTopicDetail, likeTopic, unlikeTopic } = useTopicStore()
  const { comments, fetchComments, createComment, replyingTo, setReplyingTo } = useCommentStore()

  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchTopicDetail(topicId),
        fetchComments(topicId)
      ])
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [topicId, fetchTopicDetail, fetchComments])

  useEffect(() => {
    loadData()

    return () => {
      setReplyingTo(null)
    }
  }, [topicId, loadData, setReplyingTo])

  // 点赞/取消点赞
  const handleLike = async () => {
    if (!currentTopic) return

    try {
      if (currentTopic.isLiked) {
        await unlikeTopic(topicId)
      } else {
        await likeTopic(topicId)
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
    }
  }

  // 发送评论
  const handleSendComment = async (content: string) => {
    try {
      await createComment({
        topicId,
        content,
        parentId: replyingTo?.id
      })

      setReplyingTo(null)

      // 刷新评论列表
      await fetchComments(topicId)
    } catch (error) {
      console.error('发送评论失败:', error)
    }
  }

  // 预览图片
  const previewImage = (index: number) => {
    if (!currentTopic?.images) return

    Taro.previewImage({
      urls: currentTopic.images,
      current: currentTopic.images[index]
    })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!currentTopic) {
    return (
      <View className='error-state'>
        <Text>话题不存在</Text>
      </View>
    )
  }

  return (
    <View className='topic-detail-page'>
      <ScrollView className='detail-scroll' scrollY>
        {/* 作者信息 */}
        <View className='author-section'>
          <Image
            className='avatar'
            src={currentTopic.author.avatar}
            mode='aspectFill'
          />
          <View className='author-info'>
            <Text className='nickname'>{currentTopic.author.nickname}</Text>
            <Text className='time'>{formatRelativeTime(currentTopic.createdAt)}</Text>
          </View>
        </View>

        {/* 话题标题 */}
        <View className='title-section'>
          <Text className='title'>{currentTopic.title}</Text>
        </View>

        {/* 话题内容 */}
        <View className='content-section'>
          <Text className='content'>{currentTopic.content}</Text>
        </View>

        {/* 图片列表 */}
        {currentTopic.images && currentTopic.images.length > 0 && (
          <View className='images-section'>
            {currentTopic.images.map((img, index) => (
              <Image
                key={index}
                className='image-item'
                src={img}
                mode='aspectFill'
                onClick={() => previewImage(index)}
              />
            ))}
          </View>
        )}

        {/* 标签 */}
        {currentTopic.tags && currentTopic.tags.length > 0 && (
          <View className='tags-section'>
            {currentTopic.tags.map(tag => (
              <View key={tag} className='tag'>#{tag}</View>
            ))}
          </View>
        )}

        {/* 统计信息 */}
        <View className='stats-section'>
          <View className='stat-item'>
            <Text className='stat-value'>{currentTopic.viewsCount}</Text>
            <Text className='stat-label'>浏览</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{currentTopic.likesCount}</Text>
            <Text className='stat-label'>点赞</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{currentTopic.commentsCount}</Text>
            <Text className='stat-label'>评论</Text>
          </View>
        </View>

        {/* 评论列表 */}
        <View className='comments-section'>
          <View className='comments-header'>
            <Text className='comments-title'>评论 {currentTopic.commentsCount}</Text>
          </View>

          <CommentList
            comments={comments}
            onReply={setReplyingTo}
          />
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className='bottom-bar'>
        <CommentInput
          placeholder={replyingTo ? `回复 @${replyingTo.author.nickname}` : '写下你的评论...'}
          onSend={handleSendComment}
          onCancel={() => setReplyingTo(null)}
        />

        <View className='action-btns'>
          <View
            className={`action-btn ${currentTopic.isLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            <Text className='icon'>❤️</Text>
            <Text className='label'>{currentTopic.likesCount}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}