import { useState, useCallback } from 'react'
import { View, Text, Input, Textarea, Button, Image, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { getApiBaseUrl } from '@/utils/api'
import './index.scss'

const ActivityCreate = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    maxParticipants: '',
    category: '',
    tags: [] as string[],
    images: [] as string[]
  })

  const [loading, setLoading] = useState(false)

  const categories = [
    '学术讲座',
    '技术分享',
    '社交活动',
    '体育运动',
    '文艺表演',
    '志愿服务',
    '其他'
  ]

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCategoryChange = (e: any) => {
    setForm(prev => ({
      ...prev,
      category: categories[e.detail.value]
    }))
  }

  const handleChooseImages = useCallback(async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - form.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths.length > 0) {
        setForm(prev => ({
          ...prev,
          images: [...prev.images, ...res.tempFilePaths]
        }))
      }
    } catch (error) {
      console.error('选择图片失败:', error)
    }
  }, [form.images.length])

  const handleRemoveImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Taro.showToast({ title: '请输入活动标题', icon: 'none' })
      return
    }

    if (!form.description.trim()) {
      Taro.showToast({ title: '请输入活动描述', icon: 'none' })
      return
    }

    if (!form.location.trim()) {
      Taro.showToast({ title: '请输入活动地点', icon: 'none' })
      return
    }

    if (!form.startTime) {
      Taro.showToast({ title: '请选择开始时间', icon: 'none' })
      return
    }

    if (!form.category) {
      Taro.showToast({ title: '请选择活动分类', icon: 'none' })
      return
    }

    try {
      setLoading(true)

      // 上传图片
      const uploadedImages = []
      for (const imagePath of form.images) {
        const uploadRes = await Taro.uploadFile({
          url: `${getApiBaseUrl()}/upload/image`,
          filePath: imagePath,
          name: 'image',
          header: {
            'Authorization': `Bearer ${Taro.getStorageSync('token')}`
          }
        })

        if (uploadRes.statusCode === 200) {
          const data = JSON.parse(uploadRes.data)
          if (data.success) {
            uploadedImages.push(data.data.url)
          }
        }
      }

      // 创建活动
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/activities`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`,
          'Content-Type': 'application/json'
        },
        data: {
          ...form,
          images: uploadedImages,
          maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : null
        }
      })

      if (res.data.success) {
        Taro.showToast({ title: '活动创建成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res.data.message || '创建失败', icon: 'none' })
      }
    } catch (error) {
      console.error('创建活动失败:', error)
      Taro.showToast({ title: '创建失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    Taro.setNavigationBarTitle({ title: '创建活动' })
  })

  return (
    <View className='activity-create-page'>
      <View className='form-container'>
        {/* 基本信息 */}
        <View className='form-section'>
          <Text className='section-title'>基本信息</Text>
          
          <View className='form-item'>
            <Text className='label'>活动标题 *</Text>
            <Input
              className='input'
              placeholder='请输入活动标题'
              value={form.title}
              id='activity-title'
              name='title'
              onInput={(e) => handleInputChange('title', e.detail.value)}
            />
          </View>

          <View className='form-item'>
            <Text className='label'>活动描述 *</Text>
            <Textarea
              className='textarea'
              placeholder='请详细描述活动内容、流程等'
              value={form.description}
              onInput={(e) => handleInputChange('description', e.detail.value)}
              maxlength={500}
            />
          </View>

          <View className='form-item'>
            <Text className='label'>活动地点 *</Text>
            <Input
              className='input'
              placeholder='请输入活动地点'
              value={form.location}
              id='activity-location'
              name='location'
              onInput={(e) => handleInputChange('location', e.detail.value)}
            />
          </View>

          <View className='form-item'>
            <Text className='label'>活动分类 *</Text>
            <Picker
              mode='selector'
              range={categories}
              value={categories.indexOf(form.category)}
              onChange={handleCategoryChange}
            >
              <View className='picker'>
                {form.category || '请选择活动分类'}
              </View>
            </Picker>
          </View>
        </View>

        {/* 时间设置 */}
        <View className='form-section'>
          <Text className='section-title'>时间设置</Text>
          
          <View className='form-item'>
            <Text className='label'>开始时间 *</Text>
            <Picker
              mode='datetime'
              value={form.startTime}
              onChange={(e) => handleInputChange('startTime', e.detail.value)}
            >
              <View className='picker'>
                {form.startTime || '请选择开始时间'}
              </View>
            </Picker>
          </View>

          <View className='form-item'>
            <Text className='label'>结束时间</Text>
            <Picker
              mode='datetime'
              value={form.endTime}
              onChange={(e) => handleInputChange('endTime', e.detail.value)}
            >
              <View className='picker'>
                {form.endTime || '请选择结束时间'}
              </View>
            </Picker>
          </View>

          <View className='form-item'>
            <Text className='label'>最大参与人数</Text>
            <Input
              className='input'
              placeholder='不限制请留空'
              type='number'
              value={form.maxParticipants}
              id='activity-max-participants'
              name='maxParticipants'
              onInput={(e) => handleInputChange('maxParticipants', e.detail.value)}
            />
          </View>
        </View>

        {/* 图片上传 */}
        <View className='form-section'>
          <Text className='section-title'>活动图片</Text>
          
          <View className='image-upload'>
            <View className='image-list'>
              {form.images.map((image, index) => (
                <View key={index} className='image-item'>
                  <Image src={image} className='image' mode='aspectFill' />
                  <View 
                    className='remove-btn'
                    onClick={() => handleRemoveImage(index)}
                  >
                    ×
                  </View>
                </View>
              ))}
              
              {form.images.length < 9 && (
                <View className='add-image-btn' onClick={handleChooseImages}>
                  <Text className='add-text'>+</Text>
                  <Text className='add-label'>添加图片</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 提交按钮 */}
        <View className='submit-section'>
          <Button
            className='submit-btn'
            loading={loading}
            onClick={handleSubmit}
          >
            {loading ? '创建中...' : '创建活动'}
          </Button>
        </View>
      </View>
    </View>
  )
}

export default ActivityCreate
