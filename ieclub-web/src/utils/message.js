/**
 * 消息提示工具
 * 简化版的 Toast 消息系统
 */

let messageContainer = null
let messageQueue = []
let currentMessage = null

// 创建消息容器
const createContainer = () => {
  if (messageContainer) return messageContainer

  messageContainer = document.createElement('div')
  messageContainer.id = 'message-container'
  messageContainer.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    pointer-events: none;
  `
  document.body.appendChild(messageContainer)
  return messageContainer
}

// 显示消息
const showMessage = (content, type = 'info', duration = 3000) => {
  const container = createContainer()

  // 如果有当前消息，先移除
  if (currentMessage) {
    container.removeChild(currentMessage)
    currentMessage = null
  }

  // 创建消息元素
  const messageEl = document.createElement('div')
  messageEl.style.cssText = `
    padding: 12px 24px;
    border-radius: 12px;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    margin-bottom: 12px;
    animation: slideDown 0.3s ease-out;
    pointer-events: auto;
  `

  // 根据类型设置样式和图标
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳'
  }

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    loading: '#8b5cf6'
  }

  messageEl.innerHTML = `
    <span style="font-size: 18px;">${icons[type] || icons.info}</span>
    <span style="color: ${colors[type] || colors.info}; font-weight: 500;">${content}</span>
  `

  // 添加CSS动画
  if (!document.getElementById('message-animations')) {
    const style = document.createElement('style')
    style.id = 'message-animations'
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes slideUp {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-20px);
        }
      }
    `
    document.head.appendChild(style)
  }

  container.appendChild(messageEl)
  currentMessage = messageEl

  // 自动移除（loading类型不自动移除）
  if (type !== 'loading' && duration > 0) {
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.style.animation = 'slideUp 0.3s ease-out'
        setTimeout(() => {
          if (messageEl.parentNode) {
            container.removeChild(messageEl)
            if (currentMessage === messageEl) {
              currentMessage = null
            }
          }
        }, 300)
      }
    }, duration)
  }

  return () => {
    if (messageEl.parentNode) {
      container.removeChild(messageEl)
      if (currentMessage === messageEl) {
        currentMessage = null
      }
    }
  }
}

/**
 * 消息提示API
 */
export const message = {
  success: (content, duration) => showMessage(content, 'success', duration),
  error: (content, duration) => showMessage(content, 'error', duration),
  warning: (content, duration) => showMessage(content, 'warning', duration),
  info: (content, duration) => showMessage(content, 'info', duration),
  loading: (content) => showMessage(content, 'loading', 0)
}

export default message

