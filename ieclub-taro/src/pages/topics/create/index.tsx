import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function TopicCreate() {
  const goBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className='topic-create-page'>
      <View className='back-btn' onClick={goBack}>
        <View className='iconify-icon' data-icon='mdi:arrow-left' />
      </View>
      <Text>创建话题页（开发中）</Text>
    </View>
  )
}
