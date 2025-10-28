import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'

/**
 * 测试页面 - 最简单的实现
 * 用于验证 Taro 基础功能是否正常
 */
export default class TestPage extends Component {
  render() {
    return (
      <View style={{padding: '20px'}}>
        <Text style={{fontSize: '32px'}}>测试页面加载成功！</Text>
      </View>
    )
  }
}

