/**
 * IEClub useDebounce Hook
 * 防抖Hook，用于优化输入、搜索等场景
 */
import { useState, useEffect } from 'react'

export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

