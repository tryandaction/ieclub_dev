// ==================== 增强话题卡片组件 ====================

import { View, Image, Text } from '@tarojs/components'
import { formatRelativeTime } from '@/utils/format'
import { useTopicStore } from '@/store/topic'
import { useActionTracking } from '@/hooks/useAnalytics'
import SmartQuickActions from '../SmartQuickActions'
import type { EnhancedTopic } from '@/types'
import './index.scss'

interface EnhancedTopicCardProps {
  topic: EnhancedTopic
  onClick?: () => void
}

export default function EnhancedTopicCard({ topic, onClick }: EnhancedTopicCardProps) {
  const { handleQuickAction: storeHandleQuickAction } = useTopicStore()
  const { track } = useActionTracking()

  const handleQuickAction = async (actionId: string) => {
    track('quick_action_click', {
      topicId: topic.id,
      action: actionId
    })

    try {
      await storeHandleQuickAction(topic.id, actionId)
    } catch (error) {
      console.error('快速操作失败:', error)
    }
  }

  const getDemandBadge = () => {
    if (!topic.demand) return null
    
    const badges = {
      seeking: { icon: '🎯', label: '求助', color: '#ef4444' },
      offering: { icon: '💡', label: '分享', color: '#10b981' },
      collaboration: { icon: '🤝', label: '求合作', color: '#f59e0b' }
    }
    
    const badge = badges[topic.demand.type]
    return (
      <View className='demand-badge' style={{ background: badge.color }}>
        <Text>{badge.icon} {badge.label}</Text>
      </View>
    )
  }

  return (
    <View className='enhanced-topic-card' onClick={onClick}>
      {/* 头部：作者信息 + 推荐理由 */}
      <View className='card-header'>
        <Image className='avatar' src={topic.author.avatar} mode='aspectFill' />
        <View className='author-info'>
          <Text className='nickname'>{topic.author.nickname}</Text>
          <Text className='time'>{formatRelativeTime(topic.createdAt)}</Text>
        </View>
        
        {topic.recommendation && (
          <View className='recommend-tag'>
            ✨ {topic.recommendation.reason}
          </View>
        )}
      </View>

      {/* 需求标识 */}
      {getDemandBadge()}

      {/* 内容区 */}
      <View className='card-content'>
        <Text className='title'>{topic.title}</Text>
        <Text className='content'>{topic.content}</Text>
        
        {/* 图片网格 */}
        {topic.media.images && topic.media.images.length > 0 && (
          <View className='images-grid'>
            {topic.media.images.slice(0, 3).map((img, index) => (
              <Image
                key={index}
                className='image-item'
                src={img}
                mode='aspectFill'
              />
            ))}
            {topic.media.images.length > 3 && (
              <View className='more-images'>+{topic.media.images.length - 3}</View>
            )}
          </View>
        )}
        
        {/* 文档附件 */}
        {topic.media.documents && topic.media.documents.length > 0 && (
          <View className='documents-list'>
            {topic.media.documents.map(doc => (
              <View key={doc.id} className='document-item'>
                <View className='doc-icon'>📄</View>
                <View className='doc-info'>
                  <Text className='doc-name'>{doc.name}</Text>
                  <Text className='doc-meta'>{formatFileSize(doc.size)} · {doc.pageCount}页</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* 链接卡片 */}
        {topic.media.linkCards && topic.media.linkCards.length > 0 && (
          <View className='link-cards'>
            {topic.media.linkCards.map((link, index) => (
              <View key={index} className='link-card'>
                <Image className='link-cover' src={link.coverImage} mode='aspectFill' />
                <View className='link-info'>
                  <Text className='link-title'>{link.title}</Text>
                  <Text className='link-desc'>{link.description}</Text>
                  <View className='link-source'>
                    {link.favicon && <Image className='favicon' src={link.favicon} />}
                    <Text className='source-name'>{getSourceName(link.source)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 标签 */}
      {(topic.tags.length > 0 || topic.demand?.skillsRequired) && (
        <View className='tags-section'>
          {topic.tags.map(tag => (
            <View key={tag} className='tag'>#{tag}</View>
          ))}
          {topic.demand?.skillsRequired?.map(skill => (
            <View key={skill} className='skill-tag'>💪 {skill}</View>
          ))}
        </View>
      )}

      {/* 统计信息 */}
      <View className='stats-section'>
        <View className='stat-item'>
          <Text className='icon'>👁</Text>
          <Text className='value'>{formatNumber(topic.stats.views)}</Text>
        </View>
        <View className='stat-item'>
          <Text className='icon'>❤️</Text>
          <Text className='value'>{formatNumber(topic.stats.likes)}</Text>
        </View>
        <View className='stat-item'>
          <Text className='icon'>💬</Text>
          <Text className='value'>{formatNumber(topic.stats.comments)}</Text>
        </View>
        
        {topic.stats.interestedCount > 0 && (
          <View className='stat-item highlight'>
            <Text className='icon'>👂</Text>
            <Text className='value'>{topic.stats.interestedCount}人想听</Text>
          </View>
        )}
      </View>

      {/* 智能快速操作栏 */}
      <SmartQuickActions
        topic={topic}
        onAction={handleQuickAction}
      />

      {/* 热度指示器 */}
      {topic.status.isHot && topic.stats.realtimeViewers > 0 && (
        <View className='hot-indicator'>
          🔥 正在热议 · {topic.stats.realtimeViewers}人在看
        </View>
      )}
    </View>
  )
}

// 辅助函数
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatNumber(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 10000) return (num / 1000).toFixed(1) + 'k'
  return (num / 10000).toFixed(1) + 'w'
}

function getSourceName(source: string): string {
  const names: Record<string, string> = {
    wechat: '微信公众号',
    zhihu: '知乎',
    bilibili: 'B站',
    github: 'GitHub',
    general: '网页链接'
  }
  return names[source] || '链接'
}