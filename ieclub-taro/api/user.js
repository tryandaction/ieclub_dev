import request from '../utils/request'

/**
 * 获取用户列表
 * @param {object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @returns {Promise<{list: array, total: number}>}
 */
export const getUsers = (params) => {
  const query = Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join('&')
  return request(`/users?${query}`)
}

/**
 * 获取用户详情
 * @param {number} id - 用户 ID
 * @returns {Promise<object>}
 */
export const getUser = (id) => {
  return request(`/users/${id}`)
}

/**
 * 关注用户
 * @param {number} id - 用户 ID
 * @returns {Promise<{isFollowing: boolean}>}
 */
export const followUser = (id) => {
  return request(`/users/${id}/follow`, {
    method: 'POST'
  })
}

/**
 * 取消关注
 * @param {number} id - 用户 ID
 * @returns {Promise<{isFollowing: boolean}>}
 */
export const unfollowUser = (id) => {
  return request(`/users/${id}/follow`, {
    method: 'DELETE'
  })
}

/**
 * 获取用户的话题列表
 * @param {number} id - 用户 ID
 * @param {object} params - 查询参数
 * @returns {Promise<array>}
 */
export const getUserTopics = (id, params) => {
  const query = params ? '?' + Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join('&') : ''
  return request(`/users/${id}/topics${query}`)
}

