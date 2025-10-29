/**
 * Loading 加载组件
 * 支持全屏和内联两种模式
 */
export default function Loading({ 
  fullscreen = false, 
  size = 'md',
  text = '加载中...' 
}) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  }

  const spinnerSize = sizeClasses[size] || sizeClasses.md

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          {/* 旋转加载器 */}
          <div className={`${spinnerSize} mx-auto mb-4 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin`}></div>
          
          {/* 加载文字 */}
          {text && (
            <p className="text-gray-600 text-sm font-medium">{text}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        {/* 旋转加载器 */}
        <div className={`${spinnerSize} mx-auto mb-2 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin`}></div>
        
        {/* 加载文字 */}
        {text && (
          <p className="text-gray-500 text-sm">{text}</p>
        )}
      </div>
    </div>
  )
}

/**
 * 骨架屏组件 - 用于内容加载占位
 */
export function Skeleton({ className = '', variant = 'rect' }) {
  const variants = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4'
  }

  return (
    <div 
      className={`bg-gray-200 animate-pulse ${variants[variant]} ${className}`}
    />
  )
}

/**
 * 卡片骨架屏
 */
export function CardSkeleton() {
  return (
    <div className="card space-y-4">
      <Skeleton variant="rect" className="h-48 w-full" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
      <div className="flex gap-3">
        <Skeleton variant="circle" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-1/4" />
        </div>
      </div>
    </div>
  )
}

