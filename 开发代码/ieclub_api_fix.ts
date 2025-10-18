// 1. 修复 src/services/request.ts
import Taro from '@tarojs/taro'

const BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001'
  : 'https://api.ieclub.online'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  needAuth?: boolean
}

export const request = async <T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { method = 'GET', data, header = {}, needAuth = false } = options

  try {
    // 获取token
    const token = Taro.getStorageSync('token')
    
    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...header
    }
    
    // 如果需要认证，添加token
    if (needAuth && token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // 发起请求 - 注意这里不要重复添加 /api
    const response = await Taro.request({
      url: `${BASE_URL}${url}`, // url 参数应该已经包含 /api
      method,
      data,
      header: headers,
      timeout: 10000
    })

    // 处理响应
    if (response.statusCode === 200) {
      const result = response.data as any
      
      if (result.success) {
        return result.data
      } else {
        throw new Error(result.message || '请求失败')
      }
    } else if (response.statusCode === 401) {
      // 未授权，清除token并跳转登录
      Taro.removeStorageSync('token')
      Taro.removeStorageSync('userInfo')
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/login/index' })
      }, 1500)
      throw new Error('未授权')
    } else {
      throw new Error(`请求失败: ${response.statusCode}`)
    }
  } catch (error: any) {
    console.error('请求错误:', error)
    Taro.showToast({
      title: error.message || '网络请求失败',
      icon: 'none'
    })
    throw error
  }
}

// 2. 修复 src/services/topic.ts
import { request } from './request'

export interface Topic {
  id: number
  title: string
  content: string
  type: 'supply' | 'demand' | 'discussion'
  tags: string[]
  authorId: number
  author: {
    id: number
    nickname: string
    avatar?: string
  }
  viewCount: number
  likeCount: number
  commentCount: number
  isLiked?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTopicData {
  title: string
  content: string
  type: 'supply' | 'demand' | 'discussion'
  tags: string[]
}

// 获取话题列表
export const getTopics = (params?: {
  page?: number
  limit?: number
  type?: string
  tag?: string
}) => {
  return request<{ items: Topic[]; total: number }>(
    '/api/topics', // 路径包含 /api
    { 
      method: 'GET',
      data: params 
    }
  )
}

// 获取话题详情
export const getTopicDetail = (id: number) => {
  return request<Topic>(
    `/api/topics/${id}`,
    { method: 'GET' }
  )
}

// 创建话题 - 需要认证
export const createTopic = (data: CreateTopicData) => {
  return request<Topic>(
    '/api/topics',
    {
      method: 'POST',
      data,
      needAuth: true // 标记需要认证
    }
  )
}

// 点赞话题 - 需要认证
export const likeTopic = (id: number) => {
  return request(
    `/api/topics/${id}/like`,
    {
      method: 'POST',
      needAuth: true
    }
  )
}

// 取消点赞 - 需要认证
export const unlikeTopic = (id: number) => {
  return request(
    `/api/topics/${id}/like`,
    {
      method: 'DELETE',
      needAuth: true
    }
  )
}

// 3. 修复 src/services/notification.ts
import { request } from './request'

export interface Notification {
  id: number
  type: 'like' | 'comment' | 'follow' | 'system'
  title: string
  content: string
  isRead: boolean
  relatedId?: number
  createdAt: string
}

// 获取通知列表 - 需要认证
export const getNotifications = (params?: {
  page?: number
  limit?: number
}) => {
  return request<{ items: Notification[]; total: number }>(
    '/api/notifications', // 正确的路径
    {
      method: 'GET',
      data: params,
      needAuth: true // 需要认证
    }
  )
}

// 标记已读 - 需要认证
export const markAsRead = (id: number) => {
  return request(
    `/api/notifications/${id}/read`,
    {
      method: 'PUT',
      needAuth: true
    }
  )
}

// 标记全部已读 - 需要认证
export const markAllAsRead = () => {
  return request(
    '/api/notifications/read-all',
    {
      method: 'PUT',
      needAuth: true
    }
  )
}

// 4. 修复 src/services/auth.ts
import Taro from '@tarojs/taro'
import { request } from './request'

export interface LoginData {
  code?: string // 微信登录code
  email?: string
  password?: string
}

export interface RegisterData {
  nickname: string
  email: string
  password: string
}

export interface UserInfo {
  id: number
  nickname: string
  avatar?: string
  email?: string
  bio?: string
}

// 登录
export const login = async (data: LoginData) => {
  const result = await request<{ token: string; user: UserInfo }>(
    '/api/auth/login',
    {
      method: 'POST',
      data
    }
  )
  
  // 保存token和用户信息
  Taro.setStorageSync('token', result.token)
  Taro.setStorageSync('userInfo', result.user)
  
  return result
}

// 注册
export const register = async (data: RegisterData) => {
  const result = await request<{ token: string; user: UserInfo }>(
    '/api/auth/register',
    {
      method: 'POST',
      data
    }
  )
  
  // 保存token和用户信息
  Taro.setStorageSync('token', result.token)
  Taro.setStorageSync('userInfo', result.user)
  
  return result
}

// 登出
export const logout = () => {
  Taro.removeStorageSync('token')
  Taro.removeStorageSync('userInfo')
  Taro.reLaunch({ url: '/pages/login/index' })
}

// 获取当前用户信息 - 需要认证
export const getCurrentUser = () => {
  return request<UserInfo>(
    '/api/auth/me',
    {
      method: 'GET',
      needAuth: true
    }
  )
}
