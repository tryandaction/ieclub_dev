// pages/publish-activity/index.js
import { createActivity } from '../../api/activity'

// 活动分类选项
const categoryOptions = [
  { value: 'lecture', label: '讲座分享', icon: '🎤' },
  { value: 'workshop', label: '工作坊', icon: '🔧' },
  { value: 'competition', label: '比赛活动', icon: '🏆' },
  { value: 'social', label: '社交联谊', icon: '🤝' },
  { value: 'outdoor', label: '户外活动', icon: '🏕️' },
  { value: 'other', label: '其他', icon: '📌' },
]

Page({
  data: {
    categoryOptions,
    today: '',
    
    // 表单数据
    title: '',
    description: '',
    category: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    maxParticipants: '',
    tags: [],
    tagInput: '',
    
    submitting: false
  },

  onLoad() {
    // 设置今天日期
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    this.setData({ today: todayStr })
  },

  // 输入处理
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value })
  },

  selectCategory(e) {
    this.setData({ category: e.currentTarget.dataset.value })
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value })
  },

  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value })
  },

  onStartTimeChange(e) {
    this.setData({ startTime: e.detail.value })
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value })
  },

  onEndTimeChange(e) {
    this.setData({ endTime: e.detail.value })
  },

  onMaxParticipantsInput(e) {
    this.setData({ maxParticipants: e.detail.value })
  },

  onTagInput(e) {
    this.setData({ tagInput: e.detail.value })
  },

  addTag() {
    const tag = this.data.tagInput.trim()
    if (!tag) return
    if (this.data.tags.includes(tag)) {
      wx.showToast({ title: '标签已存在', icon: 'none' })
      return
    }
    if (this.data.tags.length >= 5) {
      wx.showToast({ title: '最多5个标签', icon: 'none' })
      return
    }
    this.setData({
      tags: [...this.data.tags, tag],
      tagInput: ''
    })
  },

  removeTag(e) {
    const index = e.currentTarget.dataset.index
    const tags = [...this.data.tags]
    tags.splice(index, 1)
    this.setData({ tags })
  },

  // 验证表单
  validateForm() {
    const { title, description, category, location, startDate, startTime, endDate, endTime } = this.data
    
    if (!title.trim()) {
      wx.showToast({ title: '请输入活动标题', icon: 'none' })
      return false
    }
    if (title.length < 5) {
      wx.showToast({ title: '标题至少5个字', icon: 'none' })
      return false
    }
    if (!description.trim()) {
      wx.showToast({ title: '请输入活动描述', icon: 'none' })
      return false
    }
    if (description.length < 20) {
      wx.showToast({ title: '描述至少20个字', icon: 'none' })
      return false
    }
    if (!category) {
      wx.showToast({ title: '请选择活动分类', icon: 'none' })
      return false
    }
    if (!location.trim()) {
      wx.showToast({ title: '请输入活动地点', icon: 'none' })
      return false
    }
    if (!startDate || !startTime) {
      wx.showToast({ title: '请选择开始时间', icon: 'none' })
      return false
    }
    if (!endDate || !endTime) {
      wx.showToast({ title: '请选择结束时间', icon: 'none' })
      return false
    }

    // 验证时间
    const start = new Date(`${startDate}T${startTime}`)
    const end = new Date(`${endDate}T${endTime}`)
    const now = new Date()

    if (start < now) {
      wx.showToast({ title: '开始时间不能早于当前', icon: 'none' })
      return false
    }
    if (end <= start) {
      wx.showToast({ title: '结束时间必须晚于开始', icon: 'none' })
      return false
    }

    return true
  },

  // 提交表单
  async handleSubmit() {
    if (!this.validateForm()) return

    const { title, description, category, location, startDate, startTime, endDate, endTime, maxParticipants, tags } = this.data

    try {
      this.setData({ submitting: true })
      wx.showLoading({ title: '发布中...' })

      const postData = {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        startTime: new Date(`${startDate}T${startTime}`).toISOString(),
        endTime: new Date(`${endDate}T${endTime}`).toISOString(),
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : 0,
        tags,
        images: []
      }

      await createActivity(postData)

      wx.hideLoading()
      wx.showToast({
        title: '发布成功 🎉',
        icon: 'success',
        duration: 1500
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      wx.hideLoading()
      console.error('发布失败:', error)
      wx.showToast({
        title: error.message || '发布失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
