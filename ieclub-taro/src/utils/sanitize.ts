// ==================== XSS防护 ====================

/**
 * HTML内容净化配置
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false
}

/**
 * 净化HTML内容
 */
export function sanitizeHtml(html: string): string {
  // 基础净化：移除危险标签和属性
  let cleaned = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/on\w+\s*=/gi, '')  // 移除事件处理器
    .replace(/javascript:/gi, '')  // 移除javascript协议
    .replace(/vbscript:/gi, '')    // 移除vbscript协议
    .replace(/data:(?!image\/(?:png|jpg|jpeg|gif|webp))[^,]/gi, '') // 只允许图片data URI

  // 净化标签属性
  cleaned = cleaned.replace(/<(\w+)([^>]*)>/g, (match, tag, attrs) => {
    // 只保留允许的标签
    if (!SANITIZE_CONFIG.ALLOWED_TAGS.includes(tag.toLowerCase())) {
      return '' // 移除不允许的标签
    }

    // 净化属性
    const purifiedAttrs = attrs.replace(/(\w+)\s*=\s*["']?([^"']*)["']?/g, (attrMatch: string, attrName: string, attrValue: string) => {
      const name = attrName.toLowerCase()

      // 只保留允许的属性
      if (!SANITIZE_CONFIG.ALLOWED_ATTR.includes(name)) {
        return '' // 移除不允许的属性
      }

      // 特殊处理URL属性
      if ((name === 'href' || name === 'src') && attrValue) {
        if (!isValidUrl(attrValue)) {
          return '' // 移除无效或危险的URL
        }
      }

      return `${attrName}="${escapeHtml(attrValue)}"`
    })

    return `<${tag}${purifiedAttrs}>`
  })

  return cleaned
}

/**
 * 转义纯文本
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;',
    '/': '&#x2F;'
  }

  return text.replace(/[&<>"'/]/g, char => map[char])
}

/**
 * 净化URL
 */
export function sanitizeUrl(url: string): string {
  // 移除javascript:等危险协议
  const dangerous = /^(javascript|data|vbscript):/i
  if (dangerous.test(url)) {
    return ''
  }

  // 只允许http、https、mailto
  const allowed = /^(https?|mailto):/i
  if (!allowed.test(url) && !url.startsWith('/') && !url.startsWith('#')) {
    return ''
  }

  return url
}

/**
 * 验证URL安全性
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    // 只允许http和https协议
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }

    // 检查域名（防止内网访问）
    const hostname = parsed.hostname.toLowerCase()
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return false
    }

    // 检查是否为内网IP
    if (isPrivateIP(hostname)) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * 检查是否为内网IP
 */
function isPrivateIP(hostname: string): boolean {
  // 10.0.0.0/8
  if (/^10\./.test(hostname)) return true

  // 172.16.0.0/12
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true

  // 192.168.0.0/16
  if (/^192\.168\./.test(hostname)) return true

  // 169.254.0.0/16 (链路本地地址)
  if (/^169\.254\./.test(hostname)) return true

  return false
}


/**
 * 内容安全检查
 */
export class ContentSecurity {
  /**
   * 检查是否包含敏感词
   */
  static checkSensitiveWords(content: string): {
    hasSensitive: boolean
    sensitiveWords: string[]
  } {
    const sensitiveWords = [
      '广告', '推广', '招商', '加盟', '代理',
      '加微信', '加QQ', '联系方式',
      '恭喜', '中奖', '红包', '返现',
      '点击链接', '复制链接', '扫码关注'
    ]

    const found: string[] = []

    for (const word of sensitiveWords) {
      if (content.includes(word)) {
        found.push(word)
      }
    }

    return {
      hasSensitive: found.length > 0,
      sensitiveWords: found
    }
  }

  /**
   * 检查是否包含恶意代码
   */
  static checkMaliciousCode(content: string): {
    hasMalicious: boolean
    risks: string[]
  } {
    const risks: string[] = []

    // 检查脚本注入
    if (/<script/i.test(content)) {
      risks.push('包含脚本标签')
    }

    // 检查事件处理器
    if (/\bon\w+\s*=/i.test(content)) {
      risks.push('包含事件处理器')
    }

    // 检查javascript协议
    if (/javascript:/i.test(content)) {
      risks.push('包含javascript协议')
    }

    // 检查data URI（除了图片）
    if (/data:(?!image\/(?:png|jpg|jpeg|gif|webp))[^;]/i.test(content)) {
      risks.push('包含可疑的data URI')
    }

    return {
      hasMalicious: risks.length > 0,
      risks
    }
  }

  /**
   * 综合安全检查
   */
  static comprehensiveCheck(content: string): {
    safe: boolean
    issues: Array<{
      type: 'sensitive' | 'malicious' | 'spam'
      message: string
      severity: 'low' | 'medium' | 'high'
    }>
  } {
    const issues: Array<{
      type: 'sensitive' | 'malicious' | 'spam'
      message: string
      severity: 'low' | 'medium' | 'high'
    }> = []

    // 敏感词检查
    const sensitive = this.checkSensitiveWords(content)
    if (sensitive.hasSensitive) {
      issues.push({
        type: 'sensitive',
        message: `包含敏感词: ${sensitive.sensitiveWords.join('、')}`,
        severity: 'medium'
      })
    }

    // 恶意代码检查
    const malicious = this.checkMaliciousCode(content)
    if (malicious.hasMalicious) {
      issues.push({
        type: 'malicious',
        message: `检测到风险: ${malicious.risks.join('、')}`,
        severity: 'high'
      })
    }

    // 垃圾内容检查
    if (this.isSpamContent(content)) {
      issues.push({
        type: 'spam',
        message: '疑似垃圾内容',
        severity: 'medium'
      })
    }

    return {
      safe: issues.length === 0,
      issues
    }
  }

  /**
   * 检查是否为垃圾内容
   */
  private static isSpamContent(content: string): boolean {
    const spamPatterns = [
      /(.)\1{8,}/,  // 过度重复字符
      /^[0-9\s\.,，。！!?？]*$/,  // 纯符号数字
      /(.{2,})\s*\1{3,}/,  // 重复短语
    ]

    return spamPatterns.some(pattern => pattern.test(content))
  }
}

/**
 * 输入验证和净化
 */
export class InputSanitizer {
  /**
   * 净化用户输入
   */
  static sanitizeInput(input: string, type: 'text' | 'html' | 'url' = 'text'): string {
    if (!input) return ''

    let sanitized = input.trim()

    // 基础清理
    sanitized = sanitized
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // 移除控制字符
      .replace(/\s+/g, ' ')  // 统一空白字符

    switch (type) {
      case 'html':
        return sanitizeHtml(sanitized)
      case 'url':
        return sanitizeUrl(sanitized)
      default:
        return escapeHtml(sanitized)
    }
  }

  /**
   * 验证输入长度
   */
  static validateLength(input: string, min: number, max: number): {
    valid: boolean
    message?: string
  } {
    if (input.length < min) {
      return {
        valid: false,
        message: `至少${min}个字符`
      }
    }

    if (input.length > max) {
      return {
        valid: false,
        message: `最多${max}个字符`
      }
    }

    return { valid: true }
  }

  /**
   * 验证输入格式
   */
  static validateFormat(input: string, pattern: RegExp, message?: string): {
    valid: boolean
    message?: string
  } {
    if (!pattern.test(input)) {
      return {
        valid: false,
        message: message || '格式不正确'
      }
    }

    return { valid: true }
  }
}