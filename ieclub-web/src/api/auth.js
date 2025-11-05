import request from '../utils/request'

/**
 * 发送验证码
 * @param {string} email - 邮箱
 * @param {string} type - 验证码类型 (register, login, reset_password)
 * @returns {Promise}
 */
export const sendCode = (email, type = 'login') => {
  return request.post('/auth/send-verify-code', { email, type })
}

/**
 * 验证验证码
 * @param {string} email - 邮箱
 * @param {string} code - 验证码
 * @returns {Promise}
 */
export const verifyCode = (email, code) => {
  return request.post('/auth/verify-code', { email, code })
}

/**
 * 用户注册
 * @param {object} data - 注册信息 { email, password, verifyCode, nickname, grade, major }
 * @returns {Promise<{token: string, user: object}>}
 */
export const register = (data) => {
  return request.post('/auth/register', data)
}

/**
 * 用户登录
 * @param {string} email - 邮箱
 * @param {string} passwordOrCode - 密码或验证码
 * @param {string} loginType - 登录类型 (password 或 code)
 * @returns {Promise<{token: string, user: object}>}
 */
export const login = (email, passwordOrCode, loginType = 'password') => {
  if (loginType === 'code') {
    return request.post('/auth/login-with-code', { email, code: passwordOrCode })
  }
  return request.post('/auth/login', { email, password: passwordOrCode })
}

/**
 * 忘记密码
 * @param {string} email - 邮箱
 * @returns {Promise}
 */
export const forgotPassword = (email) => {
  return request.post('/auth/forgot-password', { email })
}

/**
 * 重置密码
 * @param {string} email - 邮箱
 * @param {string} code - 验证码
 * @param {string} newPassword - 新密码
 * @returns {Promise}
 */
export const resetPassword = (email, code, newPassword) => {
  return request.post('/auth/reset-password', { email, code, newPassword })
}

/**
 * 修改密码
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 * @returns {Promise}
 */
export const changePassword = (oldPassword, newPassword) => {
  return request.post('/auth/change-password', { oldPassword, newPassword })
}

/**
 * 获取当前用户信息
 * @returns {Promise<object>}
 */
export const getCurrentUser = () => {
  return request.get('/auth/profile')
}

/**
 * 更新用户信息
 * @param {object} data - 用户信息
 * @returns {Promise<object>}
 */
export const updateProfile = (data) => {
  return request.put('/auth/profile', data)
}

/**
 * 绑定微信
 * @param {object} data - 微信信息 { openid, unionid, nickname, avatar }
 * @returns {Promise}
 */
export const bindWechat = (data) => {
  return request.post('/auth/bind-wechat', data)
}

/**
 * 发送手机验证码
 * @param {string} phone - 手机号
 * @param {string} type - 验证码类型 (bind, login)
 * @returns {Promise}
 */
export const sendPhoneCode = (phone, type = 'bind') => {
  return request.post('/auth/send-phone-code', { phone, type })
}

/**
 * 绑定手机号
 * @param {string} phone - 手机号
 * @param {string} code - 验证码
 * @returns {Promise}
 */
export const bindPhone = (phone, code) => {
  return request.post('/auth/bind-phone', { phone, code })
}

/**
 * 手机号登录
 * @param {string} phone - 手机号
 * @param {string} code - 验证码
 * @returns {Promise<{token: string, user: object}>}
 */
export const loginWithPhone = (phone, code) => {
  return request.post('/auth/login-with-phone', { phone, code })
}

/**
 * 解绑手机号
 * @returns {Promise}
 */
export const unbindPhone = () => {
  return request.post('/auth/unbind-phone')
}

/**
 * 解绑微信
 * @returns {Promise}
 */
export const unbindWechat = () => {
  return request.post('/auth/unbind-wechat')
}

/**
 * 注销账号
 * @param {string} password - 密码确认
 * @param {string} reason - 注销原因（可选）
 * @returns {Promise}
 */
export const deleteAccount = (password, reason) => {
  return request.delete('/auth/account', { data: { password, reason } })
}

/**
 * 登出
 * @returns {Promise}
 */
export const logout = () => {
  return request.post('/auth/logout')
}

