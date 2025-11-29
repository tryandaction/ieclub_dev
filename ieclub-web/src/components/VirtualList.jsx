import { useState, useRef, useEffect, useCallback, useMemo } from 'react'

/**
 * 虚拟滚动列表组件
 * 只渲染可视区域内的元素，大幅提升长列表性能
 */
export default function VirtualList({
  items = [],
  itemHeight = 100, // 单个项目高度（固定高度模式）
  overscan = 5, // 额外渲染的项目数量（上下各5个）
  containerHeight = 'calc(100vh - 200px)',
  renderItem, // (item, index) => ReactNode
  onEndReached, // 触底回调
  endReachedThreshold = 200, // 触底阈值
  loading = false,
  loadingComponent = null,
  emptyComponent = null,
  className = '',
  itemClassName = '',
}) {
  const containerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerActualHeight, setContainerActualHeight] = useState(0)

  // 计算总高度
  const totalHeight = items.length * itemHeight

  // 计算可见项目范围
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerActualHeight) / itemHeight) + overscan
    )
    return { startIndex, endIndex }
  }, [scrollTop, containerActualHeight, itemHeight, items.length, overscan])

  // 获取可见项目
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }))
  }, [items, visibleRange])

  // 处理滚动
  const handleScroll = useCallback((e) => {
    const { scrollTop: newScrollTop, scrollHeight, clientHeight } = e.target
    setScrollTop(newScrollTop)

    // 触底检测
    if (onEndReached && scrollHeight - newScrollTop - clientHeight < endReachedThreshold) {
      onEndReached()
    }
  }, [onEndReached, endReachedThreshold])

  // 监听容器高度变化
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerActualHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(container)
    setContainerActualHeight(container.clientHeight)

    return () => resizeObserver.disconnect()
  }, [])

  // 空状态
  if (items.length === 0 && !loading) {
    return emptyComponent || (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <span className="text-6xl mb-4">📭</span>
        <span>暂无内容</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* 占位容器，撑起总高度 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 只渲染可见项目 */}
        {visibleItems.map(({ item, index }) => (
          <div
            key={item.id || index}
            className={itemClassName}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* 加载状态 */}
      {loading && (
        loadingComponent || (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        )
      )}
    </div>
  )
}

/**
 * 动态高度虚拟滚动列表
 * 支持不同高度的列表项
 */
export function DynamicVirtualList({
  items = [],
  estimatedItemHeight = 100, // 预估项目高度
  overscan = 3,
  containerHeight = 'calc(100vh - 200px)',
  renderItem,
  onEndReached,
  endReachedThreshold = 200,
  loading = false,
  className = '',
}) {
  const containerRef = useRef(null)
  const itemHeights = useRef(new Map()) // 存储每个项目的实际高度
  const [scrollTop, setScrollTop] = useState(0)
  const [containerActualHeight, setContainerActualHeight] = useState(0)
  const [, forceUpdate] = useState(0)

  // 获取项目高度
  const getItemHeight = (index) => {
    return itemHeights.current.get(index) || estimatedItemHeight
  }

  // 计算项目位置
  const getItemOffset = (index) => {
    let offset = 0
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i)
    }
    return offset
  }

  // 计算总高度
  const getTotalHeight = () => {
    let height = 0
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i)
    }
    return height
  }

  // 计算可见范围
  const getVisibleRange = () => {
    let startIndex = 0
    let offset = 0
    
    // 找到起始索引
    while (startIndex < items.length && offset + getItemHeight(startIndex) < scrollTop) {
      offset += getItemHeight(startIndex)
      startIndex++
    }
    startIndex = Math.max(0, startIndex - overscan)

    // 找到结束索引
    let endIndex = startIndex
    offset = getItemOffset(startIndex)
    while (endIndex < items.length && offset < scrollTop + containerActualHeight) {
      offset += getItemHeight(endIndex)
      endIndex++
    }
    endIndex = Math.min(items.length - 1, endIndex + overscan)

    return { startIndex, endIndex }
  }

  const { startIndex, endIndex } = getVisibleRange()

  // 测量项目高度
  const measureItem = useCallback((index, element) => {
    if (!element) return
    const height = element.getBoundingClientRect().height
    if (itemHeights.current.get(index) !== height) {
      itemHeights.current.set(index, height)
      forceUpdate(n => n + 1)
    }
  }, [])

  // 处理滚动
  const handleScroll = useCallback((e) => {
    const { scrollTop: newScrollTop, scrollHeight, clientHeight } = e.target
    setScrollTop(newScrollTop)

    if (onEndReached && scrollHeight - newScrollTop - clientHeight < endReachedThreshold) {
      onEndReached()
    }
  }, [onEndReached, endReachedThreshold])

  // 监听容器高度变化
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerActualHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(container)
    setContainerActualHeight(container.clientHeight)

    return () => resizeObserver.disconnect()
  }, [])

  const visibleItems = items.slice(startIndex, endIndex + 1)

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: getTotalHeight(), position: 'relative' }}>
        {visibleItems.map((item, i) => {
          const index = startIndex + i
          return (
            <div
              key={item.id || index}
              ref={(el) => measureItem(index, el)}
              style={{
                position: 'absolute',
                top: getItemOffset(index),
                left: 0,
                right: 0,
              }}
            >
              {renderItem(item, index)}
            </div>
          )
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

/**
 * 无限滚动容器（简化版）
 * 用于普通列表的触底加载
 */
export function InfiniteScroll({
  children,
  onLoadMore,
  hasMore = true,
  loading = false,
  threshold = 200,
  className = '',
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      if (hasMore && !loading && scrollHeight - scrollTop - clientHeight < threshold) {
        onLoadMore?.()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMore, loading, onLoadMore, threshold])

  return (
    <div ref={containerRef} className={`overflow-auto ${className}`}>
      {children}
      
      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      )}
      
      {!hasMore && (
        <div className="text-center py-4 text-gray-400 text-sm">
          已经到底啦 ~
        </div>
      )}
    </div>
  )
}
