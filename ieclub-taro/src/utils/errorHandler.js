/**
 * 全局错误处理工具
 * 统一处理错误、日志记录和上报
 */

class ErrorHandler {
  constructor() {
    this.enabled = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') || false;
    this.errorQueue = [];
    this.maxQueueSize = 50;
  }

  /**
   * 初始化错误处理
   */
  init() {
    // 已在 index.html 中配置全局错误捕获
    console.log('[ErrorHandler] Initialized');
  }

  /**
   * 处理错误
   */
  handleError(error, context = {}) {
    const errorInfo = {
      message: error.message || String(error),
      stack: error.stack,
      context,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : ''
    };

    // 添加到队列
    this.errorQueue.push(errorInfo);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // 开发环境打印详细错误
    if (!this.enabled) {
      console.error('[Error]', errorInfo);
    }

    // 生产环境上报
    if (this.enabled) {
      this.report(errorInfo);
    }
  }

  /**
   * 上报错误到后端
   */
  report(errorInfo) {
    // 使用 sendBeacon 确保数据能发送出去
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const payload = JSON.stringify({
        type: 'error',
        data: errorInfo
      });

      // 暂时注释掉，避免影响开发
      // navigator.sendBeacon('/api/errors', payload);
    }
  }

  /**
   * 获取错误队列
   */
  getErrors() {
    return this.errorQueue;
  }

  /**
   * 清空错误队列
   */
  clearErrors() {
    this.errorQueue = [];
  }

  /**
   * API 错误处理
   */
  handleApiError(error, options = {}) {
    const { showToast = true, logToConsole = true } = options;

    let message = '网络请求失败';
    
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;
      message = data?.message || `请求失败 (${status})`;
      
      switch (status) {
        case 400:
          message = data?.message || '请求参数错误';
          break;
        case 401:
          message = '未登录或登录已过期';
          // 可以在这里处理登录过期的逻辑
          break;
        case 403:
          message = '没有权限访问';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 500:
          message = '服务器错误，请稍后重试';
          break;
        case 502:
        case 503:
        case 504:
          message = '服务暂时不可用，请稍后重试';
          break;
      }
    } else if (error.request) {
      // 请求发出但没有收到响应
      message = '网络连接失败，请检查网络';
    } else {
      // 其他错误
      message = error.message || '未知错误';
    }

    if (logToConsole) {
      console.error('[API Error]', error);
    }

    this.handleError(error, { type: 'api', message });

    return {
      success: false,
      message,
      error
    };
  }

  /**
   * 组件错误处理
   */
  handleComponentError(error, errorInfo) {
    console.error('[Component Error]', error, errorInfo);
    
    this.handleError(error, {
      type: 'component',
      componentStack: errorInfo?.componentStack
    });
  }
}

// 导出单例
export const errorHandler = new ErrorHandler();
errorHandler.init();

export default errorHandler;

/**
 * React Error Boundary 辅助函数
 */
export const withErrorBoundary = (Component) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      errorHandler.handleComponentError(error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>出错了</h2>
            <p>组件加载失败，请刷新页面重试</p>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
};
