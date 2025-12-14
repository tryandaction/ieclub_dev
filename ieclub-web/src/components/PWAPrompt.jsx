// PWA 更新提示组件
import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Download } from 'lucide-react'

export default function PWAPrompt() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  // Service Worker 更新处理
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW 已注册:', r)
    },
    onRegisterError(error) {
      console.log('SW 注册失败:', error)
    }
  })

  // 检查是否已安装（standalone 模式）
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true
        || document.referrer.includes('android-app://')
      
      if (isStandalone) {
        setIsInstalled(true)
        setShowInstallPrompt(false)
      }
    }
    
    checkInstalled()
    
    // 监听 display-mode 变化
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', checkInstalled)
    
    return () => {
      mediaQuery.removeEventListener('change', checkInstalled)
    }
  }, [])

  // 监听安装提示事件
  useEffect(() => {
    if (isInstalled) return
    
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // 检查是否被用户关闭过
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (dismissed) {
        const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
        if (daysSince < 7) {
          return // 7天内不再提示
        }
      }
      
      setShowInstallPrompt(true)
    }

    // 监听安装成功事件
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  // 处理安装
  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('用户接受安装')
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  // 处理更新
  const handleUpdate = () => {
    updateServiceWorker(true)
  }

  // 关闭安装提示
  const dismissInstall = () => {
    setShowInstallPrompt(false)
    // 7天后再次提示
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  return (
    <>
      {/* 更新提示 */}
      {needRefresh && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🔄</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">发现新版本</h4>
                <p className="text-sm text-gray-600 mt-1">
                  IEClub 有更新，刷新后即可体验新功能
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    立即更新
                  </button>
                  <button
                    onClick={() => setNeedRefresh(false)}
                    className="py-2 px-4 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    稍后
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 安装提示 - 紫色渐变底 + 白色IE图标 */}
      {showInstallPrompt && deferredPrompt && !isInstalled && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl shadow-2xl p-4 text-white animate-slide-up">
            <div className="flex items-center gap-4">
              {/* 紫色渐变底 + 白色IE字样图标 */}
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl shadow-lg flex items-center justify-center border-2 border-white/30">
                <span className="text-white font-bold text-2xl tracking-tight">IE</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg">安装 IEClub</h4>
                <p className="text-sm text-white/90 mt-0.5">
                  添加到主屏幕，获得原生应用体验
                </p>
              </div>
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 bg-white text-purple-600 px-4 py-2.5 rounded-full font-bold text-sm hover:bg-white/90 transition-colors flex-shrink-0 shadow-lg"
              >
                <Download size={16} />
                安装
              </button>
            </div>
            <button
              onClick={dismissInstall}
              className="absolute top-2 right-2 p-1.5 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/10"
              aria-label="关闭"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
