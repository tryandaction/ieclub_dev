// 简单的测试页面 - 用于验证H5渲染
import { View, Text } from '@tarojs/components'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getApiBaseUrl } from '@/utils/api-config'
import './test-page.scss'

const TestPage = () => {
  useEffect(() => {
    console.log('✅ TestPage 已渲染')
    console.log('🌐 当前API Base URL:', getApiBaseUrl())
    
    if (typeof window !== 'undefined') {
      console.log('🌍 Window对象存在')
      console.log('📍 Location:', window.location.href)
    }
  }, [])

  const handleTestApi = async () => {
    try {
      const apiBase = getApiBaseUrl()
      console.log('🔍 测试API连接:', `${apiBase}/test`)
      
      const res = await Taro.request({
        url: `${apiBase}/test`,
        method: 'GET',
        timeout: 5000
      })
      
      console.log('✅ API连接成功:', res)
      Taro.showToast({
        title: 'API连接成功',
        icon: 'success'
      })
    } catch (error: any) {
      console.error('❌ API连接失败:', error)
      Taro.showToast({
        title: 'API连接失败: ' + (error.errMsg || error.message),
        icon: 'none',
        duration: 3000
      })
    }
  }

  const handleGoHome = () => {
    Taro.reLaunch({
      url: '/pages/square/index'
    })
  }

  return (
    <View className='test-page'>
      <View className='test-header'>
        <Text className='test-title'>🧪 IEClub 测试页面</Text>
        <Text className='test-subtitle'>用于验证H5渲染和API连接</Text>
      </View>

      <View className='test-section'>
        <Text className='section-title'>📋 环境信息</Text>
        <View className='info-item'>
          <Text className='info-label'>平台:</Text>
          <Text className='info-value'>{process.env.TARO_ENV}</Text>
        </View>
        <View className='info-item'>
          <Text className='info-label'>环境:</Text>
          <Text className='info-value'>{process.env.NODE_ENV}</Text>
        </View>
        <View className='info-item'>
          <Text className='info-label'>API地址:</Text>
          <Text className='info-value'>{getApiBaseUrl()}</Text>
        </View>
        {typeof window !== 'undefined' && (
          <View className='info-item'>
            <Text className='info-label'>当前URL:</Text>
            <Text className='info-value'>{window.location.href}</Text>
          </View>
        )}
      </View>

      <View className='test-section'>
        <Text className='section-title'>🧪 功能测试</Text>
        <View className='test-buttons'>
          <View className='test-button' onClick={handleTestApi}>
            <Text>测试API连接</Text>
          </View>
          <View className='test-button primary' onClick={handleGoHome}>
            <Text>返回首页</Text>
          </View>
        </View>
      </View>

      <View className='test-section'>
        <Text className='section-title'>✅ 渲染状态</Text>
        <View className='status-grid'>
          <View className='status-item success'>
            <Text className='status-icon'>✓</Text>
            <Text className='status-text'>页面已渲染</Text>
          </View>
          <View className='status-item success'>
            <Text className='status-icon'>✓</Text>
            <Text className='status-text'>组件已挂载</Text>
          </View>
          <View className='status-item success'>
            <Text className='status-icon'>✓</Text>
            <Text className='status-text'>样式已加载</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default TestPage

