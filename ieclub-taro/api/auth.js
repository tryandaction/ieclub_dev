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
 * 获取当前用户信息
 * @returns {Promise<object>}
 */
export const getCurrentUser = () => {
  return request('/auth/me')
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

