import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text } from '@tarojs/components';
import './index.scss';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // 可以发送到错误追踪服务
    // sendToErrorTrackingService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="error-boundary">
          <View className="error-boundary__content">
            <View className="error-boundary__icon">⚠️</View>
            <Text className="error-boundary__title">出错了</Text>
            <Text className="error-boundary__message">
              应用遇到了意外错误，请刷新重试
            </Text>
            <View
              className="error-boundary__retry"
              onClick={this.handleRetry}
            >
              重试
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;