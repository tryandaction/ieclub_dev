/**
 * PWA 安装管理器 - 全局单例
 * 解决多个组件监听同一事件的冲突问题
 */

let deferredPrompt = null
let isInstalled = false
const listeners = new Set()

// 检查是否已安装
const checkInstalled = () => {
  isInstalled = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
  return isInstalled
}

// 初始化
if (typeof window !== 'undefined') {
  checkInstalled()
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // 不调用 preventDefault，让浏览器原生安装流程正常工作
    // e.preventDefault() // 移除这行，避免阻止浏览器原生安装
    deferredPrompt = e
    console.log('[PWA] beforeinstallprompt captured, prompt available')
    notifyListeners()
  })
  
  window.addEventListener('appinstalled', () => {
    isInstalled = true
    deferredPrompt = null
    console.log('[PWA] App installed')
    notifyListeners()
  })
}

function notifyListeners() {
  listeners.forEach(fn => fn())
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getState() {
  return {
    isInstallable: !!deferredPrompt && !isInstalled,
    isInstalled: checkInstalled()
  }
}

export async function install() {
  if (!deferredPrompt) {
    console.log('[PWA] No deferred prompt')
    return false
  }
  
  try {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log('[PWA] Install outcome:', outcome)
    
    if (outcome === 'accepted') {
      isInstalled = true
    }
    
    deferredPrompt = null
    notifyListeners()
    return outcome === 'accepted'
  } catch (error) {
    console.error('[PWA] Install error:', error)
    return false
  }
}
