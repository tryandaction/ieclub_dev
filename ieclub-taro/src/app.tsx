// src/app.tsx - 应用入口文件

import { useEffect } from 'react'
import { useLaunch } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { getApiBaseUrl } from '@/utils/api-config'
import ErrorBoundary from './components/ErrorBoundary'
import './app.scss'

function App(props: any) {
  // 应用启动时执行
  useLaunch(() => {
    console.log('🚀 IEClub 应用启动')
    console.log('📦 环境:', process.env.TARO_ENV)
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV)
    console.log('🌐 API地址:', getApiBaseUrl())
    
    // H5环境特定初始化
    if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined') {
      console.log('🌍 当前URL:', window.location.href)
      console.log('📍 Origin:', window.location.origin)
      console.log('📍 Protocol:', window.location.protocol)
      console.log('📍 Hostname:', window.location.hostname)
      console.log('📍 Pathname:', window.location.pathname)
      
      // 检查DOM挂载点
      const appElement = document.getElementById('app')
      console.log('🎯 App挂载点存在:', !!appElement)
      if (appElement) {
        console.log('🎯 App挂载点HTML:', appElement.innerHTML ? '有内容' : '空')
      }
    }
  })

  useEffect(() => {
    // 应用挂载后执行
    console.log('✅ IEClub 应用已挂载')
    
    // 测试API连接
    if (process.env.TARO_ENV === 'h5') {
      testApiConnection()
    }
  }, [])

  // 测试API连接
  const testApiConnection = async () => {
    try {
      const apiBase = getApiBaseUrl()
      console.log('🔍 测试API连接:', `${apiBase}/test`)
      
      const res = await Taro.request({
        url: `${apiBase}/test`,
        method: 'GET',
        timeout: 5000
      })
      
      console.log('✅ API连接成功:', res.data)
    } catch (error: any) {
      console.warn('⚠️ API连接失败:', error.errMsg || error.message)
      console.log('💡 应用将使用离线模式')
    }
  }

  // 用 ErrorBoundary 包裹所有页面，捕获渲染错误
  return (
    <ErrorBoundary>
      {props.children}
    </ErrorBoundary>
  )
}

export default App