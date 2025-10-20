// ==================== 输入框组件（增强版） ====================

import { Input as TaroInput, Textarea } from '@tarojs/components'
import classNames from 'classnames'
import './index.scss'

interface InputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onInput?: (e: any) => void
  onFocus?: () => void
  onBlur?: () => void
  disabled?: boolean
  maxlength?: number
  error?: boolean
  className?: string
  type?: 'text' | 'number' | 'idcard' | 'digit'
}

interface TextareaProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onInput?: (e: any) => void
  onFocus?: () => void
  onBlur?: () => void
  disabled?: boolean
  maxlength?: number
  error?: boolean
  className?: string
  rows?: number
  autoHeight?: boolean
}

export default function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  onInput,
  onFocus,
  onBlur,
  disabled = false,
  maxlength,
  error = false,
  className,
  ...props
}: InputProps) {
  const inputClass = classNames(
    'input',
    {
      'input--error': error
    },
    className
  )

  const handleInput = (e: any) => {
    const inputValue = e.detail?.value || ''
    onChange?.(inputValue)
    onInput?.(e)
  }

  return (
    <TaroInput
      className={inputClass}
      type={type}
      placeholder={placeholder}
      value={value}
      onInput={handleInput}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      maxlength={maxlength}
      {...props}
    />
  )
}

export function TextareaInput({
  placeholder,
  value,
  onChange,
  onInput,
  onFocus,
  onBlur,
  disabled = false,
  maxlength,
  error = false,
  rows = 3,
  autoHeight = false,
  className,
  ...props
}: TextareaProps) {
  const textareaClass = classNames(
    'textarea',
    {
      'textarea--error': error
    },
    className
  )

  const handleInput = (e: any) => {
    const inputValue = e.detail?.value || ''
    onChange?.(inputValue)
    onInput?.(e)
  }

  return (
    <Textarea
      className={textareaClass}
      placeholder={placeholder}
      value={value}
      onInput={handleInput}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      maxlength={maxlength}
      autoHeight={autoHeight}
      {...props}
    />
  )
}