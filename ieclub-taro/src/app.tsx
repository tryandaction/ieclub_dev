// src/app.tsx - 应用入口文件
// ✨ V4 终极简化方案：回归 Taro 官方最佳实践
// 删除所有复杂逻辑，让 Taro 按照最自然的方式运行

import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { getApiBaseUrl } from '@/utils/api-config'
import './app.scss'

/**
 * 这是最标准、最干净的 Taro App 组件
 * 它只做一件事：接收 Taro 路由传来的页面组件(children)，并将其返回
 */
function App({ children }: PropsWithChildren) {
  
  // 应用启动时执行（保留基本的日志和 API 测试）
  useLaunch(() => {
    console.log('=== 🚀 IEClub 应用启动 (V4 简化版) ===')
    console.log('📦 环境:', process.env.TARO_ENV)
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV)
    console.log('🌐 API地址:', getApiBaseUrl())
    
    if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined') {
      console.log('🌍 当前URL:', window.location.href)
    }
    
    // 测试API连接
    testApiConnection()
  })

  // 测试API连接（保留以便调试）
  const testApiConnection = async () => {
    try {
      const apiBase = getApiBaseUrl()
      const res = await Taro.request({
        url: `${apiBase}/test`,
        method: 'GET',
        timeout: 5000
      })
      console.log('✅ API连接成功:', res.data)
    } catch (error: any) {
      console.warn('⚠️ API连接测试失败，应用将继续运行')
    }
  }

  // 调试日志：确认 App 组件被调用，并查看 children
  console.log('--- ✅ [Simple App] Rendering with children:', children)
  
  // 直接返回 children，将渲染控制权完全交还给 Taro
  // 不使用 ErrorBoundary、不使用 View 包装、不使用 forceRenderKey
  // 这是 Taro 官方推荐的最简单写法
  return children
}

export default App