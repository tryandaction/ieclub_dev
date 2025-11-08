/**
 * 邮箱域名检查器
 * 统一管理允许的邮箱域名白名单
 */

const config = require('../config');

/**
 * 获取允许的邮箱域名列表
 * @returns {string[] | null} 允许的域名数组，null表示不限制
 */
function getAllowedDomains() {
  // 从环境变量读取允许的域名列表
  const domainsEnv = process.env.ALLOWED_EMAIL_DOMAINS || config.email?.allowedDomains;
  
  // 如果未设置或为空字符串，返回 null 表示不限制
  if (!domainsEnv || domainsEnv.trim() === '') {
    return null;
  }
  
  // 分割、清理并过滤空字符串
  const domains = domainsEnv
    .split(',')
    .map(domain => domain.trim())
    .filter(domain => domain.length > 0);
  
  // 如果解析后为空数组，返回 null 表示不限制
  return domains.length > 0 ? domains : null;
}

/**
 * 检查邮箱是否在允许的域名列表中
 * @param {string} email - 要检查的邮箱地址
 * @param {string} type - 操作类型 (register, login, reset等)
 * @returns {Object} 检查结果 { valid: boolean, message: string }
 */
function checkEmailAllowed(email, type = 'register') {
  try {
    if (!email) {
      return {
        valid: false,
        message: '邮箱地址不能为空'
      };
    }
    
    // 基本的邮箱格式验证
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        message: '请输入有效的邮箱地址'
      };
    }
    
    // 提取域名部分
    const emailParts = email.split('@');
    if (emailParts.length !== 2) {
      return {
        valid: false,
        message: '邮箱格式不正确'
      };
    }
    
    const emailDomain = emailParts[1];
    if (!emailDomain) {
      return {
        valid: false,
        message: '邮箱域名不能为空'
      };
    }
    
    // 获取允许的域名列表
    const allowedDomains = getAllowedDomains();
    
    // 如果 allowedDomains 为 null，表示不限制邮箱域名
    if (allowedDomains === null) {
      return {
        valid: true,
        message: '邮箱验证通过'
      };
    }
    
    // 检查邮箱域名是否在白名单中
    const isAllowed = allowedDomains.some(domain => 
      emailDomain.toLowerCase() === domain.toLowerCase()
    );
    
    if (!isAllowed) {
      // 根据操作类型生成不同的错误消息
      let message;
      const domainList = allowedDomains.join(', ');
      
      switch (type) {
        case 'register':
          message = `注册仅限使用以下邮箱：${domainList}`;
          break;
        case 'login':
          message = `登录仅限使用以下邮箱：${domainList}`;
          break;
        case 'reset':
          message = `密码重置仅限使用以下邮箱：${domainList}`;
          break;
        default:
          message = `该邮箱不在允许的域名列表中`;
      }
      
      return {
        valid: false,
        message
      };
    }
    
    return {
      valid: true,
      message: '邮箱验证通过'
    };
  } catch (error) {
    // 捕获任何异常，返回友好的错误信息
    const logger = require('../utils/logger');
    logger.error('邮箱验证失败:', { email, type, error: error.message });
    
    return {
      valid: false,
      message: '邮箱验证失败，请稍后重试'
    };
  }
}

module.exports = {
  getAllowedDomains,
  checkEmailAllowed
};

