/**
 * 图片上传组件
 * 支持单张或多张图片上传、预览、删除
 */

import { useState, useRef } from 'react'
import { showToast } from './Toast'

export default function ImageUpload({ 
  value = [], 
  onChange, 
  maxCount = 9,
  maxSize = 5, // MB
  accept = 'image/*'
}) {
  const [previews, setPreviews] = useState(value)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // 文件选择处理
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    
    if (files.length === 0) return

    // 检查数量限制
    if (previews.length + files.length > maxCount) {
      showToast(`最多只能上传${maxCount}张图片`, 'warning')
      return
    }

    // 验证文件
    const validFiles = []
    for (const file of files) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        showToast(`${file.name} 不是图片文件`, 'error')
        continue
      }

      // 检查文件大小
      if (file.size > maxSize * 1024 * 1024) {
        showToast(`${file.name} 超过${maxSize}MB大小限制`, 'error')
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    try {
      setUploading(true)

      // 生成预览
      const newPreviews = await Promise.all(
        validFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve({
                file,
                url: reader.result,
                name: file.name,
                size: file.size
              })
            }
            reader.readAsDataURL(file)
          })
        })
      )

      const updatedPreviews = [...previews, ...newPreviews]
      setPreviews(updatedPreviews)
      onChange?.(updatedPreviews)

      showToast(`成功添加${validFiles.length}张图片`, 'success')
    } catch (error) {
      console.error('图片预览失败:', error)
      showToast('图片预览失败', 'error')
    } finally {
      setUploading(false)
      // 清空input，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 删除图片
  const handleRemove = (index) => {
    const updatedPreviews = previews.filter((_, i) => i !== index)
    setPreviews(updatedPreviews)
    onChange?.(updatedPreviews)
    showToast('图片已移除', 'success')
  }

  // 触发文件选择
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // 格式化文件大小
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const canAddMore = previews.length < maxCount

  return (
    <div className="space-y-4">
      {/* 图片预览网格 */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden"
            >
              {/* 图片 */}
              <img
                src={preview.url}
                alt={preview.name}
                className="w-full h-full object-cover"
              />

              {/* 遮罩层和操作按钮 */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 文件信息 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-white text-xs truncate">{preview.name}</p>
                <p className="text-white/80 text-xs">{formatSize(preview.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮 */}
      {canAddMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={maxCount > 1}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-center space-y-2">
              <div className="text-4xl">
                {uploading ? '⏳' : '📷'}
              </div>
              <div>
                <p className="text-gray-700 font-medium">
                  {uploading ? '处理中...' : '点击上传图片'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  支持 JPG、PNG、GIF，最大{maxSize}MB，最多{maxCount}张
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  已上传 {previews.length}/{maxCount}
                </p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 已达上限提示 */}
      {!canAddMore && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-blue-600 text-sm">
            已达到最大上传数量 ({maxCount}张)
          </p>
        </div>
      )}
    </div>
  )
}

// 简化版 - 单图上传
export function SingleImageUpload({ value, onChange, ...props }) {
  return (
    <ImageUpload
      value={value ? [value] : []}
      onChange={(previews) => onChange?.(previews[0])}
      maxCount={1}
      {...props}
    />
  )
}

