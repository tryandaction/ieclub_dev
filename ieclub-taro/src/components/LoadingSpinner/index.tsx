// ==================== 加载动画组件（增强版） ====================

import { View } from '@tarojs/components'
import './index.scss'

export default function LoadingSpinner() {
  return (
    <View className='loading-spinner'>
      <View className='spinner'></View>
      <View className='loading-text'>加载中...</View>
    </View>
  )
}