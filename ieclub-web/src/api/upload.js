import request from '../utils/request'

/**
 * 上传头像
 * @param {File} file - 图片文件
 * @returns {Promise<{avatarUrl: string}>}
 */
export async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)

  return request.post('/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 上传多张图片
 * @param {File[]} files - 图片文件数组
 * @returns {Promise<{uploads: Array}>}
 */
export async function uploadImages(files) {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('images', file)
  })

  return request.post('/upload/images-v2', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

