// ==================== 话题卡片组件（增强版） ====================

import { View, Image, Text } from '@tarojs/components'
import { formatRelativeTime } from '@/utils/format'
import type { Topic } from '@/types'
import './index.scss'

interface TopicCardProps {
  topic: Topic
  onClick?: () => void
}

// 分类标签颜色配置（来自开发代码）
const CATEGORY_COLORS = {
  tech: '#1890ff',
  project: '#52c41a',
  life: '#fa8c16',
  event: '#eb2f96',
  resource: '#722ed1'
}

// 话题类型标签（来自开发代码）
const TOPIC_TYPE_LABELS = {
  discussion: '讨论',
  demand: '我想听',
  supply: '我来讲',
  question: '提问'
}

// 格式化数字显示（来自开发代码）
const formatCount = (num: number) => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}

export default function TopicCard({ topic, onClick }: TopicCardProps) {
  return (
    <View className='topic-card' onClick={onClick}>
      {/* 顶部标签栏（来自开发代码的设计） */}
      <View className='topic-header'>
        <View
          className='category-tag'
          style={{ background: CATEGORY_COLORS[topic.category as keyof typeof CATEGORY_COLORS] || '#999' }}
        >
          {topic.category}
        </View>

        {topic.topicType && (
          <View className='type-tag'>
            {TOPIC_TYPE_LABELS[topic.topicType as keyof typeof TOPIC_TYPE_LABELS]}
          </View>
        )}

        {topic.isHot && (
          <View className='hot-tag'>🔥 热门</View>
        )}
      </View>

      {/* 标题 */}
      <View className='topic-title'>{topic.title}</View>

      {/* 内容预览 */}
      <View className='topic-content'>
        {topic.content}
      </View>

      {/* 图片预览（来自开发代码的设计） */}
      {topic.images && topic.images.length > 0 && (
        <View className='topic-images'>
          {topic.images.slice(0, 3).map((img, index) => (
            <Image
              key={index}
              className='topic-image'
              src={img}
              mode='aspectFill'
            />
          ))}
          {topic.images.length > 3 && (
            <View className='more-images'>+{topic.images.length - 3}</View>
          )}
        </View>
      )}

      {/* 标签（来自开发代码的设计） */}
      {topic.tags && topic.tags.length > 0 && (
        <View className='topic-tags'>
          {topic.tags.slice(0, 3).map((tag, index) => (
            <View key={index} className='tag-item'>
              #{tag}
            </View>
          ))}
        </View>
      )}

      {/* 快速操作数据（来自开发代码的设计） */}
      {((topic.wantToHearCount || 0) > 0 || (topic.canHelpCount || 0) > 0) && (
        <View className='quick-stats'>
          {(topic.wantToHearCount || 0) > 0 && (
            <View className='stat-item'>
              <Text className='stat-icon'>👂</Text>
              <Text className='stat-count'>{topic.wantToHearCount} 人想听</Text>
            </View>
          )}
          {(topic.canHelpCount || 0) > 0 && (
            <View className='stat-item'>
              <Text className='stat-icon'>💪</Text>
              <Text className='stat-count'>{topic.canHelpCount} 人能讲</Text>
            </View>
          )}
        </View>
      )}

      {/* 底部信息栏（来自开发代码的设计） */}
      <View className='topic-footer'>
        {/* 作者信息 */}
        <View className='author-info'>
          <Image
            className='author-avatar'
            src={topic.author?.avatar || 'https://via.placeholder.com/40'}
            mode='aspectFill'
          />
          <View className='author-details'>
            <View className='author-name'>
              {topic.author?.nickname}
              {/* 认证图标暂时隐藏，等待User类型完善后启用 */}
              {/* {topic.author?.isCertified && (
                <Text className='certified-icon'>✓</Text>
              )} */}
            </View>
            <View className='topic-time'>
              {formatRelativeTime(topic.createdAt)}
            </View>
          </View>
        </View>

        {/* 互动数据（使用开发代码的格式化函数） */}
        <View className='topic-stats'>
          <View className='stat-item'>
            <Text className='stat-icon'>👁</Text>
            <Text className='stat-text'>{formatCount(topic.viewsCount || 0)}</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-icon'>❤️</Text>
            <Text className='stat-text'>{formatCount(topic.likesCount || 0)}</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-icon'>💬</Text>
            <Text className='stat-text'>{formatCount(topic.commentsCount || 0)}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}