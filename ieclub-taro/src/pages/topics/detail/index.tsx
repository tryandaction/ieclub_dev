import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function TopicDetail() {
  return (
    <View className='page'>
      <View className='nav-bar'>
        <View className='back-btn' onClick={() => Taro.navigateBack()}>
          <View className='iconify-icon' data-icon='mdi:arrow-left' />
        </View>
        <Text className='title'>话题详情</Text>
      </View>
      <View className='content'>
        <Text className='coming-soon'>话题详情开发中...</Text>
      </View>
    </View>
  )
}
