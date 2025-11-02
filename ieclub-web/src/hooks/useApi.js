/**
 * 🎣 API 请求 Hook
 * 统一处理加载状态、错误处理和数据管理
 */

import { useState, useCallback, useEffect } from 'react'
import { showToast } from '../components/Toast'

/**
 * 通用 API 请求 Hook
 * @param {Function} apiFunction - API 请求函数
 * @param {Object} options - 配置选项
 * @returns {Object} { data, loading, error, execute, reset }
 */
export function useApi(apiFunction, options = {}) {
  const {
    immediate = false, // 是否立即执行
    onSuccess = null, // 成功回调
    onError = null, // 错误回调
    showErrorToast = true, // 是否显示错误提示
    initialData = null // 初始数据
  } = options

  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await apiFunction(...args)
      setData(result)
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (err) {
      setError(err)
      
      if (showErrorToast) {
        const message = err.response?.data?.message || err.message || '请求失败'
        showToast(message, 'error')
      }
      
      if (onError) {
        onError(err)
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction, onSuccess, onError, showErrorToast])

  const reset = useCallback(() => {
    setData(initialData)
    setError(null)
    setLoading(false)
  }, [initialData])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}

/**
 * 列表数据 Hook（支持分页、筛选）
 * @param {Function} apiFunction - API 请求函数
 * @param {Object} options - 配置选项
 */
export function useListApi(apiFunction, options = {}) {
  const {
    immediate = true,
    initialData = [],
    mockData = [],
    useMockOnError = true, // 错误时使用 mock 数据
    ...restOptions
  } = options

  const [items, setItems] = useState(initialData)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const { data, loading, error, execute } = useApi(apiFunction, {
    ...restOptions,
    immediate: false,
    showErrorToast: false,
    onSuccess: (result) => {
      // 处理不同的数据格式
      let newItems = []
      if (Array.isArray(result)) {
        newItems = result
      } else if (result?.data && Array.isArray(result.data)) {
        newItems = result.data
      } else if (result?.items && Array.isArray(result.items)) {
        newItems = result.items
      }

      setItems(newItems)
      setHasMore(result?.hasMore ?? false)
      
      if (restOptions.onSuccess) {
        restOptions.onSuccess(result)
      }
    },
    onError: (err) => {
      console.error('❌ 列表加载失败:', err)
      
      // 使用 mock 数据作为降级
      if (useMockOnError && mockData.length > 0) {
        setItems(mockData)
        showToast('加载失败，显示示例数据', 'warning')
      } else {
        showToast('加载失败，请稍后重试', 'error')
      }
      
      if (restOptions.onError) {
        restOptions.onError(err)
      }
    }
  })

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    
    const nextPage = page + 1
    setPage(nextPage)
    
    try {
      await execute({ page: nextPage })
    } catch (err) {
      // 错误已在 useApi 中处理
    }
  }, [page, hasMore, loading, execute])

  const refresh = useCallback(async () => {
    setPage(1)
    setHasMore(true)
    
    try {
      await execute({ page: 1 })
    } catch (err) {
      // 错误已在 useApi 中处理
    }
  }, [execute])

  useEffect(() => {
    if (immediate) {
      refresh()
    }
  }, [immediate])

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  }
}

/**
 * 详情数据 Hook
 * @param {Function} apiFunction - API 请求函数
 * @param {string|number} id - 资源 ID
 * @param {Object} options - 配置选项
 */
export function useDetailApi(apiFunction, id, options = {}) {
  const {
    immediate = true,
    ...restOptions
  } = options

  return useApi(apiFunction, {
    ...restOptions,
    immediate: immediate && !!id,
    onSuccess: (result) => {
      if (restOptions.onSuccess) {
        restOptions.onSuccess(result)
      }
    }
  })
}

/**
 * 操作 Hook（创建、更新、删除等）
 * @param {Function} apiFunction - API 请求函数
 * @param {Object} options - 配置选项
 */
export function useMutationApi(apiFunction, options = {}) {
  const {
    successMessage = '操作成功',
    showSuccessToast = true,
    ...restOptions
  } = options

  return useApi(apiFunction, {
    ...restOptions,
    onSuccess: (result) => {
      if (showSuccessToast) {
        showToast(successMessage, 'success')
      }
      
      if (restOptions.onSuccess) {
        restOptions.onSuccess(result)
      }
    }
  })
}

export default useApi

