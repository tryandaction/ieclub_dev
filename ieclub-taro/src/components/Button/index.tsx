// ==================== 按钮组件（增强版） ====================

import { Button as TaroButton, View } from '@tarojs/components'
import { ButtonProps as TaroButtonProps } from '@tarojs/components/types/Button'
import classNames from 'classnames'
import './index.scss'

interface ButtonProps extends Omit<TaroButtonProps, 'type' | 'size'> {
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  size?: 'small' | 'medium' | 'large'
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  disabled = false,
  loading = false,
  block = false,
  size = 'medium',
  className,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const buttonClass = classNames(
    'btn',
    `btn--${variant}`,
    {
      'btn--disabled': disabled || loading,
      'btn--block': block,
      [`btn--${size}`]: size !== 'medium'
    },
    className
  )

  const handleClick = (e: any) => {
    if (disabled || loading) {
      return
    }
    onClick?.(e)
  }

  return (
    <TaroButton
      className={buttonClass}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {loading && <View className='btn-loading' />}
      {children}
    </TaroButton>
  )
}