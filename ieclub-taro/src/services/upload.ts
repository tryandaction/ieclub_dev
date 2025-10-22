// src/services/upload.ts - 文件上传服务

import { request } from './request'
import Taro from '@tarojs/taro'

export interface UploadResult {
  url: string
  thumbnail?: string
  width?: number
  height?: number
  size: number
  originalName: string
}

export interface DocumentUploadResult {
  name: string
  url: string
  size: number
  type: string
}

// 上传图片
export async function uploadImages(files: string[]): Promise<UploadResult[]> {
  try {
    const formData = new FormData()
    
    // 将文件路径转换为File对象
    for (let i = 0; i < files.length; i++) {
      const filePath = files[i]
      const fileName = `image_${i}.jpg`
      
      // 在小程序环境中，需要先获取文件信息
      const fileInfo = await Taro.getFileInfo({ filePath })
      
      // 创建File对象（模拟）
      const file = {
        uri: filePath,
        name: fileName,
        type: 'image/jpeg'
      }
      
      formData.append('images', file as any)
    }

    const res = await Taro.uploadFile({
      url: `${process.env.TARO_APP_API}/upload/images`,
      filePath: files[0], // 小程序只能一次上传一个文件
      name: 'images',
      header: {
        'Authorization': `Bearer ${Taro.getStorageSync('token')}`
      }
    })

    if (res.statusCode === 200) {
      const data = JSON.parse(res.data)
      if (data.success) {
        return data.data
      } else {
        throw new Error(data.message || '上传失败')
      }
    } else {
      throw new Error('上传失败')
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    throw error
  }
}

// 上传单张图片（小程序优化版本）
export async function uploadSingleImage(filePath: string): Promise<UploadResult> {
  try {
    const res = await Taro.uploadFile({
      url: `${process.env.TARO_APP_API}/upload/images`,
      filePath,
      name: 'images',
      header: {
        'Authorization': `Bearer ${Taro.getStorageSync('token')}`
      }
    })

    if (res.statusCode === 200) {
      const data = JSON.parse(res.data)
      if (data.success && data.data.length > 0) {
        return data.data[0]
      } else {
        throw new Error(data.message || '上传失败')
      }
    } else {
      throw new Error('上传失败')
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    throw error
  }
}

// 批量上传图片（小程序版本）
export async function uploadMultipleImages(files: string[]): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  
  try {
    // 小程序需要逐个上传
    for (const filePath of files) {
      const result = await uploadSingleImage(filePath)
      results.push(result)
    }
    
    return results
  } catch (error) {
    console.error('批量上传失败:', error)
    throw error
  }
}

// 上传文档
export async function uploadDocuments(files: string[]): Promise<DocumentUploadResult[]> {
  try {
    const results: DocumentUploadResult[] = []
    
    // 小程序需要逐个上传文档
    for (const filePath of files) {
      const res = await Taro.uploadFile({
        url: `${process.env.TARO_APP_API}/upload/documents`,
        filePath,
        name: 'documents',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      })

      if (res.statusCode === 200) {
        const data = JSON.parse(res.data)
        if (data.success && data.data.length > 0) {
          results.push(data.data[0])
        }
      }
    }
    
    return results
  } catch (error) {
    console.error('文档上传失败:', error)
    throw error
  }
}

// 获取链接预览
export async function getLinkPreview(url: string): Promise<any> {
  return request<any>({
    url: '/upload/link-preview',
    method: 'POST',
    data: { url }
  })
}

// 删除文件
export async function deleteFile(url: string): Promise<void> {
  return request<void>({
    url: '/upload/file',
    method: 'DELETE',
    data: { url }
  })
}