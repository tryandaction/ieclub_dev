/**
 * 性能监控Hook
 * 
 * 特性：
 * - FPS监控
 * - 长任务检测
 * - 内存使用监控
 * - 页面加载性能
 */

import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'

interface PerformanceMetrics {
  fps: number
  memory?: {
    used: number
    total: number
    limit: number
  }
  longTasks: number
  pageLoadTime?: number
  firstPaint?: number
  firstContentfulPaint?: number
}

export function usePerformance(options: {
  enabled?: boolean
  reportInterval?: number
  fpsThreshold?: number
  onReport?: (metrics: PerformanceMetrics) => void
} = {}) {
  const {
    enabled = true,
    reportInterval = 5000,
    fpsThreshold = 30,
    onReport
  } = options

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    longTasks: 0
  })

  const fpsRef = useRef(0)
  const framesRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const rafIdRef = useRef<number>()

  // FPS计算
  useEffect(() => {
    if (!enabled || process.env.TARO_ENV !== 'h5') return

    const calculateFPS = () => {
      const now = performance.now()
      framesRef.current++

      if (now >= lastTimeRef.current + 1000) {
        fpsRef.current = Math.round(
          (framesRef.current * 1000) / (now - lastTimeRef.current)
        )
        framesRef.current = 0
        lastTimeRef.current = now
      }

      rafIdRef.current = requestAnimationFrame(calculateFPS)
    }

    rafIdRef.current = requestAnimationFrame(calculateFPS)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [enabled])

  // 性能数据收集和上报
  useEffect(() => {
    if (!enabled) return

    const collectMetrics = () => {
      const currentMetrics: PerformanceMetrics = {
        fps: fpsRef.current,
        longTasks: 0
      }

      // H5环境收集更多指标
      if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined') {
        // 内存信息
        if ((performance as any).memory) {
          const memory = (performance as any).memory
          currentMetrics.memory = {
            used: Math.round(memory.usedJSHeapSize / 1048576), // MB
            total: Math.round(memory.totalJSHeapSize / 1048576),
            limit: Math.round(memory.jsHeapSizeLimit / 1048576)
          }
        }

        // 页面加载性能
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          currentMetrics.pageLoadTime = Math.round(navigation.loadEventEnd - navigation.fetchStart)
          currentMetrics.firstPaint = Math.round(navigation.responseEnd - navigation.fetchStart)
        }

        // Paint Timing
        const paintEntries = performance.getEntriesByType('paint')
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
        if (fcp) {
          currentMetrics.firstContentfulPaint = Math.round(fcp.startTime)
        }

        // 长任务检测
        if ((window as any).PerformanceObserver) {
          try {
            const observer = new PerformanceObserver((list) => {
              currentMetrics.longTasks += list.getEntries().length
            })
            observer.observe({ entryTypes: ['longtask'] })
          } catch (e) {
            // 某些浏览器不支持longtask
          }
        }
      }

      setMetrics(currentMetrics)
      onReport?.(currentMetrics)

      // 性能警告
      if (currentMetrics.fps < fpsThreshold) {
        console.warn(`⚠️ FPS较低: ${currentMetrics.fps}`)
      }

      if (currentMetrics.memory && currentMetrics.memory.used / currentMetrics.memory.limit > 0.9) {
        console.warn(`⚠️ 内存使用率过高: ${Math.round(currentMetrics.memory.used / currentMetrics.memory.limit * 100)}%`)
      }
    }

    const interval = setInterval(collectMetrics, reportInterval)
    collectMetrics() // 立即执行一次

    return () => clearInterval(interval)
  }, [enabled, reportInterval, fpsThreshold, onReport])

  return metrics
}

/**
 * 性能优化建议Hook
 */
export function usePerformanceOptimization() {
  useEffect(() => {
    if (process.env.TARO_ENV !== 'h5') return

    // 图片懒加载
    const images = document.querySelectorAll('img[data-src]')
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src || ''
          img.removeAttribute('data-src')
          imageObserver.unobserve(img)
        }
      })
    })

    images.forEach(img => imageObserver.observe(img))

    return () => imageObserver.disconnect()
  }, [])
}

