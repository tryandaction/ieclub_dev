// src/pages/topics/create/index.tsx - 发帖页面

import { View, Text, Textarea, Image, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

const CATEGORIES = ['技术', '项目', '设计', '商业', '生活']
const TAGS_PRESET = ['AI', 'React', '前端', '后端', '设计', '创业', '学习', '分享']

export default function CreateTopicPage() {
  const [postType, setPostType] = useState<'supply' | 'demand'>('supply') // supply: 我来讲, demand: 想听
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: '技术',
    tags: [] as string[],
    images: [] as string[],
    targetCount: 15 // 目标人数（15人成团）
  })

  const [showTagPicker, setShowTagPicker] = useState(false)

  // 选择图片
  const chooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - form.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      setForm({
        ...form,
        images: [...form.images, ...res.tempFilePaths]
      })
    } catch (error) {
      console.error('选择图片失败', error)
    }
  }

  // 删除图片
  const removeImage = (index: number) => {
    const newImages = form.images.filter((_, i) => i !== index)
    setForm({ ...form, images: newImages })
  }

  // 添加标签
  const addTag = (tag: string) => {
    if (form.tags.includes(tag)) {
      setForm({
        ...form,
        tags: form.tags.filter(t => t !== tag)
      })
    } else if (form.tags.length < 5) {
      setForm({
        ...form,
        tags: [...form.tags, tag]
      })
    } else {
      Taro.showToast({ title: '最多选择5个标签', icon: 'none' })
    }
  }

  // 发布
  const handleSubmit = async () => {
    // 验证
    if (!form.title.trim()) {
      Taro.showToast({ title: '请输入标题', icon: 'none' })
      return
    }

    if (!form.content.trim()) {
      Taro.showToast({ title: '请输入内容', icon: 'none' })
      return
    }

    if (form.tags.length === 0) {
      Taro.showToast({ title: '请至少选择1个标签', icon: 'none' })
      return
    }

    try {
      Taro.showLoading({ title: '发布中...' })

      // TODO: 上传图片到服务器
      // const imageUrls = await uploadImages(form.images)

      // TODO: 调用发布接口
      // await createTopic({
      //   ...form,
      //   type: postType,
      //   images: imageUrls
      // })

      // 模拟发布
      await new Promise(resolve => setTimeout(resolve, 1500))

      Taro.hideLoading()
      Taro.showToast({ title: '发布成功', icon: 'success' })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)

    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({ title: '发布失败', icon: 'none' })
    }
  }

  return (
    <View className='create-topic-page'>
      {/* 顶部类型选择 */}
      <View className='type-selector'>
        <View
          className={`type-btn ${postType === 'supply' ? 'active supply' : ''}`}
          onClick={() => setPostType('supply')}
        >
          <Text className='type-icon'>💬</Text>
          <Text className='type-text'>我来讲</Text>
          {postType === 'supply' && <Text className='type-desc'>分享知识和经验</Text>}
        </View>

        <View
          className={`type-btn ${postType === 'demand' ? 'active demand' : ''}`}
          onClick={() => setPostType('demand')}
        >
          <Text className='type-icon'>🎯</Text>
          <Text className='type-text'>想听</Text>
          {postType === 'demand' && <Text className='type-desc'>寻找讲者和资源</Text>}
        </View>
      </View>

      {/* 表单内容 */}
      <View className='form-container'>
        {/* 标题 */}
        <View className='form-section'>
          <View className='section-label'>
            <Text className='label-text'>标题</Text>
            <Text className='label-required'>*</Text>
          </View>
          <Textarea
            className='title-input'
            placeholder={postType === 'supply' ? '例如：GPT-4教育应用实战经验分享' : '例如：寻找React Native开发大神'}
            value={form.title}
            onInput={(e) => setForm({ ...form, title: e.detail.value })}
            maxlength={100}
            autoHeight
          />
          <View className='char-count'>{form.title.length}/100</View>
        </View>

        {/* 内容 */}
        <View className='form-section'>
          <View className='section-label'>
            <Text className='label-text'>详细描述</Text>
            <Text className='label-required'>*</Text>
          </View>
          <Textarea
            className='content-input'
            placeholder={
              postType === 'supply'
                ? '详细描述你要分享的内容、适合人群、预计时长等...'
                : '描述你想了解什么、期望获得什么帮助、希望讲者具备什么条件...'
            }
            value={form.content}
            onInput={(e) => setForm({ ...form, content: e.detail.value })}
            maxlength={1000}
          />
          <View className='char-count'>{form.content.length}/1000</View>
        </View>

        {/* 图片上传 */}
        <View className='form-section'>
          <View className='section-label'>
            <Text className='label-text'>添加图片</Text>
            <Text className='label-tip'>最多9张</Text>
          </View>
          <View className='image-grid'>
            {form.images.map((img, index) => (
              <View key={index} className='image-item'>
                <Image className='preview-image' src={img} mode='aspectFill' />
                <View className='delete-btn' onClick={() => removeImage(index)}>
                  ✕
                </View>
              </View>
            ))}
            {form.images.length < 9 && (
              <View className='add-image-btn' onClick={chooseImage}>
                <Text className='add-icon'>+</Text>
              </View>
            )}
          </View>
        </View>

        {/* 分类选择 */}
        <View className='form-section'>
          <View className='section-label'>
            <Text className='label-text'>选择分类</Text>
          </View>
          <View className='category-list'>
            {CATEGORIES.map(cat => (
              <View
                key={cat}
                className={`category-chip ${form.category === cat ? 'active' : ''}`}
                onClick={() => setForm({ ...form, category: cat })}
              >
                {cat}
              </View>
            ))}
          </View>
        </View>

        {/* 标签选择 */}
        <View className='form-section'>
          <View className='section-label'>
            <Text className='label-text'>添加标签</Text>
            <Text className='label-tip'>最多5个</Text>
          </View>
          <View className='selected-tags'>
            {form.tags.map((tag, index) => (
              <View key={index} className='selected-tag'>
                #{tag}
                <Text className='remove-tag' onClick={() => addTag(tag)}>✕</Text>
              </View>
            ))}
          </View>
          <View className='tag-picker'>
            {TAGS_PRESET.map(tag => (
              <View
                key={tag}
                className={`tag-chip ${form.tags.includes(tag) ? 'selected' : ''}`}
                onClick={() => addTag(tag)}
              >
                #{tag}
              </View>
            ))}
          </View>
        </View>

        {/* 目标人数（15人成团）*/}
        {postType === 'supply' && (
          <View className='form-section'>
            <View className='section-label'>
              <Text className='label-text'>目标人数</Text>
              <Text className='label-tip'>达到人数即可安排</Text>
            </View>
            <View className='target-count-box'>
              <Text className='target-number'>{form.targetCount}</Text>
              <Text className='target-text'>人想听即可开讲</Text>
            </View>
            <View className='count-slider'>
              <Text>10</Text>
              <View className='slider-bar'>
                <View
                  className='slider-track'
                  style={{ width: `${((form.targetCount - 10) / 40) * 100}%` }}
                />
                <View
                  className='slider-thumb'
                  style={{ left: `${((form.targetCount - 10) / 40) * 100}%` }}
                />
              </View>
              <Text>50</Text>
            </View>
          </View>
        )}

        {/* 温馨提示 */}
        <View className='tips-box'>
          <Text className='tips-title'>📌 温馨提示</Text>
          {postType === 'supply' ? (
            <>
              <Text className='tips-item'>• 详细描述分享内容，吸引更多人关注</Text>
              <Text className='tips-item'>• 达到目标人数后，我们会联系你安排分享时间</Text>
              <Text className='tips-item'>• 可上传相关图片增加吸引力</Text>
            </>
          ) : (
            <>
              <Text className='tips-item'>• 清楚描述你的需求，方便讲者了解</Text>
              <Text className='tips-item'>• 标注你的技能水平，便于匹配合适讲者</Text>
              <Text className='tips-item'>• 足够的诚意会吸引更多人响应</Text>
            </>
          )}
        </View>
      </View>

      {/* 底部发布按钮 */}
      <View className='bottom-bar'>
        <Button className='submit-btn' onClick={handleSubmit}>
          <Text className='btn-text'>
            {postType === 'supply' ? '🚀 发布分享' : '🎯 发布需求'}
          </Text>
        </Button>
      </View>
    </View>
  )
}