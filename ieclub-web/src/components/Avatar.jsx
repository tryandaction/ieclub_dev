import { useMemo } from 'react'
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
  
  // 检查是否是 emoji（单个字符且不是 URL）
  const isEmoji = src && src.trim() !== '' && src.length <= 4 && !src.startsWith('http') && !src.startsWith('/')
  
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
  if (src && src.trim() !== '') {
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
          onError={(e) => {
            // 图片加载失败，隐藏图片，显示文字头像
            e.target.style.display = 'none'
            e.target.parentElement.innerHTML = `
              <div class="w-full h-full flex items-center justify-center text-white font-semibold"
                   style="background-color: ${backgroundColor}; font-size: ${size * 0.4}px">
                ${initial}
              </div>
            `
          }}
        />
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

