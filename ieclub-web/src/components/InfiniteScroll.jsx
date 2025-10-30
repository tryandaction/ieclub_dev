import { useEffect, useRef, useState } from 'react'
import { InlineLoading } from './Loading'

/**
 * 无限滚动组件
 */
export default function InfiniteScroll({
  children,
  hasMore = true,
  onLoadMore,
  loading = false,
  threshold = 300 // 距离底部多少像素时触发加载
}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const loaderRef = useRef(null)

  useEffect(() => {
    const loader = loaderRef.current
    if (!loader) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        setIsIntersecting(first.isIntersecting)
      },
      {
        rootMargin: `${threshold}px`
      }
    )

    observer.observe(loader)

    return () => {
      if (loader) {
        observer.unobserve(loader)
      }
    }
  }, [threshold])

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      onLoadMore?.()
    }
  }, [isIntersecting, hasMore, loading, onLoadMore])

  return (
    <div>
      {children}
      
      {/* 加载指示器 */}
      <div ref={loaderRef} className="py-8">
        {loading && (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <InlineLoading color="primary" size="lg" />
            <span className="text-sm">加载中...</span>
          </div>
        )}
        
        {!loading && !hasMore && (
          <div className="text-center text-gray-400 text-sm">
            已经到底啦 ~
          </div>
        )}
      </div>
    </div>
  )
}

