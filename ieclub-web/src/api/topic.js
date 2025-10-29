import request from '../utils/request'

/**
 * 获取话题列表
 * @param {object} params - 查询参数
 * @param {string} params.type - 话题类型 all|offer|demand|project
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @returns {Promise<{list: array, total: number, page: number, pageSize: number}>}
 */
export const getTopics = (params) => {
  return request.get('/topics', { params })
}

/**
 * 获取话题详情
 * @param {number} id - 话题 ID
 * @returns {Promise<object>}
 */
export const getTopic = (id) => {
  return request.get(`/topics/${id}`)
}

/**
 * 创建话题
 * @param {object} data - 话题数据
 * @param {string} data.type - 话题类型 offer|demand|project
 * @param {string} data.title - 标题
 * @param {string} data.content - 内容
 * @param {array} data.tags - 标签数组
 * @param {array} data.images - 图片数组
 * @returns {Promise<object>}
 */
export const createTopic = (data) => {
  return request.post('/topics', data)
}

/**
 * 更新话题
 * @param {number} id - 话题 ID
 * @param {object} data - 话题数据
 * @returns {Promise<object>}
 */
export const updateTopic = (id, data) => {
  return request.put(`/topics/${id}`, data)
}

/**
 * 删除话题
 * @param {number} id - 话题 ID
 * @returns {Promise}
 */
export const deleteTopic = (id) => {
  return request.delete(`/topics/${id}`)
}

/**
 * 点赞话题
 * @param {number} id - 话题 ID
 * @returns {Promise<{isLiked: boolean, likeCount: number}>}
 */
export const likeTopic = (id) => {
  return request.post(`/topics/${id}/like`)
}

/**
 * 取消点赞
 * @param {number} id - 话题 ID
 * @returns {Promise<{isLiked: boolean, likeCount: number}>}
 */
export const unlikeTopic = (id) => {
  return request.delete(`/topics/${id}/like`)
}

/**
 * 获取话题评论列表
 * @param {number} id - 话题 ID
 * @param {object} params - 查询参数
 * @returns {Promise<array>}
 */
export const getComments = (id, params) => {
  return request.get(`/topics/${id}/comments`, { params })
}

/**
 * 发表评论
 * @param {number} id - 话题 ID
 * @param {string} content - 评论内容
 * @returns {Promise<object>}
 */
export const addComment = (id, content) => {
  return request.post(`/topics/${id}/comments`, { content })
}

