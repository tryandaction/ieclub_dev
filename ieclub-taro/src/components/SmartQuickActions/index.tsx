// ==================== 智能快速操作按钮组件 ====================

import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import type { EnhancedTopic } from '../../types'
import './index.scss'

interface QuickActionConfig {
  primary: {
    id: string
    label: string
    icon: string
    color: string
    description: string
  }
  secondary: Array<{
    id: string
    label: string
    icon: string
  }>
}

// 根据话题类型和需求类型智能配置按钮
function getActionConfig(topic: EnhancedTopic): QuickActionConfig {
  const demandType = topic.demand?.type

  // 求助类话题
  if (demandType === 'seeking') {
    return {
      primary: {
        id: 'offeringHelp',
        label: '我能帮',
        icon: '🤝',
        color: '#10b981',
        description: '提供帮助，解决问题'
      },
      secondary: [
        { id: 'interested', label: '关注进展', icon: '👀' },
        { id: 'bookmark', label: '收藏', icon: '⭐' },
        { id: 'share', label: '转发', icon: '📤' }
      ]
    }
  }

  // 分享类话题
  if (demandType === 'offering' || topic.category === 'share') {
    return {
      primary: {
        id: 'wantToLearn',
        label: '想学',
        icon: '💡',
        color: '#3b82f6',
        description: '对此内容感兴趣'
      },
      secondary: [
        { id: 'askQuestion', label: '有疑问', icon: '❓' },
        { id: 'bookmark', label: '收藏', icon: '⭐' },
        { id: 'share', label: '转发', icon: '📤' }
      ]
    }
  }

  // 项目协作类
  if (demandType === 'collaboration' || topic.category === 'project') {
    return {
      primary: {
        id: 'wantToJoin',
        label: '想加入',
        icon: '🚀',
        color: '#8b5cf6',
        description: '申请加入项目'
      },
      secondary: [
        { id: 'askDetail', label: '了解详情', icon: '📋' },
        { id: 'bookmark', label: '收藏', icon: '⭐' },
        { id: 'share', label: '推荐给朋友', icon: '📤' }
      ]
    }
  }

  // 默认配置
  return {
    primary: {
      id: 'interested',
      label: '感兴趣',
      icon: '❤️',
      color: '#ef4444',
      description: '标记感兴趣'
    },
    secondary: [
      { id: 'comment', label: '评论', icon: '💬' },
      { id: 'bookmark', label: '收藏', icon: '⭐' },
      { id: 'share', label: '分享', icon: '📤' }
    ]
  }
}

interface SmartQuickActionsProps {
  topic: EnhancedTopic
  onAction: (actionId: string) => Promise<void>
}

export default function SmartQuickActions({ topic, onAction }: SmartQuickActionsProps) {
  const config = getActionConfig(topic)
  const [loading, setLoading] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  // 检查是否第一次使用
  const isFirstTime = !Taro.getStorageSync('quick_action_used')

  const handlePrimaryAction = async () => {
    // 第一次使用时显示提示
    if (isFirstTime) {
      setShowTooltip(true)
      Taro.setStorageSync('quick_action_used', true)

      setTimeout(() => {
        setShowTooltip(false)
      }, 3000)
    }

    setLoading(config.primary.id)

    try {
      await onAction(config.primary.id)

      // 触觉反馈
      Taro.vibrateShort({ type: 'light' })

      // 成功提示
      Taro.showToast({
        title: '操作成功',
        icon: 'success',
        duration: 1500
      })

    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleSecondaryAction = async (actionId: string) => {
    setLoading(actionId)

    try {
      if (actionId === 'comment') {
        // 直接跳转到评论区
        Taro.navigateTo({
          url: `/pages/topic-detail/index?id=${topic.id}&focusComment=true`
        })
      } else if (actionId === 'share') {
        // 调用分享
        Taro.showShareMenu({
          withShareTicket: true,
          showShareItems: ['wechatFriends', 'wechatMoment']
        })
      } else {
        await onAction(actionId)
        Taro.showToast({
          title: '操作成功',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <View className='smart-quick-actions'>
      {/* 主要操作按钮 - 大而醒目 */}
      <View
        className='primary-action'
        style={{ background: config.primary.color }}
        onClick={handlePrimaryAction}
      >
        {loading === config.primary.id ? (
          <View className='loading-spinner' />
        ) : (
          <>
            <Text className='action-icon'>{config.primary.icon}</Text>
            <Text className='action-label'>{config.primary.label}</Text>
          </>
        )}

        {/* 首次使用提示 */}
        {showTooltip && (
          <View className='tooltip'>
            <Text>{config.primary.description}</Text>
            <View className='tooltip-arrow' />
          </View>
        )}
      </View>

      {/* 次要操作按钮 - 小而简洁 */}
      <View className='secondary-actions'>
        {config.secondary.map(action => (
          <View
            key={action.id}
            className='secondary-action'
            onClick={() => handleSecondaryAction(action.id)}
          >
            {loading === action.id ? (
              <View className='loading-spinner-small' />
            ) : (
              <>
                <Text className='action-icon-small'>{action.icon}</Text>
                <Text className='action-label-small'>{action.label}</Text>
              </>
            )}
          </View>
        ))}
      </View>
    </View>
  )
}