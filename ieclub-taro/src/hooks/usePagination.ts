/**
 * 分页Hook - 统一管理分页逻辑
 * 
 * 特性：
 * - 自动处理加载更多
 * - 下拉刷新
 * - 加载状态管理
 * - 无限滚动支持
 */

import { useState, useCallback, useRef } from 'react'
import Taro from '@tarojs/taro'

interface UsePaginationOptions<T> {
  service: (page: number, pageSize: number) => Promise<{
    data: T[]
    total: number
    hasMore: boolean
  }>
  pageSize?: number
  initialData?: T[]
  onSuccess?: (data: T[]) => void
  onError?: (error: Error) => void
}

interface UsePaginationResult<T> {
  data: T[]
  loading: boolean
  loadingMore: boolean
  refreshing: boolean
  hasMore: boolean
  error: Error | null
  page: number
  total: number
  
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  reset: () => void
  reload: () => Promise<void>
}

export function usePagination<T = any>(
  options: UsePaginationOptions<T>
): UsePaginationResult<T> {
  const {
    service,
    pageSize = 20,
    initialData = [],
    onSuccess,
    onError,
  } = options

  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const loadingRef = useRef(false)

  // 加载数据
  const loadData = useCallback(async (
    pageNum: number,
    isRefresh: boolean = false,
    isLoadMore: boolean = false
  ) => {
    // 防止重复请求
    if (loadingRef.current) return
    
    loadingRef.current = true

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else if (isLoadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      setError(null)

      const result = await service(pageNum, pageSize)

      setData(prev => {
        const newData = isRefresh || pageNum === 1 
          ? result.data 
          : [...prev, ...result.data]
        
        onSuccess?.(newData)
        return newData
      })

      setHasMore(result.hasMore)
      setTotal(result.total)
      setPage(pageNum)

    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)

      Taro.showToast({
        title: error.message || '加载失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
      loadingRef.current = false
    }
  }, [service, pageSize, onSuccess, onError])

  // 刷新
  const refresh = useCallback(async () => {
    await loadData(1, true, false)
  }, [loadData])

  // 加载更多
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return
    await loadData(page + 1, false, true)
  }, [hasMore, loadingMore, loading, page, loadData])

  // 重置
  const reset = useCallback(() => {
    setData(initialData)
    setPage(1)
    setHasMore(true)
    setTotal(0)
    setError(null)
  }, [initialData])

  // 重新加载
  const reload = useCallback(async () => {
    reset()
    await loadData(1, false, false)
  }, [reset, loadData])

  return {
    data,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    page,
    total,
    refresh,
    loadMore,
    reset,
    reload,
  }
}

