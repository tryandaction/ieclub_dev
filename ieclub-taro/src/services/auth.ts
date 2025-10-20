// src/services/auth.ts - 认证相关API服务

import { request } from './request'
import type { LoginParams, RegisterParams, LoginResponse, User } from '../types'

// 登录
export async function login(params: LoginParams): Promise<LoginResponse> {
  return request<LoginResponse>({
    url: '/api/auth/login',
    method: 'POST',
    data: params,
    needAuth: false
  })
}

// 注册
export async function register(params: RegisterParams): Promise<User> {
  return request<User>({
    url: '/api/auth/register',
    method: 'POST',
    data: params,
    needAuth: false
  })
}

// 退出登录（前端直接清除token即可）
export async function logout(): Promise<void> {
  // 前端清除本地存储的token
  return Promise.resolve()
}

// 获取当前用户信息
export async function getCurrentUser(): Promise<User> {
  return request<User>({
    url: '/api/auth/me',
    method: 'GET'
  })
}

// 刷新token
export async function refreshToken(): Promise<LoginResponse> {
  return request<LoginResponse>({
    url: '/api/auth/refresh',
    method: 'POST',
    needAuth: false
  })
}

// 发送验证码
export async function sendVerificationCode(email: string): Promise<void> {
  return request<void>({
    url: '/api/auth/send-code',
    method: 'POST',
    data: { email },
    needAuth: false
  })
}

// 验证验证码
export async function verifyCode(email: string, code: string): Promise<void> {
  return request<void>({
    url: '/api/auth/verify-code',
    method: 'POST',
    data: { email, code },
    needAuth: false
  })
}

// 注意：重置密码和修改密码功能暂未实现
// 如需要，请在后端添加相应接口

// 更新用户信息
export async function updateProfile(userData: Partial<User>): Promise<User> {
  return request<User>({
    url: '/api/auth/profile',
    method: 'PUT',
    data: userData
  })
}