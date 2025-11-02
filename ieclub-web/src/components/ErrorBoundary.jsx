/**
 * 🛡️ 错误边界组件
 * 捕获子组件中的 JavaScript 错误，记录错误并显示降级 UI
 */

import React from 'react'
import errorMonitor from '../utils/errorMonitor'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('❌ [ErrorBoundary] 捕获到错误:', error, errorInfo)
    
    // 更新状态
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))

    // 发送错误到监控系统
    try {
      errorMonitor.captureError({
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        type: 'React Error Boundary',
        timestamp: new Date().toISOString()
      })
    } catch (e) {
      console.error('❌ 发送错误信息失败:', e)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // 自定义降级 UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* 错误卡片 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              {/* 错误图标 */}
              <div className="text-6xl mb-4">😔</div>
              
              {/* 错误标题 */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                哎呀，出错了
              </h1>
              
              {/* 错误描述 */}
              <p className="text-gray-600 mb-6">
                应用遇到了一个意外错误，我们已经记录了这个问题。
              </p>

              {/* 错误详情（开发环境） */}
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
                  <h3 className="text-sm font-bold text-red-900 mb-2">
                    错误详情（仅开发环境可见）
                  </h3>
                  <pre className="text-xs text-red-800 overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  🔄 重试
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  🔃 刷新页面
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  🏠 返回首页
                </button>
              </div>

              {/* 错误次数提示 */}
              {this.state.errorCount > 1 && (
                <div className="mt-6 text-sm text-gray-500">
                  <p>
                    ⚠️ 错误已发生 {this.state.errorCount} 次
                  </p>
                  <p className="mt-2">
                    如果问题持续存在，请尝试清除浏览器缓存或联系技术支持。
                  </p>
                </div>
              )}
            </div>

            {/* 帮助信息 */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                遇到问题？
                <a href="/feedback" className="text-purple-600 hover:underline ml-1">
                  向我们反馈
                </a>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
