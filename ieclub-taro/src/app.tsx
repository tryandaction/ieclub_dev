// src/app.tsx - 应用入口文件
// 激进方案：直接接管H5渲染，解决 Taro 4.x + React 18 空白问题

import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLaunch } from '@tarojs/taro'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getApiBaseUrl } from '@/utils/api-config'
import ErrorBoundary from './components/ErrorBoundary'
import './app.scss'

function App({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const renderCountRef = useRef(0)
  const hasManuallyRenderedRef = useRef(false)
  
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
    
    // H5环境下的激进渲染方案
    if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined' && !hasManuallyRenderedRef.current) {
      const checkAndFix = () => {
        const appElement = document.getElementById('app')
        if (!appElement) {
          console.error('❌ 找不到 #app 挂载点')
          return
        }
        
        // 检查实际渲染内容
        const innerHTML = appElement.innerHTML
        const textContent = appElement.textContent || ''
        
        console.log('🔍 [激进检查] innerHTML长度:', innerHTML.length)
        console.log('🔍 [激进检查] textContent长度:', textContent.length)
        console.log('🔍 [激进检查] 子元素数量:', appElement.children.length)
        
        // 判断是否真正渲染了内容（不只是空标签）
        const hasRealContent = textContent.trim().length > 10 || innerHTML.length > 200
        
        if (!hasRealContent) {
          console.warn('⚠️ [激进方案] 检测到内容未渲染，使用Portal接管!')
          
          // 找到 Taro 的根容器（不要删除它，避免破坏 React）
          const taroContainer = appElement.querySelector('.app-container')
          if (taroContainer) {
            console.log('🎯 找到 Taro 容器，将在其内部创建Portal')
            
            // 在 Taro 容器内创建 Portal 容器（不清空父元素）
            const newContainer = document.createElement('div')
            newContainer.id = 'taro-portal-root'
            newContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              min-height: 100vh;
              z-index: 9999;
              background: #fff;
            `
            
            // 插入到 Taro 容器内部
            taroContainer.appendChild(newContainer)
            
            // 设置Portal容器
            setPortalContainer(newContainer)
            hasManuallyRenderedRef.current = true
            
            console.log('✅ [激进方案] Portal容器已创建在Taro内部，将强制渲染children')
          } else {
            console.warn('⚠️ 找不到 .app-container，尝试创建顶层Portal')
            
            // 如果找不到 Taro 容器，创建独立容器
            const newContainer = document.createElement('div')
            newContainer.id = 'taro-portal-root'
            newContainer.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              min-height: 100vh;
              z-index: 9999;
              background: #fff;
            `
            
            // 追加到 app 元素（不清空）
            appElement.appendChild(newContainer)
            
            setPortalContainer(newContainer)
            hasManuallyRenderedRef.current = true
            
            console.log('✅ [激进方案] 顶层Portal容器已创建，将强制渲染children')
          }
        } else {
          console.log('✅ [激进检查] 内容已正常渲染，无需Portal')
        }
      }
      
      // 多次检查，确保捕获问题
      const timers = [
        setTimeout(checkAndFix, 50),
        setTimeout(checkAndFix, 200),
        setTimeout(checkAndFix, 500)
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
  console.log('hasManuallyRendered:', hasManuallyRenderedRef.current)
  console.log('portalContainer存在:', !!portalContainer)
  
  // 如果 children 为空，显示友好提示
  if (!children) {
    console.error('❌ [App] props.children 为空!')
    const errorUI = (
      <ErrorBoundary>
        <View className="app-error">
          <View className="error-icon">⚠️</View>
          <View className="error-title">页面加载异常</View>
          <View className="error-message">路由组件未正确加载</View>
          <View className="error-hint">请刷新页面重试</View>
        </View>
      </ErrorBoundary>
    )
    
    // H5环境且有Portal容器，使用Portal渲染
    if (process.env.TARO_ENV === 'h5' && portalContainer) {
      console.log('🚀 [Portal] 使用Portal渲染错误页面')
      return createPortal(errorUI, portalContainer)
    }
    
    return errorUI
  }
  
  // H5环境且需要使用Portal
  if (process.env.TARO_ENV === 'h5' && portalContainer) {
    console.log('🚀 [Portal] 使用Portal强制渲染children')
    return createPortal(
      <ErrorBoundary>
        <View className="app-container">
          {children}
        </View>
      </ErrorBoundary>,
      portalContainer
    )
  }
  
  // 正常渲染（小程序环境或Portal未激活）
  console.log('--- ✅ [App] 返回 children 进行正常渲染 ---')
  return (
    <ErrorBoundary>
      <View className="app-container">
        {children}
      </View>
    </ErrorBoundary>
  )
}

export default App