/**
 * 通用数据请求Hook - 统一管理加载状态、错误处理、缓存
 * 
 * 特性：
 * - 自动管理loading/error/data状态
 * - 内置重试机制
 * - 请求去重
 * - SWR缓存策略
 * - 轮询支持
 */

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseRequestOptions<T> {
  manual?: boolean // 手动触发
  initialData?: T // 初始数据
  cacheKey?: string // 缓存键
  cacheTime?: number // 缓存时间(ms)
  staleTime?: number // 数据过期时间(ms)
  retry?: number // 重试次数
  retryDelay?: number // 重试延迟(ms)
  pollingInterval?: number // 轮询间隔(ms)
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  refreshDeps?: any[] // 依赖项变化时自动刷新
}

interface UseRequestResult<T, P extends any[]> {
  data: T | undefined
  loading: boolean
  error: Error | null
  run: (...params: P) => Promise<T | void>
  refresh: () => Promise<T | void>
  mutate: (data: T | ((oldData: T | undefined) => T)) => void
  cancel: () => void
}

// 全局缓存
const cache = new Map<string, { data: any; timestamp: number }>()

// 请求去重Map
const requestMap = new Map<string, Promise<any>>()

export function useRequest<T = any, P extends any[] = any[]>(
  service: (...args: P) => Promise<T>,
  options: UseRequestOptions<T> = {}
): UseRequestResult<T, P> {
  const {
    manual = false,
    initialData,
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 默认5分钟缓存
    staleTime = 0,
    retry = 0,
    retryDelay = 1000,
    pollingInterval,
    onSuccess,
    onError,
    refreshDeps = [],
  } = options

  const [data, setData] = useState<T | undefined>(initialData)
  const [loading, setLoading] = useState(!manual)
  const [error, setError] = useState<Error | null>(null)

  const paramsRef = useRef<P>()
  const pollingTimerRef = useRef<NodeJS.Timeout>()
  const retryCountRef = useRef(0)
  const unmountedRef = useRef(false)

  // 获取缓存数据
  const getCachedData = useCallback((): T | undefined => {
    if (!cacheKey) return undefined
    
    const cached = cache.get(cacheKey)
    if (!cached) return undefined

    const now = Date.now()
    const isExpired = now - cached.timestamp > cacheTime
    const isStale = now - cached.timestamp > staleTime

    if (isExpired) {
      cache.delete(cacheKey)
      return undefined
    }

    return isStale ? undefined : cached.data
  }, [cacheKey, cacheTime, staleTime])

  // 设置缓存
  const setCachedData = useCallback((data: T) => {
    if (cacheKey) {
      cache.set(cacheKey, { data, timestamp: Date.now() })
    }
  }, [cacheKey])

  // 执行请求
  const run = useCallback(async (...params: P): Promise<T | void> => {
    // 检查是否已卸载
    if (unmountedRef.current) return

    paramsRef.current = params

    // 尝试从缓存获取
    const cachedData = getCachedData()
    if (cachedData && retryCountRef.current === 0) {
      setData(cachedData)
      setLoading(false)
      return cachedData
    }

    // 请求去重
    const requestKey = cacheKey || JSON.stringify(params)
    const existingRequest = requestMap.get(requestKey)
    if (existingRequest) {
      return existingRequest
    }

    setLoading(true)
    setError(null)

    const requestPromise = (async () => {
      try {
        const result = await service(...params)
        
        if (unmountedRef.current) return

        setData(result)
        setError(null)
        setCachedData(result)
        retryCountRef.current = 0
        
        onSuccess?.(result)
        
        return result
      } catch (err) {
        if (unmountedRef.current) return

        const error = err as Error

        // 重试逻辑
        if (retryCountRef.current < retry) {
          retryCountRef.current++
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return run(...params)
        }

        setError(error)
        onError?.(error)
        throw error
      } finally {
        if (!unmountedRef.current) {
          setLoading(false)
        }
        requestMap.delete(requestKey)
      }
    })()

    requestMap.set(requestKey, requestPromise)
    return requestPromise
  }, [service, getCachedData, setCachedData, retry, retryDelay, onSuccess, onError, cacheKey])

  // 刷新数据
  const refresh = useCallback(() => {
    return run(...(paramsRef.current || ([] as unknown as P)))
  }, [run])

  // 手动更新数据
  const mutate = useCallback((newData: T | ((oldData: T | undefined) => T)) => {
    const finalData = typeof newData === 'function' 
      ? (newData as (oldData: T | undefined) => T)(data)
      : newData
    
    setData(finalData)
    setCachedData(finalData)
  }, [data, setCachedData])

  // 取消请求
  const cancel = useCallback(() => {
    unmountedRef.current = true
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current)
    }
  }, [])

  // 轮询
  useEffect(() => {
    if (!pollingInterval || manual) return

    const poll = async () => {
      await refresh()
      if (!unmountedRef.current) {
        pollingTimerRef.current = setTimeout(poll, pollingInterval)
      }
    }

    pollingTimerRef.current = setTimeout(poll, pollingInterval)

    return () => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current)
      }
    }
  }, [pollingInterval, manual, refresh])

  // 自动请求
  useEffect(() => {
    if (!manual) {
      run(...([] as unknown as P))
    }
  }, [manual, ...refreshDeps])

  // 组件卸载清理
  useEffect(() => {
    return () => {
      unmountedRef.current = true
      cancel()
    }
  }, [cancel])

  return {
    data,
    loading,
    error,
    run,
    refresh,
    mutate,
    cancel,
  }
}

