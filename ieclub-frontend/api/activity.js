import request from '../utils/request'

/**
 * 获取活动列表
 * @param {object} params - 查询参数
 * @param {string} params.status - 活动状态 upcoming|ongoing|ended
 * @param {string} params.category - 活动分类
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @returns {Promise<{list: array, total: number, page: number, pageSize: number}>}
 */
export const getActivities = (params = {}) => {
  const query = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== '')
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&')
  return request(`/activities${query ? '?' + query : ''}`)
}

/**
 * 获取活动详情
 * @param {number} id - 活动 ID
 * @returns {Promise<object>}
 */
export const getActivityDetail = (id) => {
  return request(`/activities/${id}`)
}

/**
 * 创建活动
 * @param {object} data - 活动数据
 * @param {string} data.title - 活动标题
 * @param {string} data.description - 活动描述
 * @param {string} data.cover - 封面图片
 * @param {string} data.location - 活动地点
 * @param {string} data.startTime - 开始时间
 * @param {string} data.endTime - 结束时间
 * @param {number} data.maxParticipants - 最大参与人数
 * @param {string} data.category - 活动分类
 * @returns {Promise<object>}
 */
export const createActivity = (data) => {
  return request('/activities', {
    method: 'POST',
    data
  })
}

/**
 * 更新活动
 * @param {number} id - 活动 ID
 * @param {object} data - 活动数据
 * @returns {Promise<object>}
 */
export const updateActivity = (id, data) => {
  return request(`/activities/${id}`, {
    method: 'PUT',
    data
  })
}

/**
 * 删除活动
 * @param {number} id - 活动 ID
 * @returns {Promise}
 */
export const deleteActivity = (id) => {
  return request(`/activities/${id}`, {
    method: 'DELETE'
  })
}

/**
 * 报名参加活动
 * @param {number} id - 活动 ID
 * @returns {Promise<{isParticipating: boolean, participantCount: number}>}
 */
export const participateActivity = (id) => {
  return request(`/activities/${id}/participate`, {
    method: 'POST'
  })
}

/**
 * 取消报名
 * @param {number} id - 活动 ID
 * @returns {Promise<{isParticipating: boolean, participantCount: number}>}
 */
export const cancelParticipation = (id) => {
  return request(`/activities/${id}/participate`, {
    method: 'DELETE'
  })
}

/**
 * 切换报名状态（报名/取消报名）
 * @param {number} id - 活动 ID
 * @returns {Promise<{isParticipating: boolean, participantCount: number}>}
 */
export const toggleParticipation = (id) => {
  return request(`/activities/${id}/participate`, {
    method: 'POST'
  })
}

/**
 * 活动签到
 * @param {number} id - 活动 ID
 * @param {string} token - 签到令牌（扫码获取）
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const checkIn = (id, token = null) => {
  return request(`/activities/${id}/checkin`, {
    method: 'POST',
    data: { token }
  })
}

/**
 * 生成签到二维码（组织者）
 * @param {number} id - 活动 ID
 * @param {number} expiresIn - 二维码有效期（秒），默认 300 秒
 * @returns {Promise<{qrCode: string, token: string, expiresAt: string}>}
 */
export const generateCheckInQRCode = (id, expiresIn = 300) => {
  return request(`/activities/${id}/checkin/qrcode`, {
    method: 'POST',
    data: { expiresIn }
  })
}

/**
 * 获取签到统计（组织者）
 * @param {number} id - 活动 ID
 * @returns {Promise<{total: number, checkedIn: number, notCheckedIn: number, participants: array}>}
 */
export const getCheckInStats = (id) => {
  return request(`/activities/${id}/checkin/stats`)
}

/**
 * 点赞活动
 * @param {number} id - 活动 ID
 * @returns {Promise<{isLiked: boolean, likeCount: number}>}
 */
export const likeActivity = (id) => {
  return request(`/activities/${id}/like`, {
    method: 'POST'
  })
}

/**
 * 取消点赞
 * @param {number} id - 活动 ID
 * @returns {Promise<{isLiked: boolean, likeCount: number}>}
 */
export const unlikeActivity = (id) => {
  return request(`/activities/${id}/like`, {
    method: 'DELETE'
  })
}

/**
 * 切换点赞状态
 * @param {number} id - 活动 ID
 * @returns {Promise<{isLiked: boolean, likeCount: number}>}
 */
export const toggleLike = (id) => {
  return request(`/activities/${id}/like`, {
    method: 'POST'
  })
}

/**
 * 获取我参加的活动列表
 * @param {object} params - 查询参数
 * @returns {Promise<array>}
 */
export const getMyActivities = (params = {}) => {
  const query = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== '')
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&')
  return request(`/activities/my${query ? '?' + query : ''}`)
}

/**
 * 获取我组织的活动列表
 * @param {object} params - 查询参数
 * @returns {Promise<array>}
 */
export const getMyOrganizedActivities = (params = {}) => {
  const query = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== '')
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&')
  return request(`/activities/organized${query ? '?' + query : ''}`)
}

