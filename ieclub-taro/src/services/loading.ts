// ==================== Loading管理 ====================

import Taro from '@tarojs/taro'

let loadingTimer: NodeJS.Timeout | null = null
let loadingVisible = false

/**
 * 显示Loading
 */
export function showLoading(title = '加载中...') {
  // 防止重复显示
  if (loadingVisible) return

  // 延迟显示（避免闪烁）
  loadingTimer = setTimeout(() => {
    Taro.showLoading({
      title,
      mask: true
    })
    loadingVisible = true
  }, 300)
}

/**
 * 隐藏Loading
 */
export function hideLoading() {
  // 清除延迟
  if (loadingTimer) {
    clearTimeout(loadingTimer)
    loadingTimer = null
  }

  // 隐藏loading
  if (loadingVisible) {
    Taro.hideLoading()
    loadingVisible = false
  }
}