import { useState, useRef, useEffect } from 'react'

/**
 * 图片懒加载组件
 * 使用 Intersection Observer API 实现图片懒加载
 * 支持占位图、加载动画、错误处理
 */
export default function LazyImage({
  src,
  alt = '',
  className = '',
  placeholderClassName = '',
  errorClassName = '',
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  fallback = null, // 加载失败时显示的备用内容
  placeholder = null, // 自定义占位符
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [threshold, rootMargin])

  const handleLoad = (e) => {
    setIsLoaded(true)
    onLoad?.(e)
  }

  const handleError = (e) => {
    setHasError(true)
    onError?.(e)
  }

  // 处理图片URL
  const getImageUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `https://ieclub.online${url}`
    return url
  }

  // 错误状态显示
  if (hasError) {
    if (fallback) return fallback
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${errorClassName || className}`}
      >
        <span className="text-gray-400 text-2xl">🖼️</span>
      </div>
    )
  }

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {/* 占位符/加载动画 */}
      {!isLoaded && (
        <div className={`absolute inset-0 ${placeholderClassName || 'bg-gray-100 animate-pulse'}`}>
          {placeholder || (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
      
      {/* 实际图片 */}
      {isInView && (
        <img
          src={getImageUrl(src)}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  )
}

/**
 * 头像懒加载组件
 * 专门用于用户头像，支持文字头像降级
 */
export function LazyAvatar({
  src,
  name = '用户',
  size = 40,
  className = '',
  textClassName = '',
}) {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // 获取头像URL
  const getAvatarUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `https://ieclub.online${url}`
    return url
  }

  // 生成背景色
  const getBackgroundColor = (str) => {
    const colors = [
      'from-purple-500 to-purple-600',
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
    ]
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const avatarUrl = getAvatarUrl(src)
  const showImage = avatarUrl && !hasError
  const initial = (name || '用')[0]

  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 文字头像背景（始终渲染作为降级） */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getBackgroundColor(name)} flex items-center justify-center text-white font-bold ${textClassName}`}
        style={{ fontSize: size * 0.4 }}
      >
        {initial}
      </div>

      {/* 图片头像 */}
      {showImage && (
        <img
          src={avatarUrl}
          alt={name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}

      {/* 加载动画 */}
      {showImage && !isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}

/**
 * 图片画廊懒加载组件
 * 用于话题详情页的多图展示
 */
export function LazyImageGallery({
  images = [],
  className = '',
  onImageClick,
}) {
  if (!images || images.length === 0) return null

  const getGridClass = () => {
    switch (images.length) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-2'
      case 3:
        return 'grid-cols-3'
      case 4:
        return 'grid-cols-2'
      default:
        return 'grid-cols-3'
    }
  }

  return (
    <div className={`grid gap-2 ${getGridClass()} ${className}`}>
      {images.slice(0, 9).map((img, index) => (
        <div
          key={index}
          className={`relative overflow-hidden rounded-lg cursor-pointer ${
            images.length === 1 ? 'aspect-video' : 'aspect-square'
          }`}
          onClick={() => onImageClick?.(index)}
        >
          <LazyImage
            src={typeof img === 'string' ? img : img.url}
            alt={`图片 ${index + 1}`}
            className="w-full h-full"
          />
          {/* 超过9张时显示数量 */}
          {index === 8 && images.length > 9 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                +{images.length - 9}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
