// ==================== 用户状态管理（增强版） ====================

import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { login as loginApi, register as registerApi, getUserProfile } from '../services/user'
import type { User, LoginParams, RegisterParams } from '../types'

interface UserState {
  token: string | null
  userInfo: User | null
  isLogin: boolean

  // Actions
  setToken: (token: string) => void
  setUserInfo: (user: User) => void
  login: (params: LoginParams) => Promise<void>
  register: (params: RegisterParams) => Promise<void>
  logout: () => void
  checkLoginStatus: () => Promise<boolean>
  refreshUserInfo: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  token: null,
  userInfo: null,
  isLogin: false,

  setToken: (token: string) => {
    Taro.setStorageSync('token', token)
    set({ token, isLogin: true })
  },

  setUserInfo: (user: User) => {
    Taro.setStorageSync('userInfo', user)
    set({ userInfo: user })
  },

  login: async (params: LoginParams) => {
    try {
      const res = await loginApi(params)
      get().setToken(res.token)
      get().setUserInfo(res.user)
      Taro.showToast({ title: '登录成功', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
      throw error
    }
  },

  register: async (params: RegisterParams) => {
    try {
      const res = await registerApi(params)
      get().setToken(res.token)
      get().setUserInfo(res.user)
      Taro.showToast({ title: '注册成功', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '注册失败', icon: 'none' })
      throw error
    }
  },

  logout: () => {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('userInfo')
    set({
      token: null,
      userInfo: null,
      isLogin: false
    })
    Taro.reLaunch({ url: '/pages/login/index' })
  },

  checkLoginStatus: async () => {
    const token = Taro.getStorageSync('token')
    const userInfo = Taro.getStorageSync('userInfo')

    if (token && userInfo) {
      set({ token, userInfo, isLogin: true })

      try {
        await get().refreshUserInfo()
        return true
      } catch (error) {
        get().logout()
        return false
      }
    }

    return false
  },

  refreshUserInfo: async () => {
    try {
      const res = await getUserProfile()
      get().setUserInfo(res.user)
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      throw error
    }
  }
}))