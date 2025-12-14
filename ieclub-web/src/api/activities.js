import request from '../utils/request'

/**
 * 获取活动列表
 */
export const getActivities = (params) => {
  return request.get('/activities', { params })
}

/**
 * 获取活动详情
 */
export const getActivityDetail = (id) => {
  return request.get(`/activities/${id}`)
}

/**
 * 创建活动
 */
export const createActivity = (data) => {
  return request.post('/activities', data)
}

/**
 * 更新活动
 */
export const updateActivity = (id, data) => {
  return request.put(`/activities/${id}`, data)
}

/**
 * 删除活动
 */
export const deleteActivity = (id) => {
  return request.delete(`/activities/${id}`)
}

/**
 * 报名参加活动
 */
export const joinActivity = (id) => {
  return request.post(`/activities/${id}/join`)
}

/**
 * 取消报名
 */
export const leaveActivity = (id) => {
  return request.post(`/activities/${id}/leave`)
}

/**
 * 点赞/取消点赞活动
 */
export const toggleLike = (id) => {
  return request.post(`/activities/${id}/like`)
}

/**
 * 活动签到
 */
export const checkIn = (id, token = null) => {
  return request.post(`/activities/${id}/checkin`, { token })
}

/**
 * 生成签到二维码（组织者）
 */
export const generateCheckInQRCode = (id) => {
  return request.post(`/activities/${id}/qrcode`)
}

/**
 * 验证签到令牌
 */
export const verifyCheckInToken = (id, token) => {
  return request.post(`/activities/${id}/verify-token`, { token })
}

/**
 * 获取签到统计（组织者）
 */
export const getCheckInStats = (id) => {
  return request.get(`/activities/${id}/checkin-stats`)
}

/**
 * 获取我的活动
 */
export const getMyActivities = (params) => {
  return request.get('/activities/me/activities', { params })
}
