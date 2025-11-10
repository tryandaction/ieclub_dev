import { useMemo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * 头像组件 - 支持图片头像和文字头像
 * 解决 ui-avatars.com 跨域问题，使用本地生成
 */
const Avatar = ({ 
  src, 
  name = '?', 
  size = 40, 
  className = '',
  onClick 
}) => {
  // 图片加载错误状态
  const [imageError, setImageError] = useState(false)
  // 生成背景颜色（基于名字哈希）
  const backgroundColor = useMemo(() => {
    if (!name) return '#667eea'
    
    // 简单哈希函数
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    // 预定义的柔和配色方案
    const colors = [
      '#667eea', // 紫色
      '#f093fb', // 粉色
      '#4facfe', // 蓝色
      '#43e97b', // 绿色
      '#fa709a', // 玫红
      '#feca57', // 黄色
      '#ff6b6b', // 红色
      '#48dbfb', // 青色
      '#ee5a6f', // 珊瑚色
      '#c44569', // 深粉
    ]
    
    return colors[Math.abs(hash) % colors.length]
  }, [name])
  
  // 获取首字母或首字
  const initial = useMemo(() => {
    if (!name) return '?'
    
    // 如果是中文，取第一个字
    if (/[\u4e00-\u9fa5]/.test(name)) {
      return name.charAt(0)
    }
    
    // 如果是英文，取首字母大写
    return name.charAt(0).toUpperCase()
  }, [name])
  
  // 检查是否是 emoji（更准确的检测）
  const isEmoji = useMemo(() => {
    if (!src || src.trim() === '') return false
    
    // 排除URL
    if (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:')) {
      return false
    }
    
    // 检测emoji：使用更准确的正则表达式
    // 匹配各种emoji范围，包括：
    // - 表情符号 (1F600-1F64F)
    // - 符号和图标 (1F300-1F5FF)
    // - 补充符号和图标 (1F900-1F9FF)
    // - 交通和地图符号 (1F680-1F6FF)
    // - 杂项符号 (2600-26FF)
    // - 装饰符号 (2700-27BF)
    // - 国旗 (1F1E0-1F1FF)
    // - 零宽连接符 (200D) 和变体选择器 (FE0F)
    // - 肤色修饰符 (1F3FB-1F3FF)
    const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}\u{200D}\u{FE0F}\u{1F3FB}-\u{1F3FF}]+$/u
    
    // 检查是否是emoji（长度限制放宽，因为某些emoji组合可能较长）
    if (src.length <= 20 && emojiPattern.test(src)) {
      return true
    }
    
    // 额外检查：如果字符串很短且不包含常见URL字符，可能是emoji
    if (src.length <= 10 && !src.includes('.') && !src.includes('@') && !src.includes(':')) {
      // 检查是否包含emoji字符
      const hasEmojiChar = /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(src)
      if (hasEmojiChar) {
        return true
      }
    }
    
    return false
  }, [src])
  
  // 当src改变时，重置图片错误状态
  useEffect(() => {
    setImageError(false)
  }, [src])
  
  // 如果是 emoji，直接显示
  if (isEmoji) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full flex-shrink-0 bg-gray-100 ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.5
        }}
        onClick={onClick}
      >
        {src}
      </div>
    )
  }
  
  // 如果有图片地址，显示图片头像
  if (src && src.trim() !== '' && !imageError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onClick={onClick}
      >
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => {
            // 图片加载失败，设置错误状态，显示文字头像
            setImageError(true)
          }}
        />
      </div>
    )
  }
  
  // 如果图片加载失败，显示文字头像
  if (imageError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full flex-shrink-0 text-white font-semibold ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor,
          fontSize: size * 0.4
        }}
        onClick={onClick}
      >
        {initial}
      </div>
    )
  }
  
  // 显示文字头像
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full flex-shrink-0 text-white font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor,
        fontSize: size * 0.4
      }}
      onClick={onClick}
    >
      {initial}
    </div>
  )
}

Avatar.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.number,
  className: PropTypes.string,
  onClick: PropTypes.func
}

export default Avatar

