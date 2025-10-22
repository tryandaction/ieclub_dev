// ==================== 评论列表组件（增强版） ====================

import { View, Image, Text } from '@tarojs/components'
import { formatRelativeTime } from '@/utils/format'
import type { Comment } from '@/types'
import './index.scss'

interface CommentListProps {
  comments: Comment[]
  onReply: (comment: Comment) => void
}

export default function CommentList({ comments, onReply }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <View className='empty-comments'>
        <Text>暂无评论，快来抢沙发吧~</Text>
      </View>
    )
  }

  return (
    <View className='comment-list'>
      {comments.map(comment => (
        <View key={comment.id} className='comment-item'>
          <Image className='avatar' src={comment.author.avatar} mode='aspectFill' />

          <View className='comment-content'>
            <View className='comment-header'>
              <Text className='nickname'>{comment.author.nickname}</Text>
              <Text className='time'>{formatRelativeTime(comment.createdAt)}</Text>
            </View>

            <Text className='content'>{comment.content}</Text>

            {/* 回复内容 */}
            {comment.replyTo && (
              <View className='reply-content'>
                <Text className='reply-text'>
                  回复 @{comment.replyTo.author.nickname}: {comment.replyTo.content}
                </Text>
              </View>
            )}

            <View className='comment-footer'>
              <View className='like-btn'>
                <Text className='icon'>❤️</Text>
                <Text className='count'>{comment.likesCount}</Text>
              </View>
              <View className='reply-btn' onClick={() => onReply(comment)}>
                <Text>回复</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}