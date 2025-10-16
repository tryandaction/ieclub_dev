// ==================== 空状态组件（增强版） ====================

import { View, Text } from '@tarojs/components'
import './index.scss'

interface EmptyStateProps {
  title: string
  description?: string
  actionText?: string
  onAction?: () => void
}

export default function EmptyState({
  title,
  description,
  actionText,
  onAction
}: EmptyStateProps) {
  return (
    <View className='empty-state'>
      <View className='empty-icon'>📭</View>
      <Text className='empty-title'>{title}</Text>
      {description && <Text className='empty-description'>{description}</Text>}
      {actionText && onAction && (
        <View className='empty-action' onClick={onAction}>
          {actionText}
        </View>
      )}
    </View>
  )
}