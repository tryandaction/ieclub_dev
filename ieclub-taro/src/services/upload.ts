// ==================== 文件上传API服务（增强版） ====================

import Taro from '@tarojs/taro'

const BASE_URL = process.env.TARO_APP_API_URL || 'https://api.ieclub.com'

/**
 * 上传图片
 */
export async function uploadImage(filePath: string): Promise<string> {
  const token = Taro.getStorageSync('token')

  return new Promise((resolve, reject) => {
    Taro.uploadFile({
      url: `${BASE_URL}/api/upload/image`,
      filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data.data.url)
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        } catch (error) {
          reject(error)
        }
      },
      fail: (error) => {
        reject(error)
      }
    })
  })
}

/**
 * 批量上传图片
 */
export async function uploadImages(filePaths: string[]): Promise<string[]> {
  const uploadPromises = filePaths.map(filePath => uploadImage(filePath))
  return Promise.all(uploadPromises)
}