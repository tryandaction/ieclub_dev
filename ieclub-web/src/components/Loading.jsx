import { useEffect } from 'react'

/**
 * 全局Loading组件
 */
export default function Loading({ show = false, text = '加载中...', fullscreen = false }) {
  useEffect(() => {
    if (show && fullscreen) {
      // 防止页面滚动
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [show, fullscreen])

  if (!show) return null

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl">
          <div className="loader mb-4"></div>
          <p className="text-gray-600 font-medium">{text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center">
        <div className="loader mb-3"></div>
        <p className="text-gray-500 text-sm">{text}</p>
      </div>
    </div>
  )
}

/**
 * 内联Loading - 用于按钮等小组件
 */
export function InlineLoading({ size = 'md', color = 'white' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-3'
  }

  const colorClasses = {
    white: 'border-white/30 border-t-white',
    primary: 'border-primary-200 border-t-primary-600',
    gray: 'border-gray-300 border-t-gray-600'
  }

  return (
    <div 
      className={`inline-block rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
      style={{ borderTopColor: 'currentColor' }}
    />
  )
}

/**
 * 骨架屏Loading - 用于列表加载
 */
export function SkeletonLoading({ count = 3, type = 'card' }) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (type === 'card') {
    return (
      <div className="space-y-4">
        {items.map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'activity') {
    return (
      <div className="space-y-4">
        {items.map(i => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-6">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(i => (
        <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>
      ))}
    </div>
  )
}
