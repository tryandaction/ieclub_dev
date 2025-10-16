// src/pages/create-topic/index.tsx - 创建话题页面

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
  const [tags, setTags] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
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
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  // 添加标签
  const addTag = async () => {
    const res = await Taro.showModal({
      title: '添加标签',
      editable: true,
      placeholderText: '请输入标签'
    })

    if (res.confirm && res.content) {
      const tag = res.content.trim()
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag])
      }
    }
  }

  // 删除标签
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
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
          {images.map((img, index) => (
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
          {tags.map(tag => (
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


// ==================== src/pages/create-topic/index.config.ts ====================

export default definePageConfig({
  navigationBarTitleText: '发布话题',
  enablePullDownRefresh: false
})


// ==================== src/pages/create-topic/index.scss ====================

.create-topic-page {
  min-height: 100vh;
  background: #fff;
  padding: 16px;

  .form-item {
    margin-bottom: 24px;
    position: relative;

    .label {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 12px;
    }

    .title-input {
      width: 100%;
      font-size: 18px;
      font-weight: 500;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .content-input {
      width: 100%;
      min-height: 200px;
      font-size: 16px;
      line-height: 1.6;
      padding: 12px 0;
    }

    .char-count {
      position: absolute;
      right: 0;
      bottom: 0;
      font-size: 12px;
      color: #999;
    }

    .category-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .category-item {
        padding: 8px 16px;
        border: 1px solid #e0e0e0;
        border-radius: 16px;
        font-size: 14px;
        color: #666;
        transition: all 0.3s;

        &.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: #fff;
        }
      }
    }

    .image-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .image-item {
        width: 100px;
        height: 100px;
        position: relative;
        border-radius: 8px;
        overflow: hidden;

        .image {
          width: 100%;
          height: 100%;
        }

        .remove-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 24px;
          height: 24px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
      }

      .add-image-btn {
        width: 100px;
        height: 100px;
        border: 2px dashed #e0e0e0;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        color: #ccc;
      }
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .tag-item {
        padding: 6px 12px;
        background: #f0f0f0;
        border-radius: 12px;
        font-size: 14px;
        color: #666;
        display: flex;
        align-items: center;
        gap: 8px;

        .remove-tag {
          font-size: 18px;
          color: #999;
        }
      }

      .add-tag-btn {
        padding: 6px 12px;
        border: 1px dashed #e0e0e0;
        border-radius: 12px;
        font-size: 14px;
        color: #999;
      }
    }
  }

  .submit-section {
    margin-top: 32px;

    .submit-btn {
      width: 100%;
      height: 48px;
      border-radius: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      font-size: 16px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

      &.disabled {
        opacity: 0.6;
        pointer-events: none;
      }
    }
  }
}


// ==================== src/components/TopicCard/index.tsx ====================

import { View, Image, Text } from '@tarojs/components'
import { formatRelativeTime } from '../../utils/format'
import type { Topic } from '../../types'
import './index.scss'

interface TopicCardProps {
  topic: Topic
  onClick?: () => void
}

export default function TopicCard({ topic, onClick }: TopicCardProps) {
  return (
    <View className='topic-card' onClick={onClick}>
      {/* 作者信息 */}
      <View className='card-header'>
        <Image className='avatar' src={topic.author.avatar} mode='aspectFill' />
        <View className='author-info'>
          <Text className='nickname'>{topic.author.nickname}</Text>
          <Text className='time'>{formatRelativeTime(topic.createdAt)}</Text>
        </View>
      </View>

      {/* 话题内容 */}
      <View className='card-content'>
        <Text className='title'>{topic.title}</Text>
        <Text className='content'>{topic.content}</Text>
      </View>

      {/* 图片（最多显示3张） */}
      {topic.images && topic.images.length > 0 && (
        <View className='card-images'>
          {topic.images.slice(0, 3).map((img, index) => (
            <Image
              key={index}
              className='image-item'
              src={img}
              mode='aspectFill'
            />
          ))}
        </View>
      )}

      {/* 标签 */}
      {topic.tags && topic.tags.length > 0 && (
        <View className='card-tags'>
          {topic.tags.slice(0, 3).map(tag => (
            <View key={tag} className='tag'>#{tag}</View>
          ))}
        </View>
      )}

      {/* 统计信息 */}
      <View className='card-footer'>
        <View className='stat-item'>
          <Text className='icon'>👁</Text>
          <Text className='value'>{topic.viewsCount}</Text>
        </View>
        <View className='stat-item'>
          <Text className='icon'>❤️</Text>
          <Text className='value'>{topic.likesCount}</Text>
        </View>
        <View className='stat-item'>
          <Text className='icon'>💬</Text>
          <Text className='value'>{topic.commentsCount}</Text>
        </View>
      </View>
    </View>
  )
}


// ==================== src/components/TopicCard/index.scss ====================

.topic-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      margin-right: 10px;
    }

    .author-info {
      flex: 1;

      .nickname {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
      }

      .time {
        font-size: 12px;
        color: #999;
      }
    }
  }

  .card-content {
    margin-bottom: 12px;

    .title {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: #333;
      line-height: 1.4;
      margin-bottom: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .content {
      display: block;
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
  }

  .card-images {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;

    .image-item {
      width: calc((100% - 16px) / 3);
      height: 80px;
      border-radius: 8px;
    }
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;

    .tag {
      padding: 4px 10px;
      background: #f0f0f0;
      border-radius: 10px;
      font-size: 12px;
      color: #666;
    }
  }

  .card-footer {
    display: flex;
    align-items: center;
    gap: 20px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;

      .icon {
        font-size: 14px;
      }

      .value {
        font-size: 12px;
        color: #999;
      }
    }
  }
}


// ==================== src/components/TopicFilters/index.tsx ====================

import { View, Picker } from '@tarojs/components'
import { useState } from 'react'
import type { TopicListParams } from '../../types'
import './index.scss'

interface TopicFiltersProps {
  filters: TopicListParams
  onChange: (filters: Partial<TopicListParams>) => void
}

export default function TopicFilters({ filters, onChange }: TopicFiltersProps) {
  const sortOptions = [
    { label: '最新', value: 'latest' },
    { label: '最热', value: 'hot' },
    { label: '精华', value: 'featured' }
  ]

  const categoryOptions = [
    { label: '全部', value: '' },
    { label: '技术', value: 'tech' },
    { label: '科学', value: 'science' },
    { label: '生活', value: 'life' },
    { label: '学习', value: 'study' },
    { label: '其他', value: 'other' }
  ]

  const [sortIndex, setSortIndex] = useState(0)
  const [categoryIndex, setCategoryIndex] = useState(0)

  const handleSortChange = (e: any) => {
    const index = e.detail.value
    setSortIndex(index)
    onChange({ sortBy: sortOptions[index].value as any })
  }

  const handleCategoryChange = (e: any) => {
    const index = e.detail.value
    setCategoryIndex(index)
    onChange({ category: categoryOptions[index].value || undefined })
  }

  return (
    <View className='topic-filters'>
      <Picker
        mode='selector'
        range={sortOptions.map(o => o.label)}
        value={sortIndex}
        onChange={handleSortChange}
      >
        <View className='filter-item'>
          <View className='filter-label'>{sortOptions[sortIndex].label}</View>
          <View className='filter-arrow'>▼</View>
        </View>
      </Picker>

      <Picker
        mode='selector'
        range={categoryOptions.map(o => o.label)}
        value={categoryIndex}
        onChange={handleCategoryChange}
      >
        <View className='filter-item'>
          <View className='filter-label'>{categoryOptions[categoryIndex].label}</View>
          <View className='filter-arrow'>▼</View>
        </View>
      </Picker>
    </View>
  )
}


// ==================== src/components/TopicFilters/index.scss ====================

.topic-filters {
  display: flex;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;

  .filter-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    background: #f5f5f5;
    border-radius: 20px;
    gap: 8px;

    .filter-label {
      font-size: 14px;
      color: #333;
    }

    .filter-arrow {
      font-size: 10px;
      color: #999;
    }
  }
}


// ==================== src/components/CommentList/index.tsx ====================

import { View, Image, Text } from '@tarojs/components'
import { formatRelativeTime } from '../../utils/format'
import type { Comment } from '../../types'
import './index.scss'

interface CommentListProps {
  comments: Comment[]
  onReply: (comment: Comment) => void
}

export default function CommentList({ comments, onReply }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <View className='empty-comments'>
        <Text>暂无评论，快来抢沙发吧~</Text>
      </View>
    )
  }

  return (
    <View className='comment-list'>
      {comments.map(comment => (
        <View key={comment.id} className='comment-item'>
          <Image className='avatar' src={comment.author.avatar} mode='aspectFill' />
          
          <View className='comment-content'>
            <View className='comment-header'>
              <Text className='nickname'>{comment.author.nickname}</Text>
              <Text className='time'>{formatRelativeTime(comment.createdAt)}</Text>
            </View>

            <Text className='content'>{comment.content}</Text>

            {/* 回复内容 */}
            {comment.replyTo && (
              <View className='reply-content'>
                <Text className='reply-text'>
                  回复 @{comment.replyTo.author.nickname}: {comment.replyTo.content}
                </Text>
              </View>
            )}

            <View className='comment-footer'>
              <View className='like-btn'>
                <Text className='icon'>❤️</Text>
                <Text className='count'>{comment.likesCount}</Text>
              </View>
              <View className='reply-btn' onClick={() => onReply(comment)}>
                <Text>回复</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}


// ==================== src/components/CommentList/index.scss ====================

.empty-comments {
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
  color: #999;
}

.comment-list {
  .comment-item {
    display: flex;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 18px;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .comment-content {
      flex: 1;

      .comment-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .nickname {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .time {
          font-size: 12px;
          color: #999;
        }
      }

      .content {
        display: block;
        font-size: 14px;
        color: #666;
        line-height: 1.6;
        margin-bottom: 8px;
      }

      .reply-content {
        padding: 8px 12px;
        background: #f5f5f5;
        border-radius: 8px;
        margin-bottom: 8px;

        .reply-text {
          font-size: 13px;
          color: #666;
          line-height: 1.5;
        }
      }

      .comment-footer {
        display: flex;
        align-items: center;
        gap: 20px;

        .like-btn,
        .reply-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #999;

          .icon {
            font-size: 14px;
          }
        }
      }
    }
  }
}


// ==================== src/components/CommentInput/index.tsx ====================

import { View, Input } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'

interface CommentInputProps {
  placeholder?: string
  onSend: (content: string) => void
  onCancel?: () => void
}

export default function CommentInput({ 
  placeholder = '写下你的评论...', 
  onSend,
  onCancel
}: CommentInputProps) {
  const [content, setContent] = useState('')

  const handleSend = () => {
    if (!content.trim()) return
    
    onSend(content.trim())
    setContent('')
  }

  return (
    <View className='comment-input'>
      <Input
        className='input'
        placeholder={placeholder}
        value={content}
        onInput={(e) => setContent(e.detail.value)}
      />
      
      {content.trim() ? (
        <View className='send-btn' onClick={handleSend}>
          发送
        </View>
      ) : null}
      
      {onCancel && (
        <View className='cancel-btn' onClick={onCancel}>
          取消
        </View>
      )}
    </View>
  )
}


// ==================== src/components/CommentInput/index.scss ====================

.comment-input {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 12px;

  .input {
    flex: 1;
    height: 36px;
    padding: 0 16px;
    background: #f5f5f5;
    border-radius: 18px;
    font-size: 14px;
  }

  .send-btn,
  .cancel-btn {
    padding: 8px 16px;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 500;
  }

  .send-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  .cancel-btn {
    background: #f0f0f0;
    color: #666;
  }
}


// ==================== src/components/EmptyState/index.tsx ====================

import { View, Text } from '@tarojs/components'
import './index.scss'

interface EmptyStateProps {
  title: string
  description?: string
  actionText?: string
  onAction?: () => void
}

export default function EmptyState({ 
  title, 
  description, 
  actionText, 
  onAction 
}: EmptyStateProps) {
  return (
    <View className='empty-state'>
      <View className='empty-icon'>📭</View>
      <Text className='empty-title'>{title}</Text>
      {description && <Text className='empty-description'>{description}</Text>}
      {actionText && onAction && (
        <View className='empty-action' onClick={onAction}>
          {actionText}
        </View>
      )}
    </View>
  )
}


// ==================== src/components/EmptyState/index.scss ====================

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
  }

  .empty-description {
    font-size: 14px;
    color: #999;
    text-align: center;
    margin-bottom: 24px;
  }

  .empty-action {
    padding: 10px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-radius: 20px;
    font-size: 14px;
  }
}


// ==================== src/components/LoadingSpinner/index.tsx ====================

import { View } from '@tarojs/components'
import './index.scss'

export default function LoadingSpinner() {
  return (
    <View className='loading-spinner'>
      <View className='spinner'></View>
      <View className='loading-text'>加载中...</View>
    </View>
  )
}


// ==================== src/components/LoadingSpinner/index.scss ====================

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f0f0f0;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .loading-text {
    margin-top: 16px;
    font-size: 14px;
    color: #999;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}