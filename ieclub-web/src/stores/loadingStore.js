import { create } from 'zustand'

/**
 * 全局Loading状态管理
 */
const useLoadingStore = create((set) => ({
  // 全屏loading状态
  isLoading: false,
  loadingText: '加载中...',
  
  // 显示loading
  showLoading: (text = '加载中...') => set({ isLoading: true, loadingText: text }),
  
  // 隐藏loading
  hideLoading: () => set({ isLoading: false }),
  
  // 请求计数器（用于多个并发请求）
  requestCount: 0,
  
  // 增加请求计数
  incrementRequest: () => set((state) => ({ 
    requestCount: state.requestCount + 1,
    isLoading: true 
  })),
  
  // 减少请求计数
  decrementRequest: () => set((state) => {
    const newCount = Math.max(0, state.requestCount - 1)
    return {
      requestCount: newCount,
      isLoading: newCount > 0
    }
  }),
  
  // 重置
  reset: () => set({ isLoading: false, requestCount: 0 })
}))

export default useLoadingStore

