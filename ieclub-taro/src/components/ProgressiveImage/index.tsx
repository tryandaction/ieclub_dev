// ==================== 渐进式图片加载 ====================

import { Image, View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface ProgressiveImageProps {
  src: string
  placeholder?: string
  alt?: string
  className?: string
  mode?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix' | 'top' | 'bottom' | 'center' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right'
  onLoad?: () => void
  onError?: () => void
}

export default function ProgressiveImage({
  src,
  placeholder,
  alt,
  className = '',
  mode = 'aspectFill',
  onLoad,
  onError
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(placeholder || generatePlaceholder(src))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // 预加载高清图
    Taro.getImageInfo({
      src: src,
      success: () => {
        setCurrentSrc(src)
        setLoading(false)
        onLoad?.()
      },
      fail: () => {
        setError(true)
        setLoading(false)
        onError?.()
      }
    })
  }, [src, onLoad, onError])

  if (error) {
    return (
      <View className={`progressive-image error ${className}`}>
        <View className='error-placeholder'>
          <Text>图片加载失败</Text>
        </View>
      </View>
    )
  }

  return (
    <View className={`progressive-image ${loading ? 'loading' : 'loaded'} ${className}`}>
      <Image
        src={currentSrc}
        mode={mode}
        className={loading ? 'blur' : ''}
        lazyLoad
      />
      {loading && (
        <View className='loading-overlay'>
          <View className='spinner' />
        </View>
      )}
    </View>
  )
}

// 生成缩略图URL
function generatePlaceholder(src: string): string {
  // 使用OSS缩略图服务
  if (src.includes('aliyuncs.com')) {
    return `${src}?x-oss-process=image/resize,w_50/blur,r_50,s_50`
  }

  // 使用腾讯云缩略图
  if (src.includes('myqcloud.com')) {
    return `${src}?imageMogr2/thumbnail/50x/blur/50x50`
  }

  // 返回原图（降级方案）
  return src
}