/**
 * IEClub Button 组件
 * 统一的按钮组件，支持多种变体和状态
 */
import React from 'react'
import Icon from './Icon'

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) => {
  // 变体样式
  const variantStyles = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-green-500 text-white hover:bg-green-600'
  }
  
  // 尺寸样式
  const sizeStyles = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  }
  
  // 基础样式
  const baseStyles = `
    inline-flex items-center justify-center
    font-semibold rounded-xl
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `.trim()
  
  const handleClick = (e) => {
    if (loading || disabled) return
    onClick?.(e)
  }
  
  return (
    <button
      className={baseStyles}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Icon 
          icon="mdi:loading" 
          size="sm" 
          className="animate-spin mr-2" 
        />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <Icon 
          icon={icon} 
          size="sm" 
          className="mr-2" 
        />
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <Icon 
          icon={icon} 
          size="sm" 
          className="ml-2" 
        />
      )}
    </button>
  )
}

export default Button
