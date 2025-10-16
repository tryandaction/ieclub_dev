// ==================== 格式化工具函数（增强版） ====================

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 格式化时间为相对时间
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
  if (dayDiff < 7) return `${dayDiff}天前`

  return target.format('MM月DD日')
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