import request from '../utils/request'

/**
 * 获取活动列表
 * @param {Object} params - 查询参数
 */
export const getActivities = (params) => {
  return request.get('/activities', { params })
}

/**
 * 获取活动详情
 * @param {number} id - 活动ID
 */
export const getActivityDetail = (id) => {
  return request.get(`/activities/${id}`)
}

/**
 * 创建活动
 * @param {Object} data - 活动数据
 */
export const createActivity = (data) => {
  return request.post('/activities', data)
}

/**
 * 更新活动
 * @param {number} id - 活动ID
 * @param {Object} data - 更新的数据
 */
export const updateActivity = (id, data) => {
  return request.put(`/activities/${id}`, data)
}

/**
 * 删除活动
 * @param {number} id - 活动ID
 */
export const deleteActivity = (id) => {
  return request.delete(`/activities/${id}`)
}

/**
 * 点赞/取消点赞活动
 * @param {number} id - 活动ID
 */
export const toggleLike = (id) => {
  return request.post(`/activities/${id}/like`)
}

/**
 * 报名/取消报名活动
 * @param {number} id - 活动ID
 */
export const toggleParticipation = (id) => {
  return request.post(`/activities/${id}/participate`)
}

/**
 * 获取活动分类
 */
export const getCategories = () => {
  return request.get('/activities/categories')
}

