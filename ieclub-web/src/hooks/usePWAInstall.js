import { useState, useEffect } from 'react'
import { subscribe, getState, install as doInstall } from '../utils/pwaInstallManager'

/**
 * PWA 安装 Hook
 * 使用全局 pwaInstallManager 避免多组件冲突
 */
export default function usePWAInstall() {
  const [state, setState] = useState(getState())

  useEffect(() => {
    // 订阅状态变化
    const unsubscribe = subscribe(() => {
      setState(getState())
    })
    
    // 初始化状态
    setState(getState())
    
    return unsubscribe
  }, [])

  return {
    isInstallable: state.isInstallable,
    isInstalled: state.isInstalled,
    install: doInstall
  }
}
