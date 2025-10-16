// ==================== 创建话题页面（增强版） ====================

import { View, Input, Textarea, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { useTopicStore } from '../../store/topic'
import { uploadImages } from '../../services/upload'
import './index.scss'

export default function CreateTopicPage() {
  const { createTopic } = useTopicStore()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<any>([])
  const [images, setImages] = useState<any>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const categories = [
    { value: 'tech', label: '技术' },
    { value: 'science', label: '科学' },
    { value: 'life', label: '生活' },
    { value: 'study', label: '学习' },
    { value: 'other', label: '其他' }
  ]

  // 选择图片
  const chooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      setUploading(true)

      try {
        const urls = await uploadImages(res.tempFilePaths)
        setImages([...images, ...urls])
      } catch (error) {
        Taro.showToast({
          title: '上传失败',
          icon: 'none'
        })
      } finally {
        setUploading(false)
      }
    } catch (error) {
      console.error('选择图片失败:', error)
    }
  }

  // 删除图片
  const removeImage = function(index: any) {
    setImages(images.filter(function() { return false }))
  }

  // 添加标签
  const addTag = () => {
    // 暂时禁用此功能，避免小程序环境错误
    Taro.showToast({
      title: '标签功能开发中',
      icon: 'none'
    })
    // TODO: 实现小程序原生的标签输入功能
    // 可以考虑使用自定义模态框或跳转到新页面
  }

  // 删除标签
  const removeTag = function(tag: any) {
    setTags(tags.filter(function() { return false }))
  }

  // 提交话题
  const handleSubmit = async () => {
    // 验证
    if (!title.trim()) {
      Taro.showToast({ title: '请输入标题', icon: 'none' })
      return
    }

    if (!content.trim()) {
      Taro.showToast({ title: '请输入内容', icon: 'none' })
      return
    }

    if (!category) {
      Taro.showToast({ title: '请选择分类', icon: 'none' })
      return
    }

    setSubmitting(true)

    try {
      await createTopic({
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        images
      })

      Taro.showToast({
        title: '发布成功',
        icon: 'success'
      })

      // 返回上一页
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('发布失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='create-topic-page'>
      {/* 标题输入 */}
      <View className='form-item'>
        <Input
          className='title-input'
          placeholder='输入标题'
          value={title}
          maxlength={100}
          onInput={(e) => setTitle(e.detail.value)}
        />
        <View className='char-count'>{title.length}/100</View>
      </View>

      {/* 分类选择 */}
      <View className='form-item'>
        <View className='label'>分类</View>
        <View className='category-list'>
          {categories.map(cat => (
            <View
              key={cat.value}
              className={`category-item ${category === cat.value ? 'active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </View>
          ))}
        </View>
      </View>

      {/* 内容输入 */}
      <View className='form-item'>
        <Textarea
          className='content-input'
          placeholder='分享你的想法...'
          value={content}
          maxlength={2000}
          autoHeight
          onInput={(e) => setContent(e.detail.value)}
        />
        <View className='char-count'>{content.length}/2000</View>
      </View>

      {/* 图片上传 */}
      <View className='form-item'>
        <View className='label'>图片 ({images.length}/9)</View>
        <View className='image-list'>
          {images.map((img: any, index: any) => (
            <View key={index} className='image-item'>
              <Image className='image' src={img} mode='aspectFill' />
              <View className='remove-btn' onClick={() => removeImage(index)}>
                ×
              </View>
            </View>
          ))}

          {images.length < 9 && (
            <View className='add-image-btn' onClick={chooseImage}>
              {uploading ? '上传中...' : '+'}
            </View>
          )}
        </View>
      </View>

      {/* 标签 */}
      <View className='form-item'>
        <View className='label'>标签</View>
        <View className='tags-list'>
          {tags.map((tag: any) => (
            <View key={tag} className='tag-item'>
              #{tag}
              <View className='remove-tag' onClick={() => removeTag(tag)}>
                ×
              </View>
            </View>
          ))}

          {tags.length < 5 && (
            <View className='add-tag-btn' onClick={addTag}>
              + 添加标签
            </View>
          )}
        </View>
      </View>

      {/* 提交按钮 */}
      <View className='submit-section'>
        <View
          className={`submit-btn ${submitting ? 'disabled' : ''}`}
          onClick={handleSubmit}
        >
          {submitting ? '发布中...' : '发布'}
        </View>
      </View>
    </View>
  )
}