import request from '../utils/request'

/**
 * 获取话题的评论列表
 * @param {number} topicId - 话题ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 */
export const getComments = (topicId, params) => {
  return request.get(`/topics/${topicId}/comments`, { params })
}

/**
 * 创建评论
 * @param {number} topicId - 话题ID
 * @param {Object} data - 评论数据
 * @param {string} data.content - 评论内容
 * @param {number} data.parentId - 父评论ID（回复时使用）
 */
export const createComment = (topicId, data) => {
  return request.post(`/topics/${topicId}/comments`, data)
}

/**
 * 删除评论
 * @param {number} topicId - 话题ID
 * @param {number} commentId - 评论ID
 */
export const deleteComment = (topicId, commentId) => {
  return request.delete(`/topics/${topicId}/comments/${commentId}`)
}

/**
 * 点赞/取消点赞评论
 * @param {number} topicId - 话题ID
 * @param {number} commentId - 评论ID
 */
export const toggleCommentLike = (topicId, commentId) => {
  return request.post(`/topics/${topicId}/comments/${commentId}/like`)
}

