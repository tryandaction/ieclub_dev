/**
 * 通知工具 - 提供多种用户反馈方式
 */

// Toast消息（使用现有的message工具）
import { message } from './message'

/**
 * 确认对话框
 */
export const confirm = ({
  title = '确认操作',
  message: msg = '确定要执行此操作吗？',
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel
}) => {
  // 创建对话框元素
  const dialog = document.createElement('div')
  dialog.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4'
  
  dialog.innerHTML = `
    <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
      <h3 class="text-lg font-bold text-gray-900 mb-3">${title}</h3>
      <p class="text-gray-600 mb-6">${msg}</p>
      <div class="flex gap-3">
        <button class="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors" data-action="cancel">
          ${cancelText}
        </button>
        <button class="flex-1 px-4 py-2.5 rounded-xl bg-gradient-primary text-white font-medium hover:shadow-lg transition-all" data-action="confirm">
          ${confirmText}
        </button>
      </div>
    </div>
  `
  
  document.body.appendChild(dialog)
  
  // 添加动画样式
  if (!document.getElementById('confirm-dialog-styles')) {
    const style = document.createElement('style')
    style.id = 'confirm-dialog-styles'
    style.textContent = `
      @keyframes scale-in {
        from {
          transform: scale(0.95);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
      .animate-scale-in {
        animation: scale-in 0.2s ease-out;
      }
    `
    document.head.appendChild(style)
  }
  
  // 处理按钮点击
  dialog.addEventListener('click', (e) => {
    const action = e.target.dataset.action
    
    if (action === 'confirm') {
      onConfirm?.()
      document.body.removeChild(dialog)
    } else if (action === 'cancel') {
      onCancel?.()
      document.body.removeChild(dialog)
    } else if (e.target === dialog) {
      // 点击背景关闭
      onCancel?.()
      document.body.removeChild(dialog)
    }
  })
  
  return () => {
    if (dialog.parentNode) {
      document.body.removeChild(dialog)
    }
  }
}

/**
 * 操作反馈 - 用于异步操作
 */
export const feedback = {
  /**
   * 显示加载中
   */
  loading: (msg = '加载中...') => {
    return message.loading(msg)
  },
  
  /**
   * 显示成功
   */
  success: (msg = '操作成功') => {
    message.success(msg)
  },
  
  /**
   * 显示错误
   */
  error: (msg = '操作失败') => {
    message.error(msg)
  },
  
  /**
   * 显示警告
   */
  warning: (msg) => {
    message.warning(msg)
  },
  
  /**
   * 显示信息
   */
  info: (msg) => {
    message.info(msg)
  }
}

/**
 * 操作提示 - 用于用户引导
 */
export const tooltip = {
  show: (element, text, position = 'top') => {
    const tooltip = document.createElement('div')
    tooltip.className = `absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg tooltip-${position}`
    tooltip.textContent = text
    
    const rect = element.getBoundingClientRect()
    
    switch (position) {
      case 'top':
        tooltip.style.left = rect.left + rect.width / 2 + 'px'
        tooltip.style.top = rect.top - 8 + 'px'
        tooltip.style.transform = 'translate(-50%, -100%)'
        break
      case 'bottom':
        tooltip.style.left = rect.left + rect.width / 2 + 'px'
        tooltip.style.top = rect.bottom + 8 + 'px'
        tooltip.style.transform = 'translateX(-50%)'
        break
      case 'left':
        tooltip.style.left = rect.left - 8 + 'px'
        tooltip.style.top = rect.top + rect.height / 2 + 'px'
        tooltip.style.transform = 'translate(-100%, -50%)'
        break
      case 'right':
        tooltip.style.left = rect.right + 8 + 'px'
        tooltip.style.top = rect.top + rect.height / 2 + 'px'
        tooltip.style.transform = 'translateY(-50%)'
        break
    }
    
    document.body.appendChild(tooltip)
    
    // 3秒后自动移除
    setTimeout(() => {
      if (tooltip.parentNode) {
        document.body.removeChild(tooltip)
      }
    }, 3000)
    
    return () => {
      if (tooltip.parentNode) {
        document.body.removeChild(tooltip)
      }
    }
  }
}

/**
 * 复制到剪贴板
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
    return true
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    
    try {
      document.execCommand('copy')
      message.success('已复制到剪贴板')
      return true
    } catch (err) {
      message.error('复制失败')
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

/**
 * 分享
 */
export const share = async (data) => {
  const { title, text, url } = data
  
  // 如果浏览器支持Web Share API
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return true
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('分享失败:', error)
      }
      return false
    }
  }
  
  // 降级方案：复制链接
  if (url) {
    await copyToClipboard(url)
    return true
  }
  
  message.warning('当前浏览器不支持分享功能')
  return false
}

export default {
  confirm,
  feedback,
  tooltip,
  copyToClipboard,
  share,
  message
}

