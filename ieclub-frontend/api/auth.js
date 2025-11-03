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
 * @param {object} data - 登录数据
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 密码
 * @returns {Promise<{token: string, user: object}>}
 */
export const login = (data) => {
  return request('/auth/login', {
    method: 'POST',
    data
  })
}

/**
 * 验证码登录
 * @param {object} data - 登录数据
 * @param {string} data.email - 邮箱
 * @param {string} data.code - 验证码
 * @returns {Promise<{token: string, user: object}>}
 */
export const loginWithCode = (data) => {
  return request('/auth/login-with-code', {
    method: 'POST',
    data
  })
}

/**
 * 邮箱注册
 * @param {object} data - 注册数据
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 密码
 * @param {string} data.verificationCode - 验证码
 * @returns {Promise<{token: string, user: object}>}
 */
export const register = (data) => {
  return request('/auth/register', {
    method: 'POST',
    data
  })
}

/**
 * 发送验证码
 * @param {string} email - 邮箱
 * @param {string} type - 验证码类型 (register, login, reset_password, bind_email)
 * @returns {Promise}
 */
export const sendVerifyCode = (email, type = 'register') => {
  return request('/auth/send-verify-code', {
    method: 'POST',
    data: { email, type }
  })
}

/**
 * 发送验证码（旧接口，兼容）
 * @param {string} email - 邮箱
 * @param {string} type - 验证码类型
 * @returns {Promise}
 */
export const sendCode = (email, type = 'login') => {
  return request('/auth/send-verify-code', {
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
 * 解绑微信
 * @returns {Promise}
 */
export const unbindWechat = () => {
  return request('/auth/unbind-wechat', {
    method: 'POST'
  })
}

/**
 * 修改密码
 * @param {object} data - { oldPassword, newPassword }
 * @returns {Promise}
 */
export const changePassword = (data) => {
  return request('/auth/change-password', {
    method: 'PUT',
    data
  })
}

/**
 * 忘记密码
 * @param {string} email - 邮箱
 * @returns {Promise}
 */
export const forgotPassword = (email) => {
  return request('/auth/forgot-password', {
    method: 'POST',
    data: { email }
  })
}

/**
 * 重置密码（通过验证码）
 * @param {object} data - { email, code, newPassword }
 * @returns {Promise}
 */
export const resetPasswordByCode = (data) => {
  return request('/auth/reset-password-by-code', {
    method: 'POST',
    data
  })
}

/**
 * 注销账号
 * @param {object} data - { password, reason }
 * @returns {Promise}
 */
export const deleteAccount = (data) => {
  return request('/auth/account', {
    method: 'DELETE',
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

