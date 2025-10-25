import { useState } from 'react'
import { View, Text, Textarea, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Publish() {
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState('topic_offer')

  const contentTypes = [
    { id: 'topic_offer', name: '我来讲', icon: 'mdi:microphone', color: '#5B7FFF' },
    { id: 'topic_demand', name: '想听', icon: 'mdi:ear-hearing', color: '#FF6B9D' },
    { id: 'project', name: '项目', icon: 'mdi:lightbulb-on', color: '#FFA500' }
  ]

  const chooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })
      setImages([...images, ...res.tempFilePaths])
    } catch (error) {
      console.error('选择图片失败', error)
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handlePublish = async () => {
    if (!title.trim()) {
      Taro.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return
    }

    if (!content.trim()) {
      Taro.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return
    }

    Taro.showLoading({ title: '发布中...' })
    
    try {
      // TODO: 实际发布逻辑
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      Taro.hideLoading()
      Taro.showToast({
        title: '发布成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/square/index' })
      }, 1500)
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '发布失败',
        icon: 'none'
      })
    }
  }

  return (
    <View className='publish-page'>
      {/* 顶部导航栏 */}
      <View className='nav-bar'>
        <View className='nav-left' onClick={() => Taro.switchTab({ url: '/pages/square/index' })}>
          <View className='iconify-icon' data-icon='mdi:close' />
        </View>
        <Text className='title'>发布内容</Text>
        <View className='nav-right' onClick={handlePublish}>
          <Text>发布</Text>
        </View>
      </View>

      {/* 内容类型选择 */}
      <View className='content-types'>
        {contentTypes.map(type => (
          <View
            key={type.id}
            className={`type-item ${selectedType === type.id ? 'active' : ''}`}
            style={{ borderColor: selectedType === type.id ? type.color : 'transparent' }}
            onClick={() => setSelectedType(type.id)}
          >
            <View 
              className='iconify-icon'
              data-icon={type.icon}
              style={{ color: selectedType === type.id ? type.color : '#999' }}
            />
            <Text style={{ color: selectedType === type.id ? type.color : '#666' }}>
              {type.name}
            </Text>
          </View>
        ))}
      </View>

      {/* 编辑区域 */}
      <View className='editor'>
        <Textarea
          className='title-input'
          placeholder='输入标题...'
          value={title}
          onInput={(e) => setTitle(e.detail.value)}
          maxlength={100}
          autoHeight
        />

        <Textarea
          className='content-input'
          placeholder='分享你的想法...'
          value={content}
          onInput={(e) => setContent(e.detail.value)}
          maxlength={5000}
          autoHeight
        />

        {/* 图片列表 */}
        <View className='image-list'>
          {images.map((img, index) => (
            <View key={index} className='image-item'>
              <Image src={img} mode='aspectFill' className='image' />
              <View 
                className='remove-btn'
                onClick={() => removeImage(index)}
              >
                <View className='iconify-icon' data-icon='mdi:close-circle' />
              </View>
            </View>
          ))}
          
          {images.length < 9 && (
            <View className='add-image' onClick={chooseImage}>
              <View className='iconify-icon' data-icon='mdi:plus' />
            </View>
          )}
        </View>
      </View>

      {/* 工具栏 */}
      <View className='toolbar'>
        <View className='tool-item' onClick={chooseImage}>
          <View className='iconify-icon' data-icon='mdi:image' />
          <Text>图片</Text>
        </View>
        <View className='tool-item'>
          <View className='iconify-icon' data-icon='mdi:tag' />
          <Text>话题</Text>
        </View>
        <View className='tool-item'>
          <View className='iconify-icon' data-icon='mdi:map-marker' />
          <Text>位置</Text>
        </View>
      </View>
    </View>
  )
}

