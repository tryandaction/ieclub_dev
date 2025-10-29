import { View, Text } from '@tarojs/components'
import './index.scss'

function CommunityPage() {
  return (
    <View className="container">
      <View className="title-box">
        <Text className="title">社区</Text>
      </View>
      
      <View className="content-box">
        <Text className="text">社区页面测试</Text>
      </View>
      
      <View className="card">
        <Text>用户卡片1</Text>
      </View>
      
      <View className="card">
        <Text>用户卡片2</Text>
      </View>
    </View>
  )
}

export default CommunityPage
