import { Component } from 'react'

/**
 * 错误边界组件
 * 捕获子组件中的 JavaScript 错误，防止整个应用崩溃
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
    
    // 可以将错误日志上报给服务器
    this.setState({
      error,
      errorInfo
    })

    // 发送错误日志到监控服务
    if (typeof window !== 'undefined' && window.__errorMonitor) {
      window.__errorMonitor.logReactError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* 错误图标 */}
            <div className="mb-6">
              <div className="inline-block w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">😵</span>
              </div>
            </div>

            {/* 错误标题 */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              哎呀，出错了
            </h1>

            {/* 错误说明 */}
            <p className="text-gray-600 mb-6">
              应用遇到了一个意外错误，请刷新页面重试
            </p>

            {/* 开发环境显示错误详情 */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  查看错误详情
                </summary>
                <pre className="mt-3 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-48">
                  <code>
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </code>
                </pre>
              </details>
            )}

            {/* 操作按钮 */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-gradient-primary text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all"
              >
                刷新页面
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                返回首页
              </button>
            </div>

            {/* 帮助提示 */}
            <p className="mt-6 text-sm text-gray-500">
              如果问题持续存在，请联系
              <a 
                href="mailto:support@ieclub.online" 
                className="text-purple-600 hover:underline ml-1"
              >
                技术支持
              </a>
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

