import { useState, useRef, useEffect } from 'react'

/**
 * 下拉刷新组件
 */
export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef(null)
  const touchStartY = useRef(0)
  const maxPullDistance = 100

  const handleTouchStart = (e) => {
    // 只在顶部时启用下拉
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e) => {
    if (touchStartY.current === 0 || refreshing) return

    const currentY = e.touches[0].clientY
    const distance = currentY - touchStartY.current

    // 只处理下拉（向下滑动）
    if (distance > 0 && window.scrollY === 0) {
      e.preventDefault()
      setPulling(true)
      // 使用阻尼效果
      const damping = 0.5
      const adjustedDistance = Math.min(distance * damping, maxPullDistance)
      setPullDistance(adjustedDistance)
    }
  }

  const handleTouchEnd = async () => {
    if (pulling) {
      // 如果下拉距离足够，触发刷新
      if (pullDistance >= maxPullDistance * 0.8 && !refreshing) {
        setRefreshing(true)
        try {
          await onRefresh?.()
        } catch (error) {
          console.error('刷新失败:', error)
        } finally {
          setRefreshing(false)
        }
      }
    }

    // 重置状态
    setPulling(false)
    setPullDistance(0)
    touchStartY.current = 0
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pulling, pullDistance, refreshing])

  const getStatusText = () => {
    if (refreshing) return '刷新中...'
    if (pullDistance >= maxPullDistance * 0.8) return '松开刷新'
    if (pulling) return '下拉刷新'
    return ''
  }

  const getIconRotation = () => {
    if (refreshing) return 'rotate-180'
    if (pullDistance >= maxPullDistance * 0.8) return 'rotate-180'
    return 'rotate-0'
  }

  return (
    <div ref={containerRef} className="relative">
      {/* 刷新指示器 */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 overflow-hidden"
        style={{
          height: refreshing ? '60px' : `${pullDistance}px`,
          opacity: pulling || refreshing ? 1 : 0
        }}
      >
        <div className="flex items-center gap-2 text-primary-600">
          {refreshing ? (
            <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          ) : (
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${getIconRotation()}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          )}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
      </div>

      {/* 内容区域 */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${refreshing ? 60 : pullDistance}px)`
        }}
      >
        {children}
      </div>
    </div>
  )
}

