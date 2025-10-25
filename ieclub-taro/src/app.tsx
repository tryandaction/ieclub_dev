// src/app.tsx - 应用入口文件

import { useEffect } from 'react'
import { useLaunch } from '@tarojs/taro'
import { View } from '@tarojs/components'
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
      
      // 延迟检查DOM内容
      setTimeout(() => {
        const appElementAfter = document.getElementById('app')
        if (appElementAfter) {
          console.log('🎯 [延迟检查] App挂载点HTML:', appElementAfter.innerHTML ? '有内容' : '仍然空')
          console.log('🎯 [延迟检查] App子元素数量:', appElementAfter.children.length)
        }
      }, 1000)
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
  console.log('🎨 [App] Rendering, props.children:', props.children)
  console.log('🎨 [App] props.children type:', typeof props.children)
  console.log('🎨 [App] props.children is null?', props.children === null)
  console.log('🎨 [App] props.children is undefined?', props.children === undefined)
  
  // 添加渲染内容检查
  if (!props.children) {
    console.error('❌ [App] props.children 为空，这可能导致页面空白!')
    return (
      <ErrorBoundary>
        <View style={{ 
          padding: '20px', 
          textAlign: 'center', 
          fontSize: '16px',
          background: '#f0f0f0',
          minHeight: '100vh'
        }}>
          <View style={{ marginBottom: '20px', fontSize: '24px' }}>⚠️ 页面加载异常</View>
          <View>props.children 为空</View>
        </View>
      </ErrorBoundary>
    )
  }
  
  return (
    <ErrorBoundary>
      {props.children}
    </ErrorBoundary>
  )
}

export default App