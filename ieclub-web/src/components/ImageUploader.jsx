import { useState, useRef } from 'react'
import { InlineLoading } from './Loading'

/**
 * 图片上传组件
 */
export default function ImageUploader({
  value = [],
  onChange,
  maxCount = 9,
  maxSize = 5, // MB
  accept = 'image/*'
}) {
  const [uploading, setUploading] = useState(false)
  const [previewImages, setPreviewImages] = useState(value)
  const fileInputRef = useRef(null)

  // 验证文件
  const validateFile = (file) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return '请选择图片文件'
    }

    // 检查文件大小
    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > maxSize) {
      return `图片大小不能超过 ${maxSize}MB`
    }

    return null
  }

  // 选择文件
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    
    // 检查数量限制
    if (previewImages.length + files.length > maxCount) {
      alert(`最多只能上传 ${maxCount} 张图片`)
      return
    }

    // 验证所有文件
    for (const file of files) {
      const error = validateFile(file)
      if (error) {
        alert(error)
        return
      }
    }

    setUploading(true)

    try {
      const newImages = []

      for (const file of files) {
        // 生成预览
        const preview = await readFileAsDataURL(file)
        
        // 这里可以调用上传接口
        // const url = await uploadToServer(file)
        
        newImages.push({
          file,
          preview,
          url: preview // 临时使用preview，实际应该使用服务器返回的URL
        })
      }

      const updatedImages = [...previewImages, ...newImages]
      setPreviewImages(updatedImages)
      onChange?.(updatedImages)
    } catch (error) {
      console.error('上传失败:', error)
      alert('图片上传失败，请重试')
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
    const updatedImages = previewImages.filter((_, i) => i !== index)
    setPreviewImages(updatedImages)
    onChange?.(updatedImages)
  }

  // 读取文件为DataURL
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="space-y-3">
      {/* 图片预览网格 */}
      {previewImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {previewImages.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
            >
              <img
                src={image.preview || image.url}
                alt={`预览 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* 删除按钮 */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                ×
              </button>
            </div>
          ))}

          {/* 添加按钮 */}
          {previewImages.length < maxCount && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary-500"
            >
              {uploading ? (
                <InlineLoading color="primary" />
              ) : (
                <>
                  <span className="text-3xl">+</span>
                  <span className="text-xs">添加图片</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* 首次上传按钮 */}
      {previewImages.length === 0 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary-500"
        >
          {uploading ? (
            <InlineLoading color="primary" />
          ) : (
            <>
              <span className="text-4xl">📷</span>
              <span className="text-sm">点击上传图片</span>
              <span className="text-xs">最多{maxCount}张，每张不超过{maxSize}MB</span>
            </>
          )}
        </button>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

/**
 * 单图上传组件
 */
export function SingleImageUploader({
  value,
  onChange,
  maxSize = 5,
  accept = 'image/*',
  width = 120,
  height = 120
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 验证文件
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > maxSize) {
      alert(`图片大小不能超过 ${maxSize}MB`)
      return
    }

    setUploading(true)

    try {
      // 生成预览
      const reader = new FileReader()
      reader.onload = (e) => {
        const previewUrl = e.target.result
        setPreview(previewUrl)
        onChange?.(previewUrl, file)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('上传失败:', error)
      alert('图片上传失败，请重试')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors"
        style={{ width, height }}
      >
        {preview ? (
          <img src={preview} alt="预览" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            {uploading ? (
              <InlineLoading color="primary" />
            ) : (
              <>
                <span className="text-3xl">📷</span>
                <span className="text-xs mt-1">上传图片</span>
              </>
            )}
          </div>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

