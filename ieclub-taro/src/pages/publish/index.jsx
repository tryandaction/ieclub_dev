import { View, Text } from '@tarojs/components'
import './index.scss'

function PublishPage() {
  return (
    <View className="container">
      <View className="title-box">
        <Text className="title">发布</Text>
      </View>
      
      <View className="content-box">
        <Text className="text">发布页面</Text>
      </View>
      
      <View className="card">
        <Text>发布话题</Text>
      </View>
    </View>
  )
}

export default PublishPage

