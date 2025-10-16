// ==================== 虚拟列表性能优化 ====================

import { View, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import EnhancedTopicCard from '../EnhancedTopicCard'
import type { EnhancedTopic } from '../../types'
import './index.scss'

interface VirtualTopicListProps {
  topics: EnhancedTopic[]
  onLoadMore?: () => void
  onTopicClick?: (topicId: string) => void
}

const ITEM_HEIGHT = 300  // 每个卡片的估计高度
const BUFFER_SIZE = 3     // 上下各预渲染3个

export default function VirtualTopicList({
  topics,
  onLoadMore,
  onTopicClick
}: VirtualTopicListProps) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 })

  // 计算可见区域
  const calculateVisibleRange = (currentScrollTop: number, containerHeight: number) => {
    const start = Math.floor(currentScrollTop / ITEM_HEIGHT)
    const end = Math.ceil((currentScrollTop + containerHeight) / ITEM_HEIGHT)

    return {
      start: Math.max(0, start - BUFFER_SIZE),
      end: Math.min(topics.length, end + BUFFER_SIZE)
    }
  }

  // 滚动处理
  const handleScroll = (e: any) => {
    const { scrollTop: currentScrollTop, scrollHeight, clientHeight } = e.detail || e.target

    // 计算新的可见范围
    const newRange = calculateVisibleRange(currentScrollTop, clientHeight)
    if (newRange.start !== visibleRange.start || newRange.end !== visibleRange.end) {
      setVisibleRange(newRange)
    }

    // 触底加载
    if (scrollHeight - currentScrollTop - clientHeight < 100) {
      onLoadMore?.()
    }
  }

  // 获取可见的话题
  const visibleTopics = topics.slice(visibleRange.start, visibleRange.end)

  // 计算偏移量
  const offsetY = visibleRange.start * ITEM_HEIGHT

  return (
    <ScrollView
      className='virtual-topic-list'
      scrollY
      onScroll={handleScroll}
      style={{ height: '100vh' }}
    >
      {/* 占位容器，撑起总高度 */}
      <View
        className='list-placeholder'
        style={{ height: `${topics.length * ITEM_HEIGHT}px`, position: 'relative' }}
      >
        {/* 可见内容容器 */}
        <View
          className='list-content'
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleTopics.map(topic => (
            <View key={topic.id} className='list-item'>
              <EnhancedTopicCard
                topic={topic}
                onClick={() => onTopicClick?.(topic.id)}
              />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}