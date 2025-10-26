import React, { Component } from 'react';
import './index.css';

// Taro H5 应用入口
// 这里只是一个壳，实际内容在pages/index/index.jsx中渲染
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
    // 返回空，实际内容在页面中
    return this.props.children;
  }
}

export default TaroApp;
