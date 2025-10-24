/**
 * 懒加载图片组件
 * 
 * 特性：
 * - IntersectionObserver 懒加载
 * - 占位图
 * - 加载失败处理
 * - 淡入动画
 */

import React, { useState, useRef, useEffect } from 'react'
import { Image, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface LazyImageProps {
  src: string
  placeholder?: string
  fallback?: string
  className?: string
  style?: React.CSSProperties
  mode?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix'
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
}

const LazyImage: React.FC<LazyImageProps> = (props) => {
  const {
    src,
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3C/svg%3E',
    fallback,
    className = '',
    style = {},
    mode = 'aspectFill',
    onClick,
    onLoad,
    onError
  } = props

  const [currentSrc, setCurrentSrc] = useState(placeholder)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [visible, setVisible] = useState(false)
  
  const imgRef = useRef<HTMLImageElement>()
  const observerRef = useRef<IntersectionObserver>()

  // 懒加载逻辑
  useEffect(() => {
    if (process.env.TARO_ENV !== 'h5' || !imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px'
      }
    )

    observer.observe(imgRef.current)
    observerRef.current = observer

    return () => {
      observer.disconnect()
    }
  }, [])

  // 加载真实图片
  useEffect(() => {
    if (!visible || !src) return

    // 预加载图片
    const img = new window.Image()
    
    img.onload = () => {
      setCurrentSrc(src)
      setLoaded(true)
      setError(false)
      onLoad?.()
    }

    img.onerror = () => {
      setError(true)
      if (fallback) {
        setCurrentSrc(fallback)
      }
      onError?.()
    }

    img.src = src
  }, [visible, src, fallback, onLoad, onError])

  // 小程序环境直接加载
  useEffect(() => {
    if (process.env.TARO_ENV !== 'h5') {
      setVisible(true)
    }
  }, [])

  return (
    <View 
      className={`lazy-image ${className} ${loaded ? 'loaded' : ''} ${error ? 'error' : ''}`}
      style={style}
      onClick={onClick}
    >
      <Image
        ref={imgRef as any}
        src={currentSrc}
        mode={mode}
        className="lazy-image__img"
        onLoad={() => {
          if (process.env.TARO_ENV !== 'h5') {
            setLoaded(true)
            onLoad?.()
          }
        }}
        onError={() => {
          setError(true)
          if (fallback && process.env.TARO_ENV !== 'h5') {
            setCurrentSrc(fallback)
          }
          onError?.()
        }}
      />
      
      {!loaded && !error && (
        <View className="lazy-image__loading">
          <View className="lazy-image__spinner" />
        </View>
      )}
    </View>
  )
}

export default React.memo(LazyImage)

