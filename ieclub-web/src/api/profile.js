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

// 获取用户关注列表
export const getUserFollowing = (userId, params) => {
  return request.get(`/profile/${userId}/following`, { params })
}

// 获取用户粉丝列表
export const getUserFollowers = (userId, params) => {
  return request.get(`/profile/${userId}/followers`, { params })
}

// 获取用户收藏列表
export const getUserFavorites = (userId, params) => {
  return request.get(`/profile/${userId}/favorites`, { params })
}

// 获取用户参与的活动
export const getUserActivities = (userId, params) => {
  return request.get(`/profile/${userId}/activities`, { params })
}

// 更新个人主页
export const updateProfile = (data) => {
  return request.put('/profile', data)
}

