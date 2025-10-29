/**
 * IEClub Icon 组件
 * 基于 @iconify/react 的统一图标组件
 */
import React from 'react'
import { Icon as IconifyIcon } from '@iconify/react'

const Icon = ({ 
  icon, 
  size = 'md', 
  color, 
  className = '', 
  onClick,
  ...props 
}) => {
  // 尺寸映射
  const sizeMap = {
    xs: '16px',
    sm: '20px',
    md: '24px',
    lg: '32px',
    xl: '40px',
    '2xl': '48px'
  }
  
  const iconSize = typeof size === 'number' ? `${size}px` : sizeMap[size] || sizeMap.md
  
  const iconStyle = {
    fontSize: iconSize,
    color: color,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease-in-out'
  }
  
  return (
    <IconifyIcon
      icon={icon}
      style={iconStyle}
      className={className}
      onClick={onClick}
      {...props}
    />
  )
}

export default Icon
