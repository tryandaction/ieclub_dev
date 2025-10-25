/**
 * 交叉观察器Hook - 用于无限滚动和懒加载
 */

import { useEffect, useRef, RefObject } from 'react'
import Taro from '@tarojs/taro'

interface UseIntersectionObserverOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
  onIntersect?: () => void
  enabled?: boolean
}

export function useIntersectionObserver(
  targetRef: RefObject<HTMLElement>,
  options: UseIntersectionObserverOptions = {}
) {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0.1,
    onIntersect,
    enabled = true
  } = options

  const observerRef = useRef<IntersectionObserver>()

  useEffect(() => {
    if (!enabled || !targetRef.current) return

    // H5环境使用IntersectionObserver
    if (process.env.TARO_ENV === 'h5') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              onIntersect?.()
            }
          })
        },
        { root, rootMargin, threshold }
      )

      observer.observe(targetRef.current)
      observerRef.current = observer

      return () => {
        observer.disconnect()
      }
    }
    
    // 小程序环境使用createIntersectionObserver
    else {
      const observer = Taro.createIntersectionObserver(targetRef.current)
      
      observer
        .relativeToViewport({ bottom: 100 })
        .observe(`#${targetRef.current.id}`, (res) => {
          if (res.intersectionRatio && res.intersectionRatio > 0) {
            onIntersect?.()
          }
        })

      return () => {
        observer.disconnect()
      }
    }
  }, [enabled, targetRef, root, rootMargin, threshold, onIntersect])

  return observerRef
}

