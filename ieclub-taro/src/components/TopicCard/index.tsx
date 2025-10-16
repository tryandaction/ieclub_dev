// ==================== 话题卡片组件（增强版） ====================

import { View, Image, Text } from '@tarojs/components'
import { formatRelativeTime } from '../../utils/format'
import type { Topic } from '../../types'
import './index.scss'

interface TopicCardProps {
  topic: Topic
  onClick?: () => void
}

export default function TopicCard({ topic, onClick }: TopicCardProps) {
  return (
    <View className='topic-card' onClick={onClick}>
      {/* 作者信息 */}
      <View className='card-header'>
        <Image className='avatar' src={topic.author.avatar} mode='aspectFill' />
        <View className='author-info'>
          <Text className='nickname'>{topic.author.nickname}</Text>
          <Text className='time'>{formatRelativeTime(topic.createdAt)}</Text>
        </View>
      </View>

      {/* 话题内容 */}
      <View className='card-content'>
        <Text className='title'>{topic.title}</Text>
        <Text className='content'>{topic.content}</Text>
      </View>

      {/* 图片（最多显示3张） */}
      {topic.images && topic.images.length > 0 && (
        <View className='card-images'>
          {topic.images.slice(0, 3).map((img, index) => (
            <Image
              key={index}
              className='image-item'
              src={img}
              mode='aspectFill'
            />
          ))}
        </View>
      )}

      {/* 标签 */}
      {topic.tags && topic.tags.length > 0 && (
        <View className='card-tags'>
          {topic.tags.slice(0, 3).map(tag => (
            <View key={tag} className='tag'>#{tag}</View>
          ))}
        </View>
      )}

      {/* 统计信息 */}
      <View className='card-footer'>
        <View className='stat-item'>
          <Text className='icon'>👁</Text>
          <Text className='value'>{topic.viewsCount}</Text>
        </View>
        <View className='stat-item'>
          <Text className='icon'>❤️</Text>
          <Text className='value'>{topic.likesCount}</Text>
        </View>
        <View className='stat-item'>
          <Text className='icon'>💬</Text>
          <Text className='value'>{topic.commentsCount}</Text>
        </View>
      </View>
    </View>
  )
}