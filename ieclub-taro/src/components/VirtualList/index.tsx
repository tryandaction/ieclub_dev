/**
 * 虚拟列表组件 - 优化长列表性能
 * 
 * 特性：
 * - 只渲染可见区域的元素
 * - 动态高度支持
 * - 滚动平滑
 * - 内存优化
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { View, ScrollView } from '@tarojs/components'
import './index.scss'

interface VirtualListProps<T> {
  data: T[]
  itemHeight: number | ((item: T, index: number) => number)
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number // 预渲染的额外项数
  onEndReached?: () => void
  onEndReachedThreshold?: number
  className?: string
  style?: React.CSSProperties
}

function VirtualList<T = any>(props: VirtualListProps<T>) {
  const {
    data,
    itemHeight,
    renderItem,
    overscan = 3,
    onEndReached,
    onEndReachedThreshold = 0.8,
    className = '',
    style = {}
  } = props

  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const scrollViewRef = useRef<any>()

  // 获取单项高度
  const getItemHeight = useCallback((item: T, index: number): number => {
    return typeof itemHeight === 'function' 
      ? itemHeight(item, index) 
      : itemHeight
  }, [itemHeight])

  // 计算每项的位置
  const itemOffsets = useMemo(() => {
    const offsets: number[] = [0]
    let offset = 0

    for (let i = 0; i < data.length; i++) {
      offset += getItemHeight(data[i], i)
      offsets.push(offset)
    }

    return offsets
  }, [data, getItemHeight])

  // 总高度
  const totalHeight = useMemo(() => {
    return itemOffsets[itemOffsets.length - 1] || 0
  }, [itemOffsets])

  // 查找可见范围
  const visibleRange = useMemo(() => {
    if (data.length === 0) {
      return { start: 0, end: 0 }
    }

    // 二分查找起始索引
    let start = 0
    let end = data.length - 1

    while (start <= end) {
      const mid = Math.floor((start + end) / 2)
      const offset = itemOffsets[mid]

      if (offset < scrollTop) {
        start = mid + 1
      } else {
        end = mid - 1
      }
    }

    const startIndex = Math.max(0, start - overscan)

    // 查找结束索引
    const viewportBottom = scrollTop + containerHeight
    start = startIndex
    end = data.length - 1

    while (start <= end) {
      const mid = Math.floor((start + end) / 2)
      const offset = itemOffsets[mid]

      if (offset <= viewportBottom) {
        start = mid + 1
      } else {
        end = mid - 1
      }
    }

    const endIndex = Math.min(data.length - 1, end + overscan)

    return { start: startIndex, end: endIndex }
  }, [data.length, itemOffsets, scrollTop, containerHeight, overscan])

  // 可见项
  const visibleItems = useMemo(() => {
    const items: Array<{ item: T; index: number; offset: number; height: number }> = []

    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      items.push({
        item: data[i],
        index: i,
        offset: itemOffsets[i],
        height: getItemHeight(data[i], i)
      })
    }

    return items
  }, [data, visibleRange, itemOffsets, getItemHeight])

  // 滚动事件
  const handleScroll = useCallback((e: any) => {
    const { scrollTop, scrollHeight } = e.detail

    setScrollTop(scrollTop)

    // 触底加载
    if (onEndReached && containerHeight > 0) {
      const threshold = scrollHeight * onEndReachedThreshold
      if (scrollTop + containerHeight >= threshold) {
        onEndReached()
      }
    }
  }, [containerHeight, onEndReached, onEndReachedThreshold])

  // 获取容器高度
  useEffect(() => {
    if (process.env.TARO_ENV === 'h5') {
      const updateHeight = () => {
        setContainerHeight(window.innerHeight)
      }
      
      updateHeight()
      window.addEventListener('resize', updateHeight)
      
      return () => window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return (
    <ScrollView
      ref={scrollViewRef}
      className={`virtual-list ${className}`}
      style={style}
      scrollY
      onScroll={handleScroll}
      scrollWithAnimation={false}
    >
      <View className="virtual-list-spacer" style={{ height: `${totalHeight}px` }}>
        {visibleItems.map(({ item, index, offset, height }) => (
          <View
            key={index}
            className="virtual-list-item"
            style={{
              position: 'absolute',
              top: `${offset}px`,
              left: 0,
              right: 0,
              height: `${height}px`
            }}
          >
            {renderItem(item, index)}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

export default React.memo(VirtualList) as typeof VirtualList

