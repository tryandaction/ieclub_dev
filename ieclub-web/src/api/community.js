import request from '../utils/request'

/**
 * 获取用户列表
 * @param {Object} params - 查询参数
 */
export const getUsers = (params) => {
  return request.get('/community/users', { params })
}

/**
 * 搜索用户
 * @param {string} keyword - 搜索关键词
 */
export const searchUsers = (keyword) => {
  return request.get('/community/users/search', { params: { keyword } })
}

/**
 * 获取用户资料
 * @param {number} userId - 用户ID
 */
export const getUserProfile = (userId) => {
  return request.get(`/community/users/${userId}`)
}

/**
 * 关注用户
 * @param {number} userId - 用户ID
 */
export const followUser = (userId) => {
  return request.post(`/community/users/${userId}/follow`)
}

/**
 * 取消关注用户
 * @param {number} userId - 用户ID
 */
export const unfollowUser = (userId) => {
  return request.delete(`/community/users/${userId}/follow`)
}

