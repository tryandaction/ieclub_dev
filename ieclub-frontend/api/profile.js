// api/profile.js
// 个人主页相关API

import { request } from '../utils/request'

/**
 * 获取用户公开主页
 */
export const getProfile = (userId) => {
  return request({
    url: `/profile/${userId}`,
    method: 'GET'
  })
}

/**
 * 获取用户主页的发布内容
 */
export const getUserPosts = (userId, params = {}) => {
  return request({
    url: `/profile/${userId}/posts`,
    method: 'GET',
    data: params
  })
}

/**
 * 获取用户统计数据
 */
export const getUserStats = (userId) => {
  return request({
    url: `/profile/${userId}/stats`,
    method: 'GET'
  })
}

/**
 * 获取用户关注列表
 */
export const getUserFollowing = (userId, params = {}) => {
  return request({
    url: `/profile/${userId}/following`,
    method: 'GET',
    data: params
  })
}

/**
 * 获取用户粉丝列表
 */
export const getUserFollowers = (userId, params = {}) => {
  return request({
    url: `/profile/${userId}/followers`,
    method: 'GET',
    data: params
  })
}

/**
 * 获取用户收藏列表
 */
export const getUserFavorites = (userId, params = {}) => {
  return request({
    url: `/profile/${userId}/favorites`,
    method: 'GET',
    data: params
  })
}

/**
 * 获取用户参与的活动
 */
export const getUserActivities = (userId, params = {}) => {
  return request({
    url: `/profile/${userId}/activities`,
    method: 'GET',
    data: params
  })
}

/**
 * 更新个人主页
 */
export const updateProfile = (data) => {
  return request({
    url: '/profile',
    method: 'PUT',
    data
  })
}
