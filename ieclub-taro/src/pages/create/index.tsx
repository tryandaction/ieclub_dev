// ==================== 📝 src/pages/create/index.tsx - 创建页面（来自开发代码） ====================
import { View, Input, Textarea, Picker, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { ContentType, Category, ITopic, IProject } from '../../types'
import './index.scss'

export default function Create() {
  const [type, setType] = useState<ContentType>(ContentType.TOPIC_OFFER)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: Category.TECH,
    tags: [] as string[],
    duration: '',
    targetAudience: '',
    lookingForRoles: [] as string[],
    images: [] as string[]
  })

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    try {
      // TODO: 调用API创建
      Taro.showToast({ title: '发布成功！', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      Taro.showToast({ title: '发布失败', icon: 'none' })
    }
  }

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        setFormData({ ...formData, images: [...formData.images, ...res.tempFilePaths] })
      }
    })
  }

  return (
    <View className="create-page">
      {/* 头部 */}
      <View className="create-header">
        <View className="header-gradient" />
        <View className="header-content">
          <View className="page-title">创建内容</View>
          <View className="type-selector">
            <View
              className={`type-btn ${type === ContentType.TOPIC_OFFER ? 'active' : ''}`}
              onClick={() => setType(ContentType.TOPIC_OFFER)}
            >
              🎤 我来讲
            </View>
            <View
              className={`type-btn ${type === ContentType.TOPIC_DEMAND ? 'active' : ''}`}
              onClick={() => setType(ContentType.TOPIC_DEMAND)}
            >
              🎧 想听
            </View>
            <View
              className={`type-btn ${type === ContentType.PROJECT ? 'active' : ''}`}
              onClick={() => setType(ContentType.PROJECT)}
            >
              💼 项目
            </View>
          </View>
        </View>
      </View>

      {/* 表单内容 */}
      <View className="form-container">
        {/* 标题 */}
        <View className="form-item">
          <View className="item-label">
            <View className="label-text">标题</View>
            <View className="label-required">*</View>
          </View>
          <Input
            className="input-field"
            placeholder={
              type === ContentType.TOPIC_OFFER
                ? '例如：Web3.0 技术趋势分享'
                : type === ContentType.TOPIC_DEMAND
                ? '例如：想了解量子计算的基础原理'
                : '例如：AI驱动的智能学习平台'
            }
            value={formData.title}
            onInput={(e) => setFormData({ ...formData, title: e.detail.value })}
          />
        </View>

        {/* 详细描述 */}
        <View className="form-item">
          <View className="item-label">
            <View className="label-text">详细描述</View>
            <View className="label-required">*</View>
          </View>
          <Textarea
            className="textarea-field"
            placeholder={
              type === ContentType.TOPIC_OFFER
                ? '分享的主要内容、适合人群、你的经验背景...'
                : type === ContentType.TOPIC_DEMAND
                ? '你想了解什么？希望解决什么问题？'
                : '项目介绍、技术栈、当前进展、团队情况...'
            }
            value={formData.description}
            onInput={(e) => setFormData({ ...formData, description: e.detail.value })}
            maxlength={500}
          />
          <View className="char-count">{formData.description.length}/500</View>
        </View>

        {/* 分类 */}
        <View className="form-item">
          <View className="item-label">
            <View className="label-text">分类</View>
          </View>
          <Picker
            mode="selector"
            range={['💻 技术', '💼 商业', '🎨 设计', '📚 学习', '🌟 生活', '📋 其他']}
            value={0}
            onChange={(e) => {
              const categories: Category[] = [Category.TECH, Category.BUSINESS, Category.DESIGN, Category.STUDY, Category.LIFE, Category.OTHER]
              setFormData({ ...formData, category: categories[e.detail.value as number] })
            }}
          >
            <View className="picker-field">
              <View className="picker-value">💻 技术</View>
              <View className="picker-arrow">›</View>
            </View>
          </Picker>
        </View>

        {/* 话题特有字段 */}
        {(type === ContentType.TOPIC_OFFER || type === ContentType.TOPIC_DEMAND) && (
          <>
            <View className="form-item">
              <View className="item-label">
                <View className="label-text">
                  {type === ContentType.TOPIC_OFFER ? '预计时长' : '期望时长'}
                </View>
              </View>
              <Input
                className="input-field"
                placeholder="例如：45分钟"
                value={formData.duration}
                onInput={(e) => setFormData({ ...formData, duration: e.detail.value })}
              />
            </View>

            <View className="form-item">
              <View className="item-label">
                <View className="label-text">目标听众</View>
              </View>
              <Input
                className="input-field"
                placeholder="例如：对AI感兴趣的同学"
                value={formData.targetAudience}
                onInput={(e) => setFormData({ ...formData, targetAudience: e.detail.value })}
              />
            </View>
          </>
        )}

        {/* 项目特有字段 */}
        {type === ContentType.PROJECT && (
          <View className="form-item">
            <View className="item-label">
              <View className="label-text">寻找队友</View>
            </View>
            <Input
              className="input-field"
              placeholder="例如：前端开发、UI设计师（逗号分隔）"
              onBlur={(e) => {
                const roles = e.detail.value.split(/[,，]/).filter(r => r.trim())
                setFormData({ ...formData, lookingForRoles: roles })
              }}
            />
          </View>
        )}

        {/* 标签 */}
        <View className="form-item">
          <View className="item-label">
            <View className="label-text">标签</View>
          </View>
          <Input
            className="input-field"
            placeholder="添加标签，逗号分隔（最多5个）"
            onBlur={(e) => {
              const tags = e.detail.value.split(/[,，]/).filter(t => t.trim()).slice(0, 5)
              setFormData({ ...formData, tags })
            }}
          />
          <View className="tags-preview">
            {formData.tags.map((tag, idx) => (
              <View key={idx} className="tag tag-blue">{tag}</View>
            ))}
          </View>
        </View>

        {/* 图片上传 */}
        <View className="form-item">
          <View className="item-label">
            <View className="label-text">图片（选填）</View>
          </View>
          <View className="image-upload">
            {formData.images.map((img, idx) => (
              <View key={idx} className="image-item">
                <Image className="image-preview" src={img} mode="aspectFill" />
                <View
                  className="image-delete"
                  onClick={() => {
                    const newImages = formData.images.filter((_, i) => i !== idx)
                    setFormData({ ...formData, images: newImages })
                  }}
                >
                  ✕
                </View>
              </View>
            ))}
            {formData.images.length < 9 && (
              <View className="upload-btn" onClick={handleChooseImage}>
                <View className="upload-icon">📷</View>
                <View className="upload-text">添加图片</View>
              </View>
            )}
          </View>
        </View>

        {/* 提示信息 */}
        <View className="tips-box">
          <View className="tips-icon">💡</View>
          <View className="tips-content">
            {type === ContentType.TOPIC_OFFER && (
              <View>当有 <View className="highlight">15人</View> 点击"想听"后，你可以安排时间开展分享！</View>
            )}
            {type === ContentType.TOPIC_DEMAND && (
              <View>当有 <View className="highlight">15人同求</View> 或有人点击"我能讲"时，即可组织交流！</View>
            )}
            {type === ContentType.PROJECT && (
              <View>展示你的项目，吸引志同道合的伙伴加入！</View>
            )}
          </View>
        </View>
      </View>

      {/* 底部按钮 */}
      <View className="bottom-bar">
        <View className="btn-cancel" onClick={() => Taro.navigateBack()}>
          取消
        </View>
        <View className="btn-submit" onClick={handleSubmit}>
          发布
        </View>
      </View>
    </View>
  )
}