import request from '../utils/request'

// 创建发布内容
export const createPost = (data) => {
  return request.post('/posts', data)
}

// 获取发布列表
export const getPosts = (params) => {
  return request.get('/posts', { params })
}

// 获取发布详情
export const getPostById = (id) => {
  return request.get(`/posts/${id}`)
}

// 更新发布内容
export const updatePost = (id, data) => {
  return request.put(`/posts/${id}`, data)
}

// 删除发布内容
export const deletePost = (id) => {
  return request.delete(`/posts/${id}`)
}

// 解析外链信息
export const parseLink = (url) => {
  return request.post('/posts/parse-link', { url })
}

