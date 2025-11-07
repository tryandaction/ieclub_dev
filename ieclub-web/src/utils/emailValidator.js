/**
 * 邮箱验证工具
 * 与后端邮箱域名白名单保持一致
 */

// 从环境变量读取允许的邮箱域名（与后端一致）
const ALLOWED_EMAIL_DOMAINS = import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS || 
  'sustech.edu.cn,mail.sustech.edu.cn';

// 解析允许的域名列表
const allowedDomains = ALLOWED_EMAIL_DOMAINS
  .split(',')
  .map(domain => domain.trim())
  .filter(Boolean);

/**
 * 验证邮箱格式和域名
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // 基本邮箱格式验证
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // 提取域名部分
  const domain = email.split('@')[1];
  if (!domain) {
    return false;
  }

  // 检查域名是否在白名单中
  return allowedDomains.includes(domain.toLowerCase());
}

/**
 * 获取允许的邮箱域名列表
 * @returns {string[]} 域名列表
 */
export function getAllowedDomains() {
  return [...allowedDomains];
}

/**
 * 获取邮箱验证错误提示
 * @returns {string} 错误提示文本
 */
export function getEmailErrorMessage() {
  const domainList = allowedDomains.join(', ');
  return `请使用以下邮箱注册：${domainList}`;
}

/**
 * 获取邮箱占位符文本
 * @returns {string} 占位符文本
 */
export function getEmailPlaceholder() {
  const firstDomain = allowedDomains[0] || 'sustech.edu.cn';
  return `your-email@${firstDomain}`;
}

