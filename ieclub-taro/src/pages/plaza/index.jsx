import { View, Text } from '@tarojs/components'
import './index.scss'

function PlazaPage() {
  return (
    <View className="container">
      <View className="title-box">
        <Text className="title">话题广场</Text>
      </View>
      
      <View className="content-box">
        <Text className="text">Hello, IEClub!</Text>
        <Text className="text">小程序测试页面</Text>
      </View>
      
      <View className="card">
        <Text>测试卡片1</Text>
      </View>
      
      <View className="card">
        <Text>测试卡片2</Text>
      </View>
    </View>
  )
}

export default PlazaPage
