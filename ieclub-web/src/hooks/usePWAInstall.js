import { useState, useEffect } from 'react'

/**
 * PWA 安装 Hook
 * 管理 PWA 安装状态和安装方法
 */
export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // 检查是否已安装
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true
      setIsInstalled(isStandalone)
    }
    
    checkInstalled()

    // 监听安装提示事件
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // 监听安装成功
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // 触发安装
  const install = async () => {
    if (!deferredPrompt) return false

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
      }
      
      setDeferredPrompt(null)
      return outcome === 'accepted'
    } catch (error) {
      console.error('安装失败:', error)
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    install
  }
}
