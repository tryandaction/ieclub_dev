// ==================== 悬浮操作按钮组件 ====================

import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function FloatingActionButton() {
  const [expanded, setExpanded] = useState(false)

  const actions = [
    { id: 'demand', label: '发布需求', icon: '🎯', color: '#ef4444' },
    { id: 'share', label: '分享经验', icon: '💡', color: '#3b82f6' },
    { id: 'project', label: '发起项目', icon: '🚀', color: '#8b5cf6' },
    { id: 'event', label: '组织活动', icon: '📅', color: '#10b981' },
    { id: 'question', label: '提问求助', icon: '❓', color: '#f59e0b' }
  ]

  const handleActionClick = (actionId: string) => {
    setExpanded(false)
    Taro.navigateTo({
      url: `/pages/create-topic/index?type=${actionId}`
    })
  }

  return (
    <View className='floating-action-button'>
      {expanded && (
        <>
          <View className='fab-mask' onClick={() => setExpanded(false)} />
          <View className='fab-menu'>
            {actions.map((action, index) => (
              <View
                key={action.id}
                className='fab-menu-item'
                style={{
                  animationDelay: `${index * 50}ms`,
                  background: action.color
                }}
                onClick={() => handleActionClick(action.id)}
              >
                <Text className='fab-icon'>{action.icon}</Text>
                <Text className='fab-label'>{action.label}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      
      <View
        className={`fab-main ${expanded ? 'expanded' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <Text className='fab-icon'>{expanded ? '✕' : '✨'}</Text>
      </View>
    </View>
  )
}