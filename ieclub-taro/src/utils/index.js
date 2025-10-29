/**
 * IEClub 工具函数
 * 包含格式化、验证、辅助函数等
 */

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 配置dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 格式化时间
 * @param {string|Date} time - 时间
 * @param {string} format - 格式
 * @returns {string}
 */
export const formatTime = (time, format = 'YYYY-MM-DD HH:mm') => {
  return dayjs(time).format(format)
}

/**
 * 相对时间
 * @param {string|Date} time - 时间
 * @returns {string}
 */
export const formatRelativeTime = (time) => {
  return dayjs(time).fromNow()
}

/**
 * 格式化数字
 * @param {number} num - 数字
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

/**
 * 截断文本
 * @param {string} text - 文本
 * @param {number} length - 长度
 * @returns {string}
 */
export const truncateText = (text, length = 100) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * 防抖函数
 * @param {Function} func - 函数
 * @param {number} delay - 延迟
 * @returns {Function}
 */
export const debounce = (func, delay = 300) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

/**
 * 节流函数
 * @param {Function} func - 函数
 * @param {number} delay - 延迟
 * @returns {Function}
 */
export const throttle = (func, delay = 300) => {
  let lastCall = 0
  return (...args) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func.apply(null, args)
    }
  }
}

/**
 * 深拷贝
 * @param {any} obj - 对象
 * @returns {any}
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * 生成随机ID
 * @param {number} length - 长度
 * @returns {string}
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 验证邮箱
 * @param {string} email - 邮箱
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * 验证手机号
 * @param {string} phone - 手机号
 * @returns {boolean}
 */
export const validatePhone = (phone) => {
  const re = /^1[3-9]\d{9}$/
  return re.test(phone)
}

/**
 * 获取用户等级
 * @param {number} score - 积分
 * @returns {object}
 */
export const getUserLevel = (score) => {
  const levels = [
    { min: 0, max: 100, name: '新手', color: '#6b7280', level: 1 },
    { min: 101, max: 500, name: '进阶', color: '#3b82f6', level: 2 },
    { min: 501, max: 1000, name: '高级', color: '#8b5cf6', level: 3 },
    { min: 1001, max: 2000, name: '专家', color: '#f59e0b', level: 4 },
    { min: 2001, max: Infinity, name: '大师', color: '#ef4444', level: 5 },
  ]
  
  return levels.find(level => score >= level.min && score <= level.max) || levels[0]
}

/**
 * 计算匹配度
 * @param {object} user1 - 用户1
 * @param {object} user2 - 用户2
 * @returns {number}
 */
export const calculateMatchScore = (user1, user2) => {
  let score = 0
  
  // 技能匹配 (40%)
  const commonSkills = user1.skills?.filter(skill => 
    user2.skills?.includes(skill)
  ).length || 0
  score += (commonSkills / Math.max(user1.skills?.length || 1, user2.skills?.length || 1)) * 40
  
  // 兴趣匹配 (25%)
  const commonInterests = user1.interests?.filter(interest => 
    user2.interests?.includes(interest)
  ).length || 0
  score += (commonInterests / Math.max(user1.interests?.length || 1, user2.interests?.length || 1)) * 25
  
  // 等级接近 (20%)
  const levelDiff = Math.abs((user1.level || 1) - (user2.level || 1))
  score += Math.max(0, (5 - levelDiff) / 5) * 20
  
  // 活跃度匹配 (15%)
  const activityScore = Math.min(user1.activityScore || 0, user2.activityScore || 0) / 100
  score += activityScore * 15
  
  return Math.round(score)
}

/**
 * 存储工具
 */
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Storage set error:', error)
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  },
  
  clear: () => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Storage clear error:', error)
    }
  }
}
