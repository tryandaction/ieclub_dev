import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Publish() {
  useEffect(() => {
    // TabBar会自动根据路由更新选中状态
  }, [])

  const createTopic = (type: string) => {
    Taro.navigateTo({ url: `/pages/topics/create/index?type=${type}` })
  }

  return (
    <View className='publish-page'>
      <View className='mask' onClick={() => Taro.navigateBack()} />
      <View className='publish-menu'>
        <View className='menu-title'>选择发布类型</View>
        <View className='menu-options'>
          <View className='option' onClick={() => createTopic('offer')}>
            <View className='iconify-icon' data-icon='mdi:teach' />
            <Text className='option-text'>我来讲</Text>
            <Text className='option-desc'>分享知识与经验</Text>
          </View>
          <View className='option' onClick={() => createTopic('demand')}>
            <View className='iconify-icon' data-icon='mdi:ear-hearing' />
            <Text className='option-text'>想听</Text>
            <Text className='option-desc'>寻求帮助与学习</Text>
          </View>
          <View className='option' onClick={() => createTopic('project')}>
            <View className='iconify-icon' data-icon='mdi:rocket-launch' />
            <Text className='option-text'>项目</Text>
            <Text className='option-desc'>展示项目与招募</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
