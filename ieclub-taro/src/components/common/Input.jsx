/**
 * IEClub Input 组件
 * 统一的输入框组件
 */
import React, { useState } from 'react'
import Icon from './Icon'

const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  label,
  icon,
  iconPosition = 'left',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false)
  
  // 尺寸样式
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  }
  
  // 基础样式
  const baseStyles = `
    w-full rounded-xl border transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${sizeStyles[size]}
    ${error ? 'border-red-500' : isFocused ? 'border-purple-500' : 'border-gray-300'}
    ${className}
  `.trim()
  
  const handleFocus = (e) => {
    setIsFocused(true)
    onFocus?.(e)
  }
  
  const handleBlur = (e) => {
    setIsFocused(false)
    onBlur?.(e)
  }
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Icon 
              icon={icon} 
              size="sm" 
              color={isFocused ? '#8b5cf6' : '#9ca3af'} 
            />
          </div>
        )}
        
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={baseStyles}
          style={{ paddingLeft: icon && iconPosition === 'left' ? '2.5rem' : undefined }}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Icon 
              icon={icon} 
              size="sm" 
              color={isFocused ? '#8b5cf6' : '#9ca3af'} 
            />
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default Input
