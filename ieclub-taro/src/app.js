import React, { Component } from 'react';
import './index.css';
import App from './App.jsx';

// Taro H5 应用入口
// 包装成 Taro 组件类以满足 Taro 的页面实例要求
class TaroApp extends Component {
  componentDidMount() {
    console.log('Taro App mounted');
  }

  componentDidShow() {
    console.log('Taro App show');
  }

  componentDidHide() {
    console.log('Taro App hide');
  }

  render() {
    // 直接渲染 App.jsx 中的主应用组件
    return <App />;
  }
}

export default TaroApp;
