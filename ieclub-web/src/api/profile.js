import request from '../utils/request'

// 获取用户公开主页
export const getProfile = (userId) => {
  return request.get(`/profile/${userId}`)
}

// 获取用户主页的发布内容
export const getUserPosts = (userId, params) => {
  return request.get(`/profile/${userId}/posts`, { params })
}

// 获取用户统计数据
export const getUserStats = (userId) => {
  return request.get(`/profile/${userId}/stats`)
}

// 更新个人主页
export const updateProfile = (data) => {
  return request.put('/profile', data)
}

