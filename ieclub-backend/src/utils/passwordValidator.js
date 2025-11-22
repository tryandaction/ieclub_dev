/**
 * 密码强度校验工具
 * 规则：
 * - 长度：8-20位
 * - 复杂度：必须包含字母和数字
 * - 禁止常见弱密码
 */

// 常见弱密码列表
const WEAK_PASSWORDS = [
  '12345678',
  '123456789',
  '11111111',
  '00000000',
  'password',
  'password123',
  'qwerty123',
  'abc12345',
  '12345abc',
  'admin123',
  'sustech123', // 学校相关
];

/**
 * 验证密码强度
 * @param {string} password - 待验证的密码
 * @returns {{valid: boolean, message: string, strength: string}}
 */
function validatePassword(password) {
  // 1. 检查是否为空
  if (!password) {
    return {
      valid: false,
      message: '密码不能为空',
      strength: 'none'
    };
  }

  // 2. 检查长度（8-20位）
  if (password.length < 8) {
    return {
      valid: false,
      message: '密码长度不能少于8个字符',
      strength: 'weak'
    };
  }

  if (password.length > 20) {
    return {
      valid: false,
      message: '密码长度不能超过20个字符',
      strength: 'none'
    };
  }

  // 3. 检查是否包含字母
  const hasLetter = /[a-zA-Z]/.test(password);
  if (!hasLetter) {
    return {
      valid: false,
      message: '密码必须包含字母',
      strength: 'weak'
    };
  }

  // 4. 检查是否包含数字
  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    return {
      valid: false,
      message: '密码必须包含数字',
      strength: 'weak'
    };
  }

  // 5. 检查是否为常见弱密码
  const lowerPassword = password.toLowerCase();
  if (WEAK_PASSWORDS.includes(lowerPassword)) {
    return {
      valid: false,
      message: '密码过于简单，请使用更复杂的密码',
      strength: 'weak'
    };
  }

  // 6. 检查是否为纯数字或纯字母
  if (/^\d+$/.test(password) || /^[a-zA-Z]+$/.test(password)) {
    return {
      valid: false,
      message: '密码不能为纯数字或纯字母',
      strength: 'weak'
    };
  }

  // 7. 计算密码强度
  let strength = 'medium';
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  // 强密码：包含大小写字母、数字和特殊字符，且长度 >= 12
  if (hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && password.length >= 12) {
    strength = 'strong';
  } 
  // 中等密码：包含大小写字母和数字，或包含特殊字符
  else if ((hasUpperCase && hasLowerCase && hasNumber) || hasSpecialChar) {
    strength = 'medium';
  }

  return {
    valid: true,
    message: '密码强度符合要求',
    strength
  };
}

/**
 * 获取密码强度描述
 * @param {string} strength - 强度等级 (weak/medium/strong)
 * @returns {string} 强度描述
 */
function getStrengthDescription(strength) {
  const descriptions = {
    none: '无',
    weak: '弱',
    medium: '中等',
    strong: '强'
  };
  return descriptions[strength] || '未知';
}

/**
 * 验证两个密码是否匹配
 * @param {string} password - 密码
 * @param {string} confirmPassword - 确认密码
 * @returns {{valid: boolean, message: string}}
 */
function validatePasswordMatch(password, confirmPassword) {
  if (!confirmPassword) {
    return {
      valid: false,
      message: '请确认密码'
    };
  }

  if (password !== confirmPassword) {
    return {
      valid: false,
      message: '两次输入的密码不一致'
    };
  }

  return {
    valid: true,
    message: '密码确认成功'
  };
}

module.exports = {
  validatePassword,
  getStrengthDescription,
  validatePasswordMatch
};
