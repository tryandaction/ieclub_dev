// ==================== 严格类型验证系统 ====================

import type { EnhancedTopic } from '../types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(errors.join(', '))
    this.name = 'ValidationError'
  }
}

// 话题验证
export function validateTopic(topic: Partial<EnhancedTopic>): ValidationResult {
  const errors: string[] = []

  // 标题验证
  if (!topic.title || typeof topic.title !== 'string') {
    errors.push('标题不能为空')
  } else if (topic.title.length < 5) {
    errors.push('标题至少5个字符')
  } else if (topic.title.length > 100) {
    errors.push('标题最多100个字符')
  } else if (/^\s+|\s+$/.test(topic.title)) {
    errors.push('标题不能以空格开头或结尾')
  }

  // 内容验证
  if (!topic.content || typeof topic.content !== 'string') {
    errors.push('内容不能为空')
  } else if (topic.content.length < 10) {
    errors.push('内容至少10个字符')
  } else if (topic.content.length > 10000) {
    errors.push('内容最多10000个字符')
  }

  // 分类验证
  const validCategories = ['tech', 'science', 'life', 'study', 'project', 'other']
  if (!topic.category || !validCategories.includes(topic.category)) {
    errors.push('请选择有效的分类')
  }

  // 标签验证
  if (topic.tags) {
    if (topic.tags.length > 5) {
      errors.push('最多选择5个标签')
    }

    topic.tags.forEach((tag: string) => {
      if (tag.length > 20) {
        errors.push(`标签"${tag}"过长，最多20个字符`)
      }
    })
  }

  // 需求信息验证
  if (topic.demand) {
    if (!topic.demand.type || !['seeking', 'offering', 'collaboration'].includes(topic.demand.type)) {
      errors.push('请选择有效的需求类型')
    }

    if (topic.demand.skillsRequired && topic.demand.skillsRequired.length === 0) {
      errors.push('请至少添加一个技能标签')
    }
  }

  // 图片验证
  if (topic.media?.images) {
    if (topic.media.images.length > 9) {
      errors.push('最多上传9张图片')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 评论验证
export function validateComment(content: string): ValidationResult {
  const errors: string[] = []

  if (!content || typeof content !== 'string') {
    errors.push('评论内容不能为空')
  } else if (content.trim().length < 2) {
    errors.push('评论至少2个字符')
  } else if (content.length > 1000) {
    errors.push('评论最多1000个字符')
  }

  // 检测垃圾内容
  const spamPatterns = [
    /(.)\1{5,}/,  // 重复字符
    /加.*微信/i,  // 广告
    /^[0-9]+$/,   // 纯数字
  ]

  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      errors.push('内容可能包含垃圾信息')
      break
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 用户注册验证
export function validateUserRegistration(user: {
  username: string
  email: string
  password: string
  nickname: string
}): ValidationResult {
  const errors: string[] = []

  // 用户名验证
  if (!user.username || user.username.length < 3) {
    errors.push('用户名至少3个字符')
  } else if (user.username.length > 20) {
    errors.push('用户名最多20个字符')
  } else if (!/^[a-zA-Z0-9_]+$/.test(user.username)) {
    errors.push('用户名只能包含字母、数字和下划线')
  }

  // 邮箱验证
  if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('请输入有效的邮箱地址')
  }

  // 密码验证
  if (!user.password || user.password.length < 6) {
    errors.push('密码至少6位')
  } else if (user.password.length > 32) {
    errors.push('密码最多32位')
  }

  // 昵称验证
  if (!user.nickname || user.nickname.length < 2) {
    errors.push('昵称至少2个字符')
  } else if (user.nickname.length > 20) {
    errors.push('昵称最多20个字符')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 通用必填字段验证
export function validateRequired(value: any, fieldName: string): boolean {
  if (value === null || value === undefined || value === '') {
    return false
  }
  return true
}

// 长度验证
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  const errors: string[] = []

  if (value.length < min) {
    errors.push(`${fieldName}至少${min}个字符`)
  }

  if (value.length > max) {
    errors.push(`${fieldName}最多${max}个字符`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 数字范围验证
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  const errors: string[] = []

  if (value < min) {
    errors.push(`${fieldName}不能小于${min}`)
  }

  if (value > max) {
    errors.push(`${fieldName}不能大于${max}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 数组长度验证
export function validateArrayLength(
  value: any[],
  max: number,
  fieldName: string
): ValidationResult {
  const errors: string[] = []

  if (value.length > max) {
    errors.push(`${fieldName}最多选择${max}项`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 格式验证
export function validateFormat(
  value: string,
  pattern: RegExp,
  fieldName: string,
  message?: string
): ValidationResult {
  const errors: string[] = []

  if (!pattern.test(value)) {
    errors.push(message || `${fieldName}格式不正确`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 综合验证器类
export class Validator {
  private errors: string[] = []

  /**
   * 添加错误
   */
  addError(message: string) {
    this.errors.push(message)
    return this
  }

  /**
   * 验证必填
   */
  required(value: any, fieldName: string) {
    if (value === null || value === undefined || value === '') {
      this.addError(`${fieldName}不能为空`)
    }
    return this
  }

  /**
   * 验证字符串长度
   */
  length(value: string, min: number, max: number, fieldName: string) {
    if (value.length < min) {
      this.addError(`${fieldName}至少${min}个字符`)
    }
    if (value.length > max) {
      this.addError(`${fieldName}最多${max}个字符`)
    }
    return this
  }

  /**
   * 验证数字范围
   */
  range(value: number, min: number, max: number, fieldName: string) {
    if (value < min) {
      this.addError(`${fieldName}不能小于${min}`)
    }
    if (value > max) {
      this.addError(`${fieldName}不能大于${max}`)
    }
    return this
  }

  /**
   * 验证格式
   */
  format(value: string, pattern: RegExp, fieldName: string, message?: string) {
    if (!pattern.test(value)) {
      this.addError(message || `${fieldName}格式不正确`)
    }
    return this
  }

  /**
   * 验证数组长度
   */
  arrayLength(value: any[], max: number, fieldName: string) {
    if (value.length > max) {
      this.addError(`${fieldName}最多选择${max}项`)
    }
    return this
  }

  /**
   * 获取验证结果
   */
  result(): ValidationResult {
    return {
      valid: this.errors.length === 0,
      errors: this.errors
    }
  }
}

// 便捷验证函数
export function validate(fieldName: string) {
  return new Validator()
}

// 验证工具集合
export const ValidationUtils = {
  // 邮箱正则
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // 手机号正则
  PHONE_REGEX: /^1[3-9]\d{9}$/,

  // 用户名正则（字母数字下划线）
  USERNAME_REGEX: /^[a-zA-Z0-9_]+$/,

  // 密码强度检测
  checkPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
    if (password.length < 6) return 'weak'

    const hasNumber = /\d/.test(password)
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (hasNumber && hasLetter && hasSpecial) {
      return 'strong'
    }

    if ((hasNumber && hasLetter) || (hasNumber && hasSpecial) || (hasLetter && hasSpecial)) {
      return 'medium'
    }

    return 'weak'
  },

  // 检测垃圾内容
  isSpamContent(content: string): boolean {
    const spamPatterns = [
      /(.)\1{5,}/,  // 重复字符
      /加.*微信/i,  // 广告
      /^[0-9]+$/,   // 纯数字
      /恭喜.*元/i,  // 中奖广告
      /点击.*链接/i, // 诱导点击
    ]

    return spamPatterns.some(pattern => pattern.test(content))
  },

  // 清理HTML标签
  stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '')
  },

  // 截断文本
  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }
}