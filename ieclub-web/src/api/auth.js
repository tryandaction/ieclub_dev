import request from '../utils/request'

/**
 * 发送验证码
 * @param {string} phone - 手机号
 * @returns {Promise}
 */
export const sendCode = (phone) => {
  return request.post('/auth/send-code', { phone })
}

/**
 * 手机号登录
 * @param {string} phone - 手机号
 * @param {string} code - 验证码
 * @returns {Promise<{token: string, user: object}>}
 */
export const login = (phone, code) => {
  return request.post('/auth/login', { phone, code })
}

/**
 * 获取当前用户信息
 * @returns {Promise<object>}
 */
export const getCurrentUser = () => {
  return request.get('/auth/me')
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
 * 登出
 * @returns {Promise}
 */
export const logout = () => {
  return request.post('/auth/logout')
}

