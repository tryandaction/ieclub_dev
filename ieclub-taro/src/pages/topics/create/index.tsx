import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Icon from '../../../components/Icon'
import { IconConfig } from '../../../config/icon.config'
import './index.scss'

export default function TopicCreate() {
  const goBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className='topic-create-page'>
      <View className='back-btn' onClick={goBack}>
        <Icon icon={IconConfig.nav.back} size={24} color="#333" />
      </View>
      <Text>创建话题页（开发中）</Text>
    </View>
  )
}
