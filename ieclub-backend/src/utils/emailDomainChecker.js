/**
 * 邮箱域名检查器
 * 统一管理允许的邮箱域名白名单
 * 
 * 环境行为：
 * - production: 只允许学校邮箱注册（sustech.edu.cn, mail.sustech.edu.cn）
 * - staging: 
 *   - 白名单开启(USE_EMAIL_WHITELIST=true): 只允许白名单内邮箱注册（可以是非学校邮箱）
 *   - 白名单关闭(USE_EMAIL_WHITELIST=false): 只允许学校邮箱注册（同生产环境）
 * - development: 不限制（允许所有邮箱）
 */

const config = require('../config');
const prisma = require('../config/database');
const logger = require('./logger');

// 学校邮箱域名列表（测试环境可直接注册，无需白名单）
const SCHOOL_EMAIL_DOMAINS = ['sustech.edu.cn', 'mail.sustech.edu.cn'];

/**
 * 获取允许的邮箱域名列表
 * @returns {string[] | null} 允许的域名数组，null表示不限制
 */
function getAllowedDomains() {
  const env = process.env.NODE_ENV || 'development';
  
  // 生产环境：只允许学校邮箱
  if (env === 'production') {
    return SCHOOL_EMAIL_DOMAINS;
  }
  
  // 测试环境：从环境变量读取，如果没有则返回学校邮箱
  if (env === 'staging') {
    const domainsEnv = process.env.ALLOWED_EMAIL_DOMAINS || config.email?.allowedDomains;
    if (domainsEnv && domainsEnv.trim() !== '') {
      const domains = domainsEnv
        .split(',')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);
      return domains.length > 0 ? domains : SCHOOL_EMAIL_DOMAINS;
    }
    return SCHOOL_EMAIL_DOMAINS;
  }
  
  // 开发环境：从环境变量读取，如果没有则不限制
  const domainsEnv = process.env.ALLOWED_EMAIL_DOMAINS || config.email?.allowedDomains;
  if (!domainsEnv || domainsEnv.trim() === '') {
    return null; // 开发环境不限制
  }
  
  // 分割、清理并过滤空字符串
  const domains = domainsEnv
    .split(',')
    .map(domain => domain.trim())
    .filter(domain => domain.length > 0);
  
  return domains.length > 0 ? domains : null;
}

/**
 * 检查邮箱是否在测试环境白名单中
 * @param {string} email - 要检查的邮箱地址
 * @returns {Promise<boolean>} 是否在白名单中
 */
async function isEmailInWhitelist(email) {
  try {
    const env = process.env.NODE_ENV || 'development';
    if (env !== 'staging') {
      return false; // 只有测试环境需要检查白名单
    }
    
    const whitelistEntry = await prisma.emailWhitelist.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    return whitelistEntry !== null && whitelistEntry.status === 'approved';
  } catch (error) {
    logger.error('检查邮箱白名单失败:', { email, error: error.message });
    return false; // 出错时返回false，拒绝访问
  }
}

/**
 * 检查邮箱是否在允许的域名列表中
 * @param {string} email - 要检查的邮箱地址
 * @param {string} type - 操作类型 (register, login, reset等)
 * @returns {Promise<Object>} 检查结果 { valid: boolean, message: string, needApproval?: boolean }
 */
async function checkEmailAllowed(email, type = 'register') {
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
    
    const env = process.env.NODE_ENV || 'development';
    
    // 生产环境：只允许学校邮箱
    if (env === 'production') {
      const isSchoolEmail = SCHOOL_EMAIL_DOMAINS.some(domain => 
        emailDomain.toLowerCase() === domain.toLowerCase()
      );
      
      if (isSchoolEmail) {
        return {
          valid: true,
          message: '邮箱验证通过'
        };
      }
      
      // 不是学校邮箱，返回错误
      const domainList = SCHOOL_EMAIL_DOMAINS.join(', ');
      let message;
      
      switch (type) {
        case 'register':
          message = `注册仅限使用学校邮箱：${domainList}`;
          break;
        case 'login':
          message = `登录仅限使用学校邮箱：${domainList}`;
          break;
        case 'reset':
          message = `密码重置仅限使用学校邮箱：${domainList}`;
          break;
        default:
          message = `该邮箱不在允许的域名列表中，仅限使用学校邮箱：${domainList}`;
      }
      
      return {
        valid: false,
        message
      };
    }
    
    // 测试环境：根据白名单开关决定策略
    if (env === 'staging') {
      const useWhitelist = process.env.USE_EMAIL_WHITELIST === 'true';
      
      if (useWhitelist) {
        // 白名单模式：只检查白名单
        const inWhitelist = await isEmailInWhitelist(email);
        
        if (inWhitelist) {
          return {
            valid: true,
            message: '邮箱验证通过（白名单）'
          };
        }
        
        return {
          valid: false,
          message: '该邮箱不在测试环境白名单中，请联系管理员'
        };
      } else {
        // 学校邮箱模式：只允许学校邮箱
        const isSchoolEmail = SCHOOL_EMAIL_DOMAINS.some(domain => 
          emailDomain.toLowerCase() === domain.toLowerCase()
        );
        
        if (isSchoolEmail) {
          return {
            valid: true,
            message: '邮箱验证通过'
          };
        }
        
        const domainList = SCHOOL_EMAIL_DOMAINS.join(', ');
        return {
          valid: false,
          message: `测试环境仅限学校邮箱注册：${domainList}`
        };
      }
    }
    
    // 开发环境：不限制
    const allowedDomains = getAllowedDomains();
    if (allowedDomains === null) {
      return {
        valid: true,
        message: '邮箱验证通过'
      };
    }
    
    // 检查邮箱域名是否在允许列表中
    const isAllowed = allowedDomains.some(domain => 
      emailDomain.toLowerCase() === domain.toLowerCase()
    );
    
    if (!isAllowed) {
      const domainList = allowedDomains.join(', ');
      let message;
      
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
    logger.error('邮箱验证失败:', { email, type, error: error.message });
    
    return {
      valid: false,
      message: '邮箱验证失败，请稍后重试'
    };
  }
}

module.exports = {
  getAllowedDomains,
  checkEmailAllowed,
  isEmailInWhitelist,
  SCHOOL_EMAIL_DOMAINS
};

