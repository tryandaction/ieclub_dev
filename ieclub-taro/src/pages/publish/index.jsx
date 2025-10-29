import { View, Text, Input, Textarea } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function PublishPage() {
  const [publishType, setPublishType] = useState('offer')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handlePublish = () => {
    if (!title.trim()) {
      Taro.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return
    }
    
    if (!description.trim()) {
      Taro.showToast({
        title: '请输入详细描述',
        icon: 'none'
      })
      return
    }

    Taro.showToast({
      title: '发布成功',
      icon: 'success',
      duration: 2000
    })

    // 清空表单
    setTitle('')
    setDescription('')
    
    // 返回广场页
    setTimeout(() => {
      Taro.switchTab({
        url: '/pages/plaza/index'
      })
    }, 2000)
  }

  const typeConfig = {
    offer: { label: '我来讲', icon: '🎤', gradient: 'from-blue-500 to-blue-600', placeholder: '例如：Python爬虫实战教学' },
    demand: { label: '想听', icon: '👂', gradient: 'from-pink-500 to-pink-600', placeholder: '例如：求线性代数期末串讲' },
    project: { label: '项目', icon: '🚀', gradient: 'from-orange-500 to-orange-600', placeholder: '例如：智能选课助手' }
  }

  return (
    <View className="publish-page">
      <View className="publish-header">
        <Text className="page-title">发布内容</Text>
      </View>

      {/* 类型选择 */}
      <View className="type-selector">
        {Object.entries(typeConfig).map(([key, config]) => (
          <View
            key={key}
            className={`type-item ${publishType === key ? 'active' : ''} ${config.gradient}`}
            onClick={() => setPublishType(key)}
          >
            <Text className="type-icon">{config.icon}</Text>
            <Text className="type-label">{config.label}</Text>
          </View>
        ))}
      </View>

      {/* 表单区域 */}
      <View className="publish-form">
        <View className="form-item">
          <Text className="form-label">标题</Text>
          <Input
            className="form-input"
            placeholder={typeConfig[publishType].placeholder}
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={50}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">详细描述</Text>
          <Textarea
            className="form-textarea"
            placeholder="详细说明你的内容..."
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={500}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">添加标签</Text>
          <View className="tag-list">
            {['Python', '爬虫', '实战', '数据分析', '机器学习'].map(tag => (
              <View key={tag} className="tag-item">
                <Text className="tag-text">#{tag}</Text>
              </View>
            ))}
            <View className="tag-item add-tag">
              <Text className="tag-text">+ 自定义</Text>
            </View>
          </View>
        </View>

        {/* 发布按钮 */}
        <View className="publish-btn" onClick={handlePublish}>
          <Text className="publish-btn-text">发布</Text>
        </View>
      </View>
    </View>
  )
}
