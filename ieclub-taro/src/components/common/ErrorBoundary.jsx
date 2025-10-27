/**
 * 错误边界组件
 * 捕获React组件树中的JavaScript错误
 */
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 可以在这里上报错误到监控服务
    // reportErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            {/* 错误图标 */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
              <AlertTriangle size={40} className="text-red-500" />
            </div>

            {/* 错误标题 */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
              哎呀，出错了
            </h1>

            {/* 错误描述 */}
            <p className="text-gray-600 text-center mb-6">
              应用遇到了一个意外错误，但不用担心，你的数据是安全的。
            </p>

            {/* 错误详情（开发模式） */}
            {(typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800 mb-2">
                  错误信息：
                </p>
                <pre className="text-xs text-red-700 overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <details className="mt-3">
                    <summary className="text-xs text-red-700 cursor-pointer hover:text-red-800">
                      查看调用栈
                    </summary>
                    <pre className="mt-2 text-xs text-red-600 overflow-x-auto whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                onClick={this.handleReset}
                className="w-full"
              >
                <RefreshCw size={18} className="mr-2" />
                重试
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="w-full"
              >
                <Home size={18} className="mr-2" />
                返回首页
              </Button>
            </div>

            {/* 帮助信息 */}
            <p className="text-xs text-gray-500 text-center mt-6">
              如果问题持续存在，请联系技术支持
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

