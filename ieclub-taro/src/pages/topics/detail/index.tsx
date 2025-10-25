import { useState } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function TopicDetail() {
  const [topicId, setTopicId] = useState('')

  const goBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className='topic-detail-page'>
      <View className='back-btn' onClick={goBack}>
        <View className='iconify-icon' data-icon='mdi:arrow-left' />
      </View>
      <Text>话题详情页（开发中）</Text>
    </View>
  )
}
