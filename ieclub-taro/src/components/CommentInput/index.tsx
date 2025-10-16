// ==================== 评论输入组件（增强版） ====================

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