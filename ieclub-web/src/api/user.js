import request from '../utils/request'

/**
 * 获取当前用户信息
 * @returns {Promise<object>}
 */
export const getUserProfile = () => {
  return request.get('/user/profile')
}

/**
 * 获取用户列表
 * @param {object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @returns {Promise<{list: array, total: number}>}
 */
export const getUsers = (params) => {
  return request.get('/users', { params })
}

/**
 * 获取用户详情
 * @param {number} id - 用户 ID
 * @returns {Promise<object>}
 */
export const getUser = (id) => {
  return request.get(`/users/${id}`)
}

/**
 * 关注用户
 * @param {number} id - 用户 ID
 * @returns {Promise<{isFollowing: boolean}>}
 */
export const followUser = (id) => {
  return request.post(`/users/${id}/follow`)
}

/**
 * 取消关注
 * @param {number} id - 用户 ID
 * @returns {Promise<{isFollowing: boolean}>}
 */
export const unfollowUser = (id) => {
  return request.delete(`/users/${id}/follow`)
}

/**
 * 获取用户的话题列表
 * @param {number} id - 用户 ID
 * @param {object} params - 查询参数
 * @returns {Promise<array>}
 */
export const getUserTopics = (id, params) => {
  return request.get(`/users/${id}/topics`, { params })
}

