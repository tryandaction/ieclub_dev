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

// 退出登录
export async function logout(): Promise<void> {
  return request<void>({
    url: '/api/auth/logout',
    method: 'POST'
  })
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

// 重置密码
export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  return request<void>({
    url: '/api/auth/reset-password',
    method: 'POST',
    data: { email, code, newPassword },
    needAuth: false
  })
}

// 修改密码
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  return request<void>({
    url: '/api/auth/change-password',
    method: 'POST',
    data: { oldPassword, newPassword }
  })
}

// 更新用户信息
export async function updateProfile(userData: Partial<User>): Promise<User> {
  return request<User>({
    url: '/api/auth/profile',
    method: 'PUT',
    data: userData
  })
}