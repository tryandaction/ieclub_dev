// api/upload.js
// 图片上传相关API

/**
 * 获取完整图片URL（图片走静态文件服务，不走/api）
 */
export const getFullImageUrl = (url) => {
  if (!url) return ''
  // 渐变背景直接返回
  if (url.startsWith('linear-gradient')) return url
  // 已经是完整URL
  if (url.startsWith('http')) return url
  // 相对路径，添加网站根地址
  const siteUrl = 'https://ieclub.online'
  return `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

/**
 * 上传头像
 * @param {string} filePath - 本地文件路径
 * @returns {Promise<{url: string}>}
 */
export const uploadAvatar = (filePath) => {
  return new Promise((resolve, reject) => {
    const app = getApp()
    const baseURL = app.globalData.apiBase || 'https://ieclub.online/api'
    const token = wx.getStorageSync('token')

    wx.uploadFile({
      url: `${baseURL}/upload/avatar`,
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        console.log('📷 头像上传响应:', res)
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            if (data.success && data.data && data.data.url) {
              resolve({ url: data.data.url })
            } else {
              reject(new Error(data.message || '上传失败'))
            }
          } catch (e) {
            reject(new Error('解析响应失败'))
          }
        } else {
          reject(new Error('上传失败: ' + res.statusCode))
        }
      },
      fail: (err) => {
        console.error('❌ 头像上传失败:', err)
        reject(new Error('网络错误'))
      }
    })
  })
}

/**
 * 上传封面图
 * @param {string} filePath - 本地文件路径
 * @returns {Promise<{url: string}>}
 */
export const uploadCover = (filePath) => {
  return new Promise((resolve, reject) => {
    const app = getApp()
    const baseURL = app.globalData.apiBase || 'https://ieclub.online/api'
    const token = wx.getStorageSync('token')

    wx.uploadFile({
      url: `${baseURL}/upload/cover`,
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        console.log('🖼️ 封面上传响应:', res)
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            if (data.success && data.data && data.data.url) {
              resolve({ url: data.data.url })
            } else {
              reject(new Error(data.message || '上传失败'))
            }
          } catch (e) {
            reject(new Error('解析响应失败'))
          }
        } else {
          reject(new Error('上传失败: ' + res.statusCode))
        }
      },
      fail: (err) => {
        console.error('❌ 封面上传失败:', err)
        reject(new Error('网络错误'))
      }
    })
  })
}

/**
 * 通用图片上传
 * @param {string} filePath - 本地文件路径
 * @param {string} type - 上传类型 avatar/cover/image
 * @returns {Promise<{url: string}>}
 */
export const uploadImage = (filePath, type = 'image') => {
  if (type === 'avatar') {
    return uploadAvatar(filePath)
  } else if (type === 'cover') {
    return uploadCover(filePath)
  }
  
  return new Promise((resolve, reject) => {
    const app = getApp()
    const baseURL = app.globalData.apiBase || 'https://ieclub.online/api'
    const token = wx.getStorageSync('token')

    wx.uploadFile({
      url: `${baseURL}/upload/image`,
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            if (data.success && data.data && data.data.url) {
              resolve({ url: data.data.url })
            } else {
              reject(new Error(data.message || '上传失败'))
            }
          } catch (e) {
            reject(new Error('解析响应失败'))
          }
        } else {
          reject(new Error('上传失败: ' + res.statusCode))
        }
      },
      fail: (err) => {
        reject(new Error('网络错误'))
      }
    })
  })
}
