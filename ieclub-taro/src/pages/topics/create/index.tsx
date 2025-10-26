import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function CreateTopic() {
  return (
    <View className='page'>
      <View className='nav-bar'>
        <View className='back-btn' onClick={() => Taro.navigateBack()}>
          <View className='iconify-icon' data-icon='mdi:arrow-left' />
        </View>
        <Text className='title'>发布话题</Text>
      </View>
      <View className='content'>
        <Text className='coming-soon'>发布话题开发中...</Text>
      </View>
    </View>
  )
}
