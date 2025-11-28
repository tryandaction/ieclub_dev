// PWA 更新提示组件
import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWAPrompt() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

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

  // 监听安装提示事件
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  // 处理安装
  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('用户接受安装')
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

  // 检查是否需要显示安装提示
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) {
        setShowInstallPrompt(false)
      }
    }
  }, [])

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

      {/* 安装提示 */}
      {showInstallPrompt && deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-4 text-white animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold">安装 IEClub</h4>
                <p className="text-sm text-white/80 mt-1">
                  添加到主屏幕，获得更好的使用体验
                </p>
                <ul className="text-xs text-white/70 mt-2 space-y-1">
                  <li>✓ 离线也能访问</li>
                  <li>✓ 更快的加载速度</li>
                  <li>✓ 原生应用体验</li>
                </ul>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="flex-1 py-2 px-4 bg-white text-purple-600 text-sm font-bold rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    安装应用
                  </button>
                  <button
                    onClick={dismissInstall}
                    className="py-2 px-4 text-white/80 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors"
                  >
                    以后再说
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
