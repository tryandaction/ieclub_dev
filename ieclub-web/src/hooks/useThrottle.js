import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * 节流 Hook - 限制更新频率
 * @param {*} value - 需要节流的值
 * @param {number} interval - 节流间隔（毫秒）
 * @returns {*} 节流后的值
 */
export function useThrottle(value, interval = 500) {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastUpdated = useRef(Date.now())

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdated.current

    if (timeSinceLastUpdate >= interval) {
      setThrottledValue(value)
      lastUpdated.current = now
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value)
        lastUpdated.current = Date.now()
      }, interval - timeSinceLastUpdate)

      return () => clearTimeout(timer)
    }
  }, [value, interval])

  return throttledValue
}

/**
 * 节流回调 Hook - 限制函数执行频率
 * @param {Function} callback - 需要节流的函数
 * @param {number} interval - 节流间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
export function useThrottledCallback(callback, interval = 500) {
  const lastRun = useRef(Date.now())
  const timeoutRef = useRef(null)

  return useCallback((...args) => {
    const now = Date.now()
    const timeSinceLastRun = now - lastRun.current

    if (timeSinceLastRun >= interval) {
      callback(...args)
      lastRun.current = now
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
        lastRun.current = Date.now()
      }, interval - timeSinceLastRun)
    }
  }, [callback, interval])
}

