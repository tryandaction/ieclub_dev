import React, { Component } from 'react';
import { View } from '@tarojs/components';
import App from '../../App.jsx';
import './index.scss';

// Taro 页面实例 - 在H5环境下渲染React Router应用
export default class Index extends Component {
  componentDidMount() {
    console.log('Index page mounted');
  }

  render() {
    return (
      <View className="index">
        <App />
      </View>
    );
  }
}
