/**
 * IEClub Card 组件
 * 统一的卡片组件，支持多种变体
 */
import React from 'react'
import { View } from '@tarojs/components'

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  // 变体样式
  const variantStyles = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-gray-300',
    filled: 'bg-gray-50 border border-gray-200'
  }
  
  // 内边距样式
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  }
  
  // 基础样式
  const baseStyles = `
    rounded-2xl transition-all duration-200
    ${variantStyles[variant]}
    ${paddingStyles[padding]}
    ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}
    ${className}
  `.trim()
  
  return (
    <View
      className={baseStyles}
      onClick={onClick}
      {...props}
    >
      {children}
    </View>
  )
}

export default Card
