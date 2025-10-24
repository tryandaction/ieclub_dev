/**
 * 防抖和节流Hooks
 */

import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * 防抖Hook
 * @param value 需要防抖的值
 * @param delay 延迟时间(ms)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 防抖函数Hook
 * @param fn 需要防抖的函数
 * @param delay 延迟时间(ms)
 * @param deps 依赖项
 */
export function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 500,
  deps: any[] = []
): T {
  const timerRef = useRef<NodeJS.Timeout>()

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      fn(...args)
    }, delay)
  }, [fn, delay, ...deps]) as T

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return debouncedFn
}

/**
 * 节流Hook
 * @param fn 需要节流的函数
 * @param delay 延迟时间(ms)
 * @param deps 依赖项
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 500,
  deps: any[] = []
): T {
  const timerRef = useRef<NodeJS.Timeout>()
  const lastRunRef = useRef(0)

  const throttledFn = useCallback((...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastRunRef.current >= delay) {
      fn(...args)
      lastRunRef.current = now
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        fn(...args)
        lastRunRef.current = Date.now()
      }, delay - (now - lastRunRef.current))
    }
  }, [fn, delay, ...deps]) as T

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return throttledFn
}

