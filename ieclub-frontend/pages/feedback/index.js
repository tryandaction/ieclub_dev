// pages/feedback/index.js
import { request } from '../../utils/request'

Page({
  data: {
    // 表单数据
    form: {
      type: 'bug',
      title: '',
      content: '',
      contact: '',
      images: []
    },
    
    // 反馈类型
    types: [
      { value: 'bug', label: 'Bug反馈', icon: '🐛', desc: '功能异常或错误' },
      { value: 'feature', label: '功能建议', icon: '💡', desc: '新功能需求' },
      { value: 'improvement', label: '优化建议', icon: '✨', desc: '体验优化' },
      { value: 'other', label: '其他', icon: '💬', desc: '其他反馈' }
    ],
    
    // 我的反馈列表
    myFeedbacks: [],
    loading: false,
    submitting: false,
    
    // 当前Tab: 0-提交反馈, 1-我的反馈
    currentTab: 0,
    tabs: ['提交反馈', '我的反馈']
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '意见反馈' })
    
    // 获取设备信息
    wx.getSystemInfo({
      success: (res) => {
        this.deviceInfo = {
          platform: res.platform,
          system: res.system,
          model: res.model,
          version: res.version
        }
      }
    })
  },

  onShow() {
    // 如果在"我的反馈"Tab，刷新列表
    if (this.data.currentTab === 1) {
      this.loadMyFeedbacks()
    }
  },

  // 切换Tab
  switchTab(e) {
    const { index } = e.currentTarget.dataset
    if (index === this.data.currentTab) return
    
    this.setData({ currentTab: index })
    
    // 切换到"我的反馈"时加载数据
    if (index === 1) {
      this.loadMyFeedbacks()
    }
  },

  // 选择反馈类型
  selectType(e) {
    const { type } = e.currentTarget.dataset
    this.setData({
      'form.type': type
    })
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({
      'form.title': e.detail.value
    })
  },

  // 输入内容
  onContentInput(e) {
    this.setData({
      'form.content': e.detail.value
    })
  },

  // 输入联系方式
  onContactInput(e) {
    this.setData({
      'form.contact': e.detail.value
    })
  },

  // 选择图片
  chooseImage() {
    const { images } = this.data.form
    const count = 5 - images.length
    
    if (count <= 0) {
      wx.showToast({
        title: '最多上传5张图片',
        icon: 'none'
      })
      return
    }
    
    wx.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = [...images, ...res.tempFilePaths]
        this.setData({
          'form.images': newImages
        })
      }
    })
  },

  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset
    wx.previewImage({
      current: url,
      urls: this.data.form.images
    })
  },

  // 删除图片
  deleteImage(e) {
    const { index } = e.currentTarget.dataset
    const images = [...this.data.form.images]
    images.splice(index, 1)
    this.setData({
      'form.images': images
    })
  },

  // 提交反馈
  async submitFeedback() {
    const { form, submitting } = this.data
    
    if (submitting) return
    
    // 验证
    if (!form.title || form.title.trim().length < 5) {
      wx.showToast({
        title: '标题至少5个字符',
        icon: 'none'
      })
      return
    }
    
    if (!form.content || form.content.trim().length < 10) {
      wx.showToast({
        title: '内容至少10个字符',
        icon: 'none'
      })
      return
    }
    
    this.setData({ submitting: true })
    
    try {
      // TODO: 如果有图片，需要先上传图片获取URL
      const imageUrls = form.images // 暂时直接使用本地路径，实际需要上传
      
      await request({
        url: '/feedback',
        method: 'POST',
        data: {
          type: form.type,
          title: form.title.trim(),
          content: form.content.trim(),
          contact: form.contact.trim(),
          images: imageUrls,
          platform: 'miniprogram',
          version: '1.8.0',
          deviceInfo: this.deviceInfo
        }
      })
      
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      })
      
      // 重置表单
      this.setData({
        form: {
          type: 'bug',
          title: '',
          content: '',
          contact: '',
          images: []
        },
        submitting: false
      })
      
      // 切换到"我的反馈"Tab
      setTimeout(() => {
        this.setData({ currentTab: 1 })
        this.loadMyFeedbacks()
      }, 1500)
      
    } catch (error) {
      console.error('提交反馈失败:', error)
      this.setData({ submitting: false })
      
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      })
    }
  },

  // 加载我的反馈列表
  async loadMyFeedbacks() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const res = await request({
        url: '/feedback/my',
        method: 'GET'
      })
      
      const feedbacks = (res.data?.feedbacks || res.feedbacks || []).map(item => ({
        ...item,
        statusText: this.getStatusText(item.status),
        statusColor: this.getStatusColor(item.status),
        timeText: this.formatTime(item.createdAt)
      }))
      
      this.setData({
        myFeedbacks: feedbacks,
        loading: false
      })
      
    } catch (error) {
      console.error('加载反馈失败:', error)
      this.setData({ loading: false })
      
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  // 获取状态文本
  getStatusText(status) {
    const map = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      closed: '已关闭'
    }
    return map[status] || status
  },

  // 获取状态颜色
  getStatusColor(status) {
    const map = {
      pending: 'warning',
      processing: 'primary',
      resolved: 'success',
      closed: 'info'
    }
    return map[status] || 'info'
  },

  // 格式化时间
  formatTime(dateString) {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    
    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`
    } else if (diff < 7 * day) {
      return `${Math.floor(diff / day)}天前`
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
  },

  // 查看反馈详情
  viewFeedbackDetail(e) {
    const { id } = e.currentTarget.dataset
    // TODO: 跳转到反馈详情页
    wx.showToast({
      title: '反馈详情功能开发中',
      icon: 'none'
    })
  },

  // 删除反馈
  deleteFeedback(e) {
    e.stopPropagation()
    const { id, index } = e.currentTarget.dataset
    
    wx.showModal({
      title: '提示',
      content: '确定要删除这条反馈吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request({
              url: `/feedback/${id}`,
              method: 'DELETE'
            })
            
            const feedbacks = [...this.data.myFeedbacks]
            feedbacks.splice(index, 1)
            
            this.setData({ myFeedbacks: feedbacks })
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
          } catch (error) {
            wx.showToast({
              title: error.message || '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }
})
