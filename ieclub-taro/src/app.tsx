// src/app.tsx - 应用入口文件
// 优化版本：解决 Taro 4.x + React 18 H5 端渲染问题

import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { useLaunch } from '@tarojs/taro'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getApiBaseUrl } from '@/utils/api-config'
import ErrorBoundary from './components/ErrorBoundary'
import './app.scss'

function App({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false)
  const renderCountRef = useRef(0)
  
  // 应用启动时执行
  useLaunch(() => {
    console.log('=== 🚀 IEClub 应用启动 ===')
    console.log('📦 环境:', process.env.TARO_ENV)
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV)
    console.log('🌐 API地址:', getApiBaseUrl())
    
    // H5环境特定初始化
    if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined') {
      console.log('🌍 当前URL:', window.location.href)
      console.log('📍 Pathname:', window.location.pathname)
      
      // 检查DOM挂载点
      const appElement = document.getElementById('app')
      console.log('🎯 App挂载点存在:', !!appElement)
      if (appElement) {
        console.log('🎯 App挂载点标签:', appElement.tagName)
        console.log('🎯 App挂载点初始内容:', appElement.innerHTML.substring(0, 100))
      }
    }
    
    // 标记为已就绪
    setIsReady(true)
  })

  useEffect(() => {
    renderCountRef.current++
    console.log(`--- ✅ [App] 组件已挂载/更新 (第${renderCountRef.current}次渲染) ---`)
    
    // H5环境下的渲染验证
    if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined') {
      // 立即检查
      const checkRendering = () => {
        const appElement = document.getElementById('app')
        if (appElement) {
          const hasContent = appElement.children.length > 0
          const innerHTML = appElement.innerHTML
          console.log('🔍 [渲染检查] 挂载点子元素数量:', appElement.children.length)
          console.log('🔍 [渲染检查] 挂载点有内容:', hasContent)
          console.log('🔍 [渲染检查] innerHTML长度:', innerHTML.length)
          
          if (!hasContent && innerHTML.length < 50) {
            console.warn('⚠️ [渲染检查] DOM内容异常，尝试强制更新...')
            // 触发React强制更新
            setIsReady(prev => !prev)
          } else {
            console.log('✅ [渲染检查] DOM渲染正常')
          }
        }
      }
      
      // 延迟检查，确保DOM已更新
      const timers = [
        setTimeout(checkRendering, 100),
        setTimeout(checkRendering, 500),
        setTimeout(checkRendering, 1000)
      ]
      
      // 测试API连接
      testApiConnection()
      
      return () => {
        timers.forEach(timer => clearTimeout(timer))
      }
    }
  }, [children, isReady])

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

  // 调试日志
  console.log('--- 🎨 [App] 渲染函数执行 ---')
  console.log('children类型:', typeof children)
  console.log('children存在:', !!children)
  console.log('isReady:', isReady)
  
  // 如果 children 为空，显示友好提示
  if (!children) {
    console.error('❌ [App] props.children 为空!')
    return (
      <ErrorBoundary>
        <View className="app-error">
          <View className="error-icon">⚠️</View>
          <View className="error-title">页面加载异常</View>
          <View className="error-message">路由组件未正确加载</View>
          <View className="error-hint">请刷新页面重试</View>
        </View>
      </ErrorBoundary>
    )
  }
  
  // 正常渲染
  console.log('--- ✅ [App] 返回 children 进行渲染 ---')
  return (
    <ErrorBoundary>
      <View className="app-container">
        {children}
      </View>
    </ErrorBoundary>
  )
}

export default App