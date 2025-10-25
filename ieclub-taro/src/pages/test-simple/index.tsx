import React from 'react'
import { View } from '@tarojs/components'

const TestSimplePage = () => {
  console.log('🧪 [TestSimplePage] 简单测试页面渲染')
  
  return (
    <View style={{
      padding: '20px',
      textAlign: 'center',
      fontSize: '16px',
      background: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <View style={{ marginBottom: '20px', fontSize: '24px' }}>
        🎯 测试页面
      </View>
      <View style={{ marginBottom: '10px' }}>
        ✅ React 组件渲染正常
      </View>
      <View style={{ marginBottom: '10px' }}>
        ✅ Taro View 组件正常
      </View>
      <View style={{ marginBottom: '10px' }}>
        🕒 渲染时间: {new Date().toLocaleTimeString()}
      </View>
      <View style={{ marginBottom: '10px' }}>
        🌐 当前路径: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}
      </View>
    </View>
  )
}

export default TestSimplePage
