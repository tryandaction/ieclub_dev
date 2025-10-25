import React from 'react'
import { View } from '@tarojs/components'
import './index.scss'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    console.error('🚨 [ErrorBoundary] Caught error in getDerivedStateFromError:', error)
    return {
      hasError: true,
      error: error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 你同样可以将错误日志上报给服务器
    console.error('🚨 [ErrorBoundary] componentDidCatch:', {
      error: error,
      errorInfo: errorInfo,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack
    })

    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // 在开发环境下显示详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 [ErrorBoundary] Detailed Error Information')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.error('Error Stack:', error.stack)
      console.groupEnd()
    }
  }

  render() {
    if (this.state.hasError) {
      // 你可以自定义降级后的 UI 并渲染
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <View className='error-boundary'>
          <View className='error-boundary__icon'>⚠️</View>
          <View className='error-boundary__title'>页面出现错误</View>
          <View className='error-boundary__message'>
            {this.state.error?.message || '未知错误'}
          </View>
          {process.env.NODE_ENV === 'development' && (
            <View className='error-boundary__details'>
              <View className='error-boundary__stack'>
                {this.state.error?.stack}
              </View>
              {this.state.errorInfo && (
                <View className='error-boundary__component-stack'>
                  {this.state.errorInfo.componentStack}
                </View>
              )}
            </View>
          )}
          <View 
            className='error-boundary__retry'
            onClick={() => {
              this.setState({
                hasError: false,
                error: null,
                errorInfo: null
              })
            }}
          >
            重试
          </View>
        </View>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary