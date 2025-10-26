import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Community() {
  useEffect(() => {
    // TabBar会自动根据路由更新选中状态
  }, [])

  return (
    <View className='community-page'>
      <View className='nav-bar'>
        <Text className='title'>社区</Text>
      </View>
      <View className='content'>
        <Text className='coming-soon'>社区功能开发中...</Text>
      </View>
    </View>
  )
}
