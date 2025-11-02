import request from '../utils/request'

/**
 * 获取话题列表
 * @param {Object} params - 查询参数
 * @param {string} params.type - 话题类型 (offer/demand/project)
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 */
export const getTopics = (params) => {
  return request.get('/topics', { params })
}

/**
 * 获取话题详情
 * @param {number} id - 话题ID
 */
export const getTopicDetail = (id) => {
  return request.get(`/topics/${id}`)
}

/**
 * 创建话题
 * @param {Object} data - 话题数据
 * @param {string} data.type - 话题类型 (offer/demand/project)
 * @param {string} data.title - 标题
 * @param {string} data.description - 描述
 * @param {Array} data.tags - 标签数组
 * @param {Array} data.images - 图片URL数组
 */
export const createTopic = (data) => {
  return request.post('/topics', data)
}

/**
 * 更新话题
 * @param {number} id - 话题ID
 * @param {Object} data - 更新的数据
 */
export const updateTopic = (id, data) => {
  return request.put(`/topics/${id}`, data)
}

/**
 * 删除话题
 * @param {number} id - 话题ID
 */
export const deleteTopic = (id) => {
  return request.delete(`/topics/${id}`)
}

/**
 * 点赞/取消点赞话题
 * @param {number} id - 话题ID
 */
export const toggleLike = (id) => {
  return request.post(`/topics/${id}/like`)
}

/**
 * 收藏/取消收藏话题
 * @param {number} id - 话题ID
 */
export const toggleBookmark = (id) => {
  return request.post(`/topics/${id}/bookmark`)
}

/**
 * 快速操作（想听、我也会等）
 * @param {number} id - 话题ID
 * @param {string} action - 操作类型
 */
export const quickAction = (id, action) => {
  return request.post(`/topics/${id}/quick-action`, { action })
}

/**
 * 获取推荐话题
 */
export const getRecommendTopics = () => {
  return request.get('/topics/recommend')
}

/**
 * 获取热门话题
 */
export const getTrendingTopics = () => {
  return request.get('/topics/trending')
}

/**
 * 获取匹配的话题
 * @param {number} id - 话题ID
 */
export const getMatches = (id) => {
  return request.get(`/topics/${id}/matches`)
}

/**
 * 搜索话题
 * @param {Object} params - 搜索参数
 * @param {string} params.keyword - 搜索关键词
 * @param {string} params.type - 话题类型（可选）
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 */
export const searchTopics = (params) => {
  return request.get('/search/topics', { params })
}
