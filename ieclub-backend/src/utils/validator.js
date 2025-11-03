// 验证工具函数（补充完整实现）

const xss = require('xss');

class Validator {
  /**
   * 验证邮箱格式
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式（中国大陆）
   */
  static isValidPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 清理用户输入，防止XSS攻击
   */
  static sanitizeInput(input) {
    if (!input) return '';

    return xss(input, {
      whiteList: {
        p: [],
        br: [],
        strong: [],
        em: [],
        u: [],
        h1: [], h2: [], h3: [], h4: [],
        ul: [], ol: [], li: [],
        a: ['href', 'title', 'target'],
        img: ['src', 'alt', 'title'],
        code: ['class'],
        pre: ['class'],
        blockquote: [],
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style'],
    });
  }

  /**
   * 验证UUID格式
   */
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * 验证密码强度
   */
  static isStrongPassword(password) {
    // 至少8位，包含字母和数字
    const strongRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  }

  /**
   * 验证URL格式
   */
  static isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = Validator;