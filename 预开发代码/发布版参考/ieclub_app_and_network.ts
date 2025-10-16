// ==================== src/app.tsx - 应用入口（完整版）====================

import { PropsWithChildren, useEffect } from 'react'
import { useLaunch } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useUserStore } from './store/user'
import { useNotificationStore } from './store/notification'
import { setupGlobalErrorHandler } from './utils/error-handler'
import { logger } from './utils/logger'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  const { checkLoginStatus } = useUserStore()
  const { fetchUnreadCount } = useNotificationStore()

  useLaunch(() => {
    logger.info('App launched')
    
    // 设置全局错误处理
    setupGlobalErrorHandler()
    
    // 初始化
    initApp()
  })

  const initApp = async () => {
    try {
      // 1. 检查登录状态
      const isLogin = await checkLoginStatus()
      logger.info('Login status:', isLogin)
      
      // 2. 如果已登录，获取未读消息数
      if (isLogin) {
        await fetchUnreadCount()
      }
      
      // 3. 检查更新（小程序）
      if (process.env.TARO_ENV === 'weapp') {
        checkUpdate()
      }
      
      // 4. 设置分享配置
      setupShare()
      
    } catch (error) {
      logger.error('App initialization failed:', error)
    }
  }

  // 检查小程序更新
  const checkUpdate = () => {
    const updateManager = Taro.getUpdateManager()
    
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        logger.info('发现新版本')
      }
    })
    
    updateManager.onUpdateReady(() => {
      Taro.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })
    
    updateManager.onUpdateFailed(() => {
      logger.error('新版本下载失败')
    })
  }

  // 设置全局分享
  const setupShare = () => {
    // 可以在这里设置全局分享配置
  }

  return children
}

export default App


// ==================== src/app.config.ts - 应用配置 ====================

export default defineAppConfig({
  pages: [
    'pages/topics/index',
    'pages/topic-detail/index',
    'pages/create-topic/index',
    'pages/search/index',
    'pages/login/index',
    'pages/register/index',
    'pages/profile/index',
    'pages/edit-profile/index',
    'pages/settings/index',
    'pages/notifications/index',
    'pages/my-topics/index',
    'pages/my-favorites/index',
    'pages/user-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'IEClub',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f5f5',
    enablePullDownRefresh: false
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#667eea',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/topics/index',
        text: '广场',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png'
      },
      {
        pagePath: 'pages/search/index',
        text: '发现',
        iconPath: 'assets/icons/search.png',
        selectedIconPath: 'assets/icons/search-active.png'
      },
      {
        pagePath: 'pages/notifications/index',
        text: '通知',
        iconPath: 'assets/icons/notification.png',
        selectedIconPath: 'assets/icons/notification-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/profile.png',
        selectedIconPath: 'assets/icons/profile-active.png'
      }
    ]
  },
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于小程序位置接口的效果展示'
    }
  }
})


// ==================== src/services/request.ts - 完整网络请求层 ====================

import Taro from '@tarojs/taro'
import { showLoading, hideLoading } from './loading'
import { logger } from '../utils/logger'

// 基础配置
const BASE_URL = process.env.TARO_APP_API_URL || 'https://api.ieclub.com'
const TIMEOUT = 30000

// 请求队列（用于取消重复请求）
const pendingRequests = new Map<string, AbortController>()

// 请求计数器（用于loading管理）
let requestCount = 0

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  timeout?: number
  showLoading?: boolean
  showError?: boolean
  needAuth?: boolean
  cancelable?: boolean
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 统一请求封装
 */
export async function request<T = any>(options: RequestOptions): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    timeout = TIMEOUT,
    showLoading: shouldShowLoading = false,
    showError = true,
    needAuth = true,
    cancelable = true
  } = options

  // 生成请求唯一标识
  const requestKey = `${method}:${url}:${JSON.stringify(data)}`

  // 取消重复请求
  if (cancelable && pendingRequests.has(requestKey)) {
    const controller = pendingRequests.get(requestKey)!
    controller.abort()
    pendingRequests.delete(requestKey)
  }

  // 创建新的AbortController
  const controller = new AbortController()
  if (cancelable) {
    pendingRequests.set(requestKey, controller)
  }

  // 显示loading
  if (shouldShowLoading) {
    requestCount++
    if (requestCount === 1) {
      showLoading()
    }
  }

  try {
    // 添加认证头
    if (needAuth) {
      const token = Taro.getStorageSync('token')
      if (token) {
        header['Authorization'] = `Bearer ${token}`
      }
    }

    // 添加通用头部
    header['Content-Type'] = header['Content-Type'] || 'application/json'
    header['X-Platform'] = process.env.TARO_ENV || 'unknown'
    header['X-Version'] = '1.0.0'

    // 发送请求
    const response = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      timeout
    })

    // 清除请求标识
    if (cancelable) {
      pendingRequests.delete(requestKey)
    }

    // 处理响应
    const result = response.data as ApiResponse<T>

    // 成功响应
    if (result.code === 200) {
      logger.info('API Success:', url, result)
      return result.data
    }

    // 特殊错误码处理
    if (result.code === 401) {
      // Token过期，清除登录信息
      Taro.removeStorageSync('token')
      Taro.removeStorageSync('userInfo')
      
      Taro.showModal({
        title: '登录过期',
        content: '请重新登录',
        showCancel: false,
        success: () => {
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      })
      
      throw new Error('Unauthorized')
    }

    // 其他错误
    const error = new Error(result.message || '请求失败')
    if (showError) {
      Taro.showToast({
        title: result.message || '请求失败',
        icon: 'none'
      })
    }
    
    logger.error('API Error:', url, result)
    throw error

  } catch (error: any) {
    // 清除请求标识
    if (cancelable) {
      pendingRequests.delete(requestKey)
    }

    logger.error('Request Error:', url, error)

    // 网络错误处理
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        if (showError) {
          Taro.showToast({
            title: '请求超时，请检查网络',
            icon: 'none'
          })
        }
      } else if (error.errMsg.includes('fail')) {
        if (showError) {
          Taro.showToast({
            title: '网络异常，请稍后重试',
            icon: 'none'
          })
        }
      }
    }

    throw error

  } finally {
    // 隐藏loading
    if (shouldShowLoading) {
      requestCount--
      if (requestCount === 0) {
        hideLoading()
      }
    }
  }
}

/**
 * GET请求
 */
export function get<T = any>(url: string, params?: any, options?: Partial<RequestOptions>) {
  return request<T>({
    url,
    method: 'GET',
    data: params,
    ...options
  })
}

/**
 * POST请求
 */
export function post<T = any>(url: string, data?: any, options?: Partial<RequestOptions>) {
  return request<T>({
    url,
    method: 'POST',
    data,
    ...options
  })
}

/**
 * PUT请求
 */
export function put<T = any>(url: string, data?: any, options?: Partial<RequestOptions>) {
  return request<T>({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

/**
 * DELETE请求
 */
export function del<T = any>(url: string, data?: any, options?: Partial<RequestOptions>) {
  return request<T>({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}

/**
 * 上传文件
 */
export async function uploadFile(filePath: string, options?: {
  name?: string
  formData?: Record<string, any>
  onProgress?: (progress: number) => void
}): Promise<string> {
  const {
    name = 'file',
    formData = {},
    onProgress
  } = options || {}

  const token = Taro.getStorageSync('token')

  return new Promise((resolve, reject) => {
    const uploadTask = Taro.uploadFile({
      url: `${BASE_URL}/api/upload`,
      filePath,
      name,
      formData,
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data.data.url)
          } else {
            Taro.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            })
            reject(new Error(data.message || '上传失败'))
          }
        } catch (error) {
          reject(error)
        }
      },
      fail: (error) => {
        Taro.showToast({
          title: '上传失败',
          icon: 'none'
        })
        reject(error)
      }
    })

    // 监听上传进度
    if (onProgress) {
      uploadTask.progress((res) => {
        onProgress(res.progress)
      })
    }
  })
}


// ==================== src/services/loading.ts - Loading管理 ====================

let loadingTimer: NodeJS.Timeout | null = null
let loadingVisible = false

/**
 * 显示Loading
 */
export function showLoading(title = '加载中...') {
  // 防止重复显示
  if (loadingVisible) return

  // 延迟显示（避免闪烁）
  loadingTimer = setTimeout(() => {
    Taro.showLoading({
      title,
      mask: true
    })
    loadingVisible = true
  }, 300)
}

/**
 * 隐藏Loading
 */
export function hideLoading() {
  // 清除延迟
  if (loadingTimer) {
    clearTimeout(loadingTimer)
    loadingTimer = null
  }

  // 隐藏loading
  if (loadingVisible) {
    Taro.hideLoading()
    loadingVisible = false
  }
}


// ==================== src/utils/error-handler.ts - 全局错误处理 ====================

import Taro from '@tarojs/taro'
import { logger } from './logger'

/**
 * 设置全局错误处理
 */
export function setupGlobalErrorHandler() {
  // 监听小程序错误
  Taro.onError((error) => {
    logger.error('Global Error:', error)
    
    // 上报错误
    reportError({
      type: 'runtime_error',
      message: error,
      stack: error
    })
  })

  // 监听未处理的Promise错误
  Taro.onUnhandledRejection((error) => {
    logger.error('Unhandled Promise Rejection:', error)
    
    // 上报错误
    reportError({
      type: 'promise_rejection',
      message: error.reason,
      stack: error.reason
    })
  })
}

/**
 * 上报错误到服务器
 */
async function reportError(error: {
  type: string
  message: string
  stack: any
}) {
  try {
    // 获取系统信息
    const systemInfo = await Taro.getSystemInfo()
    
    // 上报到服务器
    await Taro.request({
      url: `${process.env.TARO_APP_API_URL}/api/errors`,
      method: 'POST',
      data: {
        ...error,
        userInfo: Taro.getStorageSync('userInfo'),
        systemInfo: {
          platform: systemInfo.platform,
          system: systemInfo.system,
          version: systemInfo.version,
          SDKVersion: systemInfo.SDKVersion
        },
        timestamp: Date.now()
      }
    })
  } catch (e) {
    // 上报失败，静默处理
    console.error('Error reporting failed:', e)
  }
}


// ==================== src/utils/storage.ts - 存储工具 ====================

import Taro from '@tarojs/taro'

/**
 * 安全的获取存储
 */
export function getStorage<T = any>(key: string, defaultValue?: T): T | undefined {
  try {
    const value = Taro.getStorageSync(key)
    return value !== '' ? value : defaultValue
  } catch (error) {
    console.error('getStorage error:', error)
    return defaultValue
  }
}

/**
 * 安全的设置存储
 */
export function setStorage(key: string, value: any): boolean {
  try {
    Taro.setStorageSync(key, value)
    return true
  } catch (error) {
    console.error('setStorage error:', error)
    return false
  }
}

/**
 * 安全的删除存储
 */
export function removeStorage(key: string): boolean {
  try {
    Taro.removeStorageSync(key)
    return true
  } catch (error) {
    console.error('removeStorage error:', error)
    return false
  }
}

/**
 * 清空存储
 */
export function clearStorage(): boolean {
  try {
    Taro.clearStorageSync()
    return true
  } catch (error) {
    console.error('clearStorage error:', error)
    return false
  }
}


// ==================== src/utils/validator.ts - 表单验证工具 ====================

/**
 * 验证手机号
 */
export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证邮箱
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * 验证密码强度
 */
export function validatePassword(password: string): {
  valid: boolean
  strength: 'weak' | 'medium' | 'strong'
  message: string
} {
  if (password.length < 6) {
    return {
      valid: false,
      strength: 'weak',
      message: '密码至少6位'
    }
  }

  if (password.length < 8) {
    return {
      valid: true,
      strength: 'weak',
      message: '密码强度较弱'
    }
  }

  // 检查是否包含数字、字母
  const hasNumber = /\d/.test(password)
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (hasNumber && hasLetter && hasSpecial) {
    return {
      valid: true,
      strength: 'strong',
      message: '密码强度很强'
    }
  }

  if ((hasNumber && hasLetter) || (hasNumber && hasSpecial) || (hasLetter && hasSpecial)) {
    return {
      valid: true,
      strength: 'medium',
      message: '密码强度中等'
    }
  }

  return {
    valid: true,
    strength: 'weak',
    message: '密码强度较弱'
  }
}

/**
 * 验证昵称
 */
export function validateNickname(nickname: string): {
  valid: boolean
  message: string
} {
  if (!nickname || nickname.trim().length === 0) {
    return { valid: false, message: '昵称不能为空' }
  }

  if (nickname.length < 2) {
    return { valid: false, message: '昵称至少2个字符' }
  }

  if (nickname.length > 20) {
    return { valid: false, message: '昵称最多20个字符' }
  }

  // 检查特殊字符
  if (/[<>'"\\]/.test(nickname)) {
    return { valid: false, message: '昵称包含非法字符' }
  }

  return { valid: true, message: '' }
}


// ==================== src/utils/image.ts - 图片处理工具 ====================

import Taro from '@tarojs/taro'

/**
 * 压缩图片
 */
export async function compressImage(
  filePath: string,
  quality = 80
): Promise<string> {
  try {
    const res = await Taro.compressImage({
      src: filePath,
      quality
    })
    return res.tempFilePath
  } catch (error) {
    console.error('压缩图片失败:', error)
    return filePath
  }
}

/**
 * 选择图片
 */
export async function chooseImage(options?: {
  count?: number
  sizeType?: Array<'original' | 'compressed'>
  sourceType?: Array<'album' | 'camera'>
}): Promise<string[]> {
  const {
    count = 9,
    sizeType = ['compressed'],
    sourceType = ['album', 'camera']
  } = options || {}

  try {
    const res = await Taro.chooseImage({
      count,
      sizeType,
      sourceType
    })

    return res.tempFilePaths
  } catch (error) {
    console.error('选择图片失败:', error)
    return []
  }
}

/**
 * 预览图片
 */
export function previewImage(urls: string[], current?: string) {
  Taro.previewImage({
    urls,
    current: current || urls[0]
  })
}

/**
 * 保存图片到相册
 */
export async function saveImageToAlbum(filePath: string): Promise<boolean> {
  try {
    // 先授权
    const authResult = await Taro.authorize({
      scope: 'scope.writePhotosAlbum'
    })

    // 保存图片
    await Taro.saveImageToPhotosAlbum({
      filePath
    })

    Taro.showToast({
      title: '保存成功',
      icon: 'success'
    })

    return true
  } catch (error: any) {
    if (error.errMsg.includes('auth deny')) {
      Taro.showModal({
        title: '提示',
        content: '需要授权访问相册',
        success: (res) => {
          if (res.confirm) {
            Taro.openSetting()
          }
        }
      })
    } else {
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
    return false
  }
}


// ==================== src/app.scss - 全局样式 ====================
/*
@import './styles/variables.scss';
@import './styles/mixins.scss';

page {
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 28rpx;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

view, text, image, button, input, textarea {
  box-sizing: border-box;
}

button {
  border: none;
  outline: none;
  background: none;
  padding: 0;
  margin: 0;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

button::after {
  border: none;
}

image {
  display: block;
  max-width: 100%;
  height: auto;
}

// 通用工具类
.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.text-center {
  text-align: center;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-ellipsis-2 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.text-ellipsis-3 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
*/