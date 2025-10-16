// ==================== 乐观更新实现 ====================

import { create } from 'zustand'

interface OptimisticUpdate {
  id: string
  type: 'add' | 'update' | 'delete'
  target: string  // topicId
  data: any
  timestamp: number
  rollback?: () => void
}

interface OptimisticState {
  updates: Map<string, OptimisticUpdate>

  // Actions
  addUpdate: (update: OptimisticUpdate) => void
  removeUpdate: (id: string) => void
  rollback: (id: string) => void
}

export const useOptimisticStore = create<OptimisticState>((set, get) => ({
  updates: new Map(),

  addUpdate: (update) => {
    set(state => {
      const newUpdates = new Map(state.updates)
      newUpdates.set(update.id, update)
      return { updates: newUpdates }
    })
  },

  removeUpdate: (id) => {
    set(state => {
      const newUpdates = new Map(state.updates)
      newUpdates.delete(id)
      return { updates: newUpdates }
    })
  },

  rollback: (id) => {
    const update = get().updates.get(id)
    if (update?.rollback) {
      update.rollback()
    }
    get().removeUpdate(id)
  }
}))

// 乐观更新Hook
export function useOptimisticAction() {
  const { addUpdate, removeUpdate, rollback } = useOptimisticStore()

  async function performOptimisticAction<T>(
    action: () => Promise<T>,
    optimisticUpdate: {
      apply: () => void
      rollback: () => void
    }
  ): Promise<T> {
    const updateId = `update_${Date.now()}_${Math.random()}`

    // 1. 立即应用乐观更新
    optimisticUpdate.apply()

    // 2. 记录更新
    addUpdate({
      id: updateId,
      type: 'update',
      target: '',
      data: {},
      timestamp: Date.now(),
      rollback: optimisticUpdate.rollback
    })

    try {
      // 3. 执行实际操作
      const result = await action()

      // 4. 成功后移除更新记录
      removeUpdate(updateId)

      return result

    } catch (error) {
      // 5. 失败时回滚
      rollback(updateId)
      throw error
    }
  }

  return { performOptimisticAction }
}