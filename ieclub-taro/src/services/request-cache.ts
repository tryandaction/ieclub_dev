// ==================== 请求缓存和去重 ====================


interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

export class RequestCache {
  private cache = new Map<string, CacheEntry<any>>()
  private pending = new Map<string, PendingRequest<any>>()
  private readonly DEFAULT_TTL = 60000  // 60秒

  /**
   * 带缓存的请求
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      ttl?: number
      force?: boolean
      staleWhileRevalidate?: boolean
    }
  ): Promise<T> {
    const ttl = options?.ttl || this.DEFAULT_TTL

    // 1. 强制刷新
    if (options?.force) {
      return this.executeFetch(key, fetcher, ttl)
    }

    // 2. 检查缓存
    const cached = this.cache.get(key)
    if (cached && Date.now() < cached.expiresAt) {
      // 缓存有效，直接返回

      // SWR模式：后台更新
      if (options?.staleWhileRevalidate && Date.now() - cached.timestamp > ttl / 2) {
        this.executeFetch(key, fetcher, ttl).catch(console.error)
      }

      return cached.data as T
    }

    // 3. 检查是否有进行中的请求
    const pending = this.pending.get(key)
    if (pending) {
      return pending.promise as Promise<T>
    }

    // 4. 执行新请求
    return this.executeFetch(key, fetcher, ttl)
  }

  /**
   * 执行请求并缓存
   */
  private async executeFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const promise = fetcher()
      .then(data => {
        // 缓存结果
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl
        })

        // 清除pending
        this.pending.delete(key)

        return data
      })
      .catch(error => {
        // 清除pending
        this.pending.delete(key)
        throw error
      })

    // 记录pending
    this.pending.set(key, {
      promise,
      timestamp: Date.now()
    })

    return promise
  }

  /**
   * 清除缓存
   */
  clear(key?: string) {
    if (key) {
      this.cache.delete(key)
      this.pending.delete(key)
    } else {
      this.cache.clear()
      this.pending.clear()
    }
  }

  /**
   * 清除过期缓存
   */
  clearExpired() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// 全局实例
export const requestCache = new RequestCache()

// 定期清理过期缓存
setInterval(() => {
  requestCache.clearExpired()
}, 60000)  // 每分钟清理一次

// 生成缓存键
export function generateCacheKey(
  url: string,
  method: string,
  params?: any
): string {
  const paramStr = params ? JSON.stringify(params) : ''
  return `${method}:${url}:${paramStr}`
}

// 防抖请求装饰器
export function debounceRequest<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number = 300
): T {
  let timeoutId: NodeJS.Timeout | null = null
  let latestResolve: ((value: any) => void) | null = null

  return ((...args: any[]) => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      latestResolve = resolve

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args)
          if (latestResolve) {
            latestResolve(result)
          }
        } catch (error) {
          if (latestResolve) {
            latestResolve(Promise.reject(error))
          }
        }
      }, delay)
    })
  }) as T
}

// 请求去重装饰器
export function dedupeRequest<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getKey?: (...args: any[]) => string
): T {
  const pendingPromises = new Map<string, Promise<any>>()

  return ((...args: any[]) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args)

    if (pendingPromises.has(key)) {
      return pendingPromises.get(key)!
    }

    const promise = fn(...args)
      .finally(() => {
        pendingPromises.delete(key)
      })

    pendingPromises.set(key, promise)
    return promise
  }) as T
}