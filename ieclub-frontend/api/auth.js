import request from '../utils/request'

/**
 * 微信登录
 * @param {object} data - 登录数据
 * @param {string} data.code - 微信临时登录凭证
 * @param {string} data.nickName - 用户昵称
 * @param {string} data.avatarUrl - 用户头像
 * @param {number} data.gender - 用户性别
 * @returns {Promise<{token: string, user: object}>}
 */
export const wechatLogin = (data) => {
  return request('/auth/wechat-login', {
    method: 'POST',
    data
  })
}

/**
 * 邮箱密码登录
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise<{token: string, user: object}>}
 */
export const emailLogin = (email, password) => {
  return request('/auth/login', {
    method: 'POST',
    data: { email, password }
  })
}

/**
 * 发送验证码
 * @param {string} email - 邮箱
 * @param {string} type - 验证码类型 (register, login, reset_password, bind_email)
 * @returns {Promise}
 */
export const sendCode = (email, type = 'login') => {
  return request('/auth/send-code', {
    method: 'POST',
    data: { email, type }
  })
}

/**
 * 绑定邮箱
 * @param {string} email - 邮箱
 * @param {string} code - 验证码
 * @returns {Promise}
 */
export const bindEmail = (email, code) => {
  return request('/auth/bind-email', {
    method: 'POST',
    data: { email, code }
  })
}

/**
 * 绑定微信
 * @param {object} data - 微信信息 { openid, unionid, nickname, avatar }
 * @returns {Promise}
 */
export const bindWechat = (data) => {
  return request('/auth/bind-wechat', {
    method: 'POST',
    data
  })
}

/**
 * 获取当前用户信息
 * @returns {Promise<object>}
 */
export const getCurrentUser = () => {
  return request('/auth/profile')
}

/**
 * 更新用户信息
 * @param {object} data - 用户信息
 * @returns {Promise<object>}
 */
export const updateProfile = (data) => {
  return request('/auth/profile', {
    method: 'PUT',
    data
  })
}

/**
 * 登出
 * @returns {Promise}
 */
export const logout = () => {
  return request('/auth/logout', {
    method: 'POST'
  })
}

