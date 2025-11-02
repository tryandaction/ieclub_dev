import { useEffect, useRef, useState } from 'react'

/**
 * Intersection Observer Hook - 监听元素可见性
 * 用于实现懒加载、无限滚动等功能
 * 
 * @param {Object} options - IntersectionObserver 配置
 * @param {string|number} options.threshold - 触发阈值
 * @param {string} options.root - 根元素
 * @param {string} options.rootMargin - 根元素边距
 * @returns {[React.Ref, boolean]} [ref, isIntersecting]
 */
export function useIntersectionObserver(options = {}) {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
  } = options

  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold,
        root,
        rootMargin,
      }
    )

    observer.observe(target)

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
  }, [threshold, root, rootMargin])

  return [targetRef, isIntersecting]
}
