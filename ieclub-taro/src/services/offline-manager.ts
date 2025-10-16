// ==================== 离线支持 ====================

import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'

interface OfflineAction {
  id: string
  type: 'create' | 'update' | 'delete'
  endpoint: string
  data: any
  timestamp: number
  retryCount: number
}

export class OfflineManager {
  private queue: OfflineAction[] = []
  private readonly STORAGE_KEY = 'offline_queue'
  private readonly MAX_RETRY = 3
  private syncing = false

  constructor() {
    // 加载队列
    this.loadQueue()

    // 监听网络状态
    this.setupNetworkListener()
  }

  /**
   * 添加离线操作
   */
  add(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) {
    const offlineAction: OfflineAction = {
      ...action,
      id: `offline_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0
    }

    this.queue.push(offlineAction)
    this.saveQueue()

    // 尝试立即同步
    this.sync()
  }

  /**
   * 同步队列
   */
  async sync() {
    // 检查网络
    const networkType = await Taro.getNetworkType()
    if (networkType.networkType === 'none') {
      return
    }

    // 避免重复同步
    if (this.syncing) {
      return
    }

    this.syncing = true

    try {
      // 按顺序处理队列
      while (this.queue.length > 0) {
        const action = this.queue[0]

        try {
          await this.executeAction(action)

          // 成功，移除
          this.queue.shift()
          this.saveQueue()

        } catch (error) {
          console.error('同步失败:', error)

          // 增加重试次数
          action.retryCount++

          // 超过最大重试次数，移除
          if (action.retryCount >= this.MAX_RETRY) {
            console.error('操作失败，已达最大重试次数:', action)
            this.queue.shift()
            this.saveQueue()
          } else {
            // 等待后重试
            break
          }
        }
      }
    } finally {
      this.syncing = false
    }
  }

  /**
   * 执行操作
   */
  private async executeAction(action: OfflineAction) {
    const { endpoint, data, type } = action

    const method = type === 'create' ? 'POST' :
                   type === 'update' ? 'PUT' : 'DELETE'

    await Taro.request({
      url: `${process.env.TARO_APP_API_URL}${endpoint}`,
      method,
      data,
      header: {
        'Authorization': `Bearer ${Taro.getStorageSync('token')}`
      }
    })
  }

  /**
   * 保存队列到本地
   */
  private saveQueue() {
    Taro.setStorageSync(this.STORAGE_KEY, this.queue)
  }

  /**
   * 加载队列
   */
  private loadQueue() {
    this.queue = Taro.getStorageSync(this.STORAGE_KEY) || []
  }

  /**
   * 监听网络状态变化
   */
  private setupNetworkListener() {
    Taro.onNetworkStatusChange((res) => {
      if (res.isConnected) {
        console.log('网络已连接，开始同步离线操作')
        this.sync()
      }
    })
  }

  /**
   * 获取队列大小
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * 清空队列
   */
  clear() {
    this.queue = []
    this.saveQueue()
  }
}

// 全局实例
export const offlineManager = new OfflineManager()

// 离线状态检测Hook
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueSize, setQueueSize] = useState(0)

  useEffect(() => {
    // 初始状态检查
    checkNetworkStatus()

    // 监听网络状态变化
    Taro.onNetworkStatusChange((res) => {
      setIsOnline(res.isConnected)
      if (res.isConnected) {
        setQueueSize(offlineManager.getQueueSize())
      }
    })

    // 定期更新队列大小
    const interval = setInterval(() => {
      setQueueSize(offlineManager.getQueueSize())
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const checkNetworkStatus = async () => {
    try {
      const networkType = await Taro.getNetworkType()
      setIsOnline(networkType.networkType !== 'none')
    } catch (error) {
      setIsOnline(false)
    }
  }

  return { isOnline, queueSize }
}

// 离线操作装饰器
export function withOfflineSupport<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    enableQueue?: boolean
    showToast?: boolean
  }
) {
  return (async (...args: any[]) => {
    const { enableQueue = true, showToast = true } = options || {}

    try {
      // 尝试在线执行
      return await fn(...args)
    } catch (error: any) {
      // 如果是网络错误且启用离线队列
      if (enableQueue && isNetworkError(error)) {
        // 将操作加入离线队列
        offlineManager.add({
          type: 'create', // 根据实际情况调整
          endpoint: '/api/offline-actions',
          data: { action: fn.name, args }
        })

        if (showToast) {
          Taro.showToast({
            title: '网络异常，已保存到离线队列',
            icon: 'none',
            duration: 2000
          })
        }

        return
      }

      throw error
    }
  }) as T
}

// 判断是否为网络错误
function isNetworkError(error: any): boolean {
  return error.errMsg?.includes('fail') || error.message?.includes('network')
}