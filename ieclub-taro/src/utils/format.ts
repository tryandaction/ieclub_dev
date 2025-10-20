// ==================== 格式化工具函数（增强版） ====================

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 格式化时间为相对时间（集成开发代码的设计）
 */
export function formatRelativeTime(date: string | Date): string {
  const now = dayjs()
  const target = dayjs(date)
  const diff = now.diff(target, 'minute')

  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`

  const hourDiff = now.diff(target, 'hour')
  if (hourDiff < 24) return `${hourDiff}小时前`

  const dayDiff = now.diff(target, 'day')
  if (dayDiff === 1) return '昨天'
  if (dayDiff === 2) return '前天'
  if (dayDiff < 7) return `${dayDiff}天前`

  return target.format('MM月DD日')
}

/**
 * 格式化时间为相对时间（来自开发代码的详细版本）
 * @param dateString ISO 时间字符串
 * @returns 格式化后的时间字符串
 */
export function formatTimeDetailed(dateString: string | Date): string {
  const date = dayjs(dateString)
  const now = dayjs()
  const diff = now.diff(date, 'second')

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days === 2) {
    return '前天'
  } else if (days < 30) {
    return `${days}天前`
  } else if (months < 12) {
    return `${months}个月前`
  } else {
    return `${years}年前`
  }
}

/**
 * 格式化时间为完整日期（来自开发代码）
 * @param dateString ISO 时间字符串
 * @returns YYYY-MM-DD HH:mm
 */
export function formatFullTime(dateString: string | Date): string {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm')
}

/**
 * 格式化时间为日期（来自开发代码）
 * @param dateString ISO 时间字符串
 * @returns YYYY-MM-DD
 */
export function formatDateOnly(dateString: string | Date): string {
  return dayjs(dateString).format('YYYY-MM-DD')
}

/**
 * 格式化完整日期时间
 */
export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD')
}

/**
 * 格式化时间
 */
export function formatTime(date: string | Date): string {
  return dayjs(date).format('HH:mm')
}

/**
 * 格式化数字（千分位）
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * 截断文本
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}