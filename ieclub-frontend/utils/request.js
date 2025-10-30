/**
 * 统一请求封装 - 小程序版
 * @param {String} url - 请求地址
 * @param {Object} options - 请求选项
 * @param {String} options.method - 请求方法 GET/POST/PUT/DELETE
 * @param {Object} options.data - 请求数据
 * @param {Boolean} options.loading - 是否显示 Loading，默认 true
 * @returns {Promise}
 */
const request = (url, options = {}) => {
  const {
    method = 'GET',
    data = {},
    loading = true
  } = options

  // 显示 Loading
  if (loading) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    })
  }

  return new Promise((resolve, reject) => {
    // 获取全局配置
    const app = getApp()
    const baseURL = app.globalData.apiBase || 'http://localhost:3000/api'
    
    // 获取 Token
    const token = wx.getStorageSync('token')

    wx.request({
      url: baseURL + url,
      method: method.toUpperCase(),
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        // 隐藏 Loading
        if (loading) {
          wx.hideLoading()
        }

        const { statusCode, data } = res

        // HTTP 成功
        if (statusCode === 200) {
          // 处理后端返回的 {success, message, data} 格式
          if (data.hasOwnProperty('success')) {
            if (data.success) {
              resolve(data.data || data)
              return
            } else {
              wx.showToast({
                title: data.message || '请求失败',
                icon: 'none',
                duration: 2000
              })
              const error = new Error(data.message || '请求失败')
              error.code = data.code || 'BUSINESS_ERROR'
              reject(error)
              return
            }
          }

          // 处理后端返回的 {code, data, message} 格式
          if (data.hasOwnProperty('code')) {
            const { code, data: responseData, message } = data

            // 业务成功
            if (code === 200) {
              resolve(responseData)
              return
            }

            // Token 过期
            if (code === 401) {
              wx.removeStorageSync('token')
              wx.showToast({
                title: '登录已过期',
                icon: 'none',
                duration: 1500
              })
              // 跳转到登录页
              setTimeout(() => {
                wx.reLaunch({
                  url: '/pages/login/index'
                })
              }, 1500)
              const error = new Error('登录已过期')
              error.code = 401
              reject(error)
              return
            }

            // 业务失败
            wx.showToast({
              title: message || '请求失败',
              icon: 'none',
              duration: 2000
            })
            const error = new Error(message || '请求失败')
            error.code = code
            reject(error)
            return
          }

          // 直接返回数据
          resolve(data)
          return
        }

        // HTTP 错误
        let errorMessage = '请求失败'
        
        switch (statusCode) {
          case 400:
            errorMessage = data.message || '请求参数错误'
            break
          case 401:
            errorMessage = '登录已过期'
            wx.removeStorageSync('token')
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/login/index'
              })
            }, 1500)
            break
          case 403:
            errorMessage = '没有权限访问'
            break
          case 404:
            errorMessage = '请求的资源不存在'
            break
          case 500:
            errorMessage = '服务器错误，请稍后重试'
            break
          default:
            errorMessage = data.message || '请求失败'
        }

        wx.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 2000
        })
        
        const error = new Error(errorMessage)
        error.code = statusCode
        reject(error)
      },
      fail: (err) => {
        // 隐藏 Loading
        if (loading) {
          wx.hideLoading()
        }

        console.error('Request fail:', err)
        
        wx.showToast({
          title: '网络连接失败，请检查网络',
          icon: 'none',
          duration: 2000
        })
        
        const error = new Error('网络连接失败')
        error.code = 'NETWORK_ERROR'
        reject(error)
      }
    })
  })
}

export default request

