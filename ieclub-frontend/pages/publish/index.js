// pages/publish/index.js
import request from '../../utils/request'

// 板块类型配置
const typeConfig = {
  demand: {
    label: '我想听',
    icon: '👂',
    color: '#06b6d4',
    description: '发布你想学习的话题，找到能教你的人',
    placeholder: {
      title: '例如：想学Python数据分析',
      content: '详细描述你想学习的内容、你的基础水平、期望达到的效果...'
    }
  },
  offer: {
    label: '我来讲',
    icon: '🎤',
    color: '#8b5cf6',
    description: '分享你的知识，满15人可开讲',
    placeholder: {
      title: '例如：Python数据分析入门',
      content: '课程大纲、你的专业背景、适合什么基础的同学...'
    }
  },
  project: {
    label: '项目',
    icon: '🚀',
    color: '#10b981',
    description: '招募项目队友，一起创造',
    placeholder: {
      title: '例如：校园二手交易小程序',
      content: '项目介绍、目标、当前进展、需要什么样的队友...'
    }
  },
  share: {
    label: '分享',
    icon: '💡',
    color: '#f59e0b',
    description: '分享知识、经验、资源',
    placeholder: {
      title: '例如：期末复习资料分享',
      content: '分享的内容、适合谁、如何获取...'
    }
  }
}

// 预设标签
const presetTags = {
  demand: ['编程', '设计', '考研', '语言', '数学', '物理', '经济', '法律'],
  offer: ['Python', 'Java', 'UI设计', '摄影', '视频剪辑', '写作', '演讲'],
  project: ['小程序', 'APP', '网站', '比赛', '创业', '公益', '调研'],
  share: ['学习资料', '求职经验', '考试攻略', '工具推荐', '读书笔记']
}

// 项目阶段选项
const projectStages = ['创意阶段', '开发中', '已上线', '招募中']

// 时长选项
const durationOptions = ['30分钟', '1小时', '2小时', '半天', '一天', '多天']

Page({
  data: {
    publishType: 'demand',
    typeConfig,
    presetTags: presetTags.demand,
    projectStages,
    durationOptions,
    
    // 通用字段
    title: '',
    content: '',
    tags: [],
    tagInput: '',
    images: [],
    
    // 我想听/我来讲 特有
    duration: '',
    targetAudience: '',
    threshold: 15,
    
    // 项目特有
    projectStage: '',
    teamSize: '',
    lookingForRoles: [],
    roleInput: '',
    skillsNeeded: [],
    skillInput: '',
    website: '',
    github: '',
    contactInfo: '',
    
    // 状态
    submitting: false,
    isLogin: false
  },

  onLoad(options) {
    // 检查登录状态
    const token = wx.getStorageSync('token')
    this.setData({ isLogin: !!token })
    
    // 如果从特定板块进入
    if (options.type && typeConfig[options.type]) {
      this.setData({ 
        publishType: options.type,
        presetTags: presetTags[options.type]
      })
    }
  },

  onShow() {
    // 每次显示检查登录状态
    const token = wx.getStorageSync('token')
    this.setData({ isLogin: !!token })
  },

  // 切换发布类型
  switchType(e) {
    const { type } = e.currentTarget.dataset
    this.setData({ 
      publishType: type,
      presetTags: presetTags[type],
      // 清空特定类型的字段
      projectStage: '',
      teamSize: '',
      lookingForRoles: [],
      skillsNeeded: [],
      duration: '',
      targetAudience: ''
    })
  },

  // 输入处理
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  onTagInput(e) {
    this.setData({ tagInput: e.detail.value })
  },

  // 添加标签
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

  // 添加预设标签
  addPresetTag(e) {
    const { tag } = e.currentTarget.dataset
    if (this.data.tags.includes(tag)) return
    if (this.data.tags.length >= 5) {
      wx.showToast({ title: '最多5个标签', icon: 'none' })
      return
    }
    this.setData({
      tags: [...this.data.tags, tag]
    })
  },

  // 移除标签
  removeTag(e) {
    const { index } = e.currentTarget.dataset
    const tags = [...this.data.tags]
    tags.splice(index, 1)
    this.setData({ tags })
  },

  // 我来讲/我想听 字段
  onDurationChange(e) {
    this.setData({ duration: durationOptions[e.detail.value] })
  },

  onTargetAudienceInput(e) {
    this.setData({ targetAudience: e.detail.value })
  },

  onThresholdInput(e) {
    const value = parseInt(e.detail.value) || 15
    this.setData({ threshold: Math.max(5, Math.min(100, value)) })
  },

  // 项目字段
  onProjectStageChange(e) {
    this.setData({ projectStage: projectStages[e.detail.value] })
  },

  onTeamSizeInput(e) {
    this.setData({ teamSize: e.detail.value })
  },

  onRoleInput(e) {
    this.setData({ roleInput: e.detail.value })
  },

  addRole() {
    const role = this.data.roleInput.trim()
    if (!role) return
    if (this.data.lookingForRoles.includes(role)) return
    this.setData({
      lookingForRoles: [...this.data.lookingForRoles, role],
      roleInput: ''
    })
  },

  removeRole(e) {
    const { index } = e.currentTarget.dataset
    const roles = [...this.data.lookingForRoles]
    roles.splice(index, 1)
    this.setData({ lookingForRoles: roles })
  },

  onSkillInput(e) {
    this.setData({ skillInput: e.detail.value })
  },

  addSkill() {
    const skill = this.data.skillInput.trim()
    if (!skill) return
    if (this.data.skillsNeeded.includes(skill)) return
    this.setData({
      skillsNeeded: [...this.data.skillsNeeded, skill],
      skillInput: ''
    })
  },

  removeSkill(e) {
    const { index } = e.currentTarget.dataset
    const skills = [...this.data.skillsNeeded]
    skills.splice(index, 1)
    this.setData({ skillsNeeded: skills })
  },

  onWebsiteInput(e) {
    this.setData({ website: e.detail.value })
  },

  onGithubInput(e) {
    this.setData({ github: e.detail.value })
  },

  onContactInput(e) {
    this.setData({ contactInfo: e.detail.value })
  },

  // 选择图片
  chooseImage() {
    const count = 9 - this.data.images.length
    if (count <= 0) {
      wx.showToast({ title: '最多9张图片', icon: 'none' })
      return
    }
    
    wx.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          images: [...this.data.images, ...res.tempFilePaths]
        })
      }
    })
  },

  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset
    wx.previewImage({
      current: url,
      urls: this.data.images
    })
  },

  // 删除图片
  removeImage(e) {
    const { index } = e.currentTarget.dataset
    const images = [...this.data.images]
    images.splice(index, 1)
    this.setData({ images })
  },

  // 验证表单
  validateForm() {
    const { publishType, title, content } = this.data
    
    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' })
      return false
    }
    
    if (title.length < 5) {
      wx.showToast({ title: '标题至少5个字', icon: 'none' })
      return false
    }
    
    if (!content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return false
    }
    
    if (content.length < 10) {
      wx.showToast({ title: '内容至少10个字', icon: 'none' })
      return false
    }
    
    // 项目板块额外验证
    if (publishType === 'project') {
      if (!this.data.projectStage) {
        wx.showToast({ title: '请选择项目阶段', icon: 'none' })
        return false
      }
    }
    
    return true
  },

  // 上传图片
  async uploadImages() {
    const uploadedUrls = []
    
    for (const filePath of this.data.images) {
      // 如果已经是URL，跳过上传
      if (filePath.startsWith('http')) {
        uploadedUrls.push(filePath)
        continue
      }
      
      try {
        const token = wx.getStorageSync('token')
        const res = await new Promise((resolve, reject) => {
          wx.uploadFile({
            url: 'https://ieclub.online/api/upload/image',
            filePath,
            name: 'file',
            header: { 'Authorization': `Bearer ${token}` },
            success: resolve,
            fail: reject
          })
        })
        
        const data = JSON.parse(res.data)
        if (data.success && data.data?.url) {
          uploadedUrls.push(data.data.url)
        }
      } catch (error) {
        console.error('图片上传失败:', error)
      }
    }
    
    return uploadedUrls
  },

  // 发布
  async publish() {
    // 检查登录
    if (!this.data.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再发布',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return
    }
    
    // 验证表单
    if (!this.validateForm()) return
    
    this.setData({ submitting: true })
    
    try {
      // 上传图片
      let imageUrls = []
      if (this.data.images.length > 0) {
        wx.showLoading({ title: '上传图片中...' })
        imageUrls = await this.uploadImages()
        wx.hideLoading()
      }
      
      // 构建请求数据
      const { publishType, title, content, tags, duration, targetAudience, threshold,
              projectStage, teamSize, lookingForRoles, skillsNeeded, website, github, contactInfo } = this.data
      
      const postData = {
        title: title.trim(),
        content: content.trim(),
        category: publishType,
        topicType: publishType,
        tags,
        images: imageUrls
      }
      
      // 根据类型添加特定字段
      if (publishType === 'demand' || publishType === 'offer') {
        if (duration) postData.duration = duration
        if (targetAudience) postData.targetAudience = targetAudience
        if (publishType === 'offer') {
          postData.threshold = threshold
        }
      }
      
      if (publishType === 'project') {
        if (projectStage) postData.projectStage = projectStage
        if (teamSize) postData.teamSize = parseInt(teamSize) || null
        if (lookingForRoles.length) postData.lookingForRoles = lookingForRoles
        if (skillsNeeded.length) postData.skillsNeeded = skillsNeeded
        if (website) postData.website = website
        if (github) postData.github = github
        if (contactInfo) postData.contactInfo = contactInfo
      }
      
      // 发送请求
      await request('/topics', {
        method: 'POST',
        data: postData
      })
      
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      })
      
      // 清空表单
      this.resetForm()
      
      // 跳转到广场
      setTimeout(() => {
        wx.switchTab({ url: '/pages/plaza/index' })
      }, 1500)
      
    } catch (error) {
      console.error('发布失败:', error)
      wx.showToast({
        title: error.message || '发布失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 重置表单
  resetForm() {
    this.setData({
      title: '',
      content: '',
      tags: [],
      tagInput: '',
      images: [],
      duration: '',
      targetAudience: '',
      threshold: 15,
      projectStage: '',
      teamSize: '',
      lookingForRoles: [],
      roleInput: '',
      skillsNeeded: [],
      skillInput: '',
      website: '',
      github: '',
      contactInfo: ''
    })
  },

  // 保存草稿
  saveDraft() {
    const draftData = {
      publishType: this.data.publishType,
      title: this.data.title,
      content: this.data.content,
      tags: this.data.tags,
      duration: this.data.duration,
      targetAudience: this.data.targetAudience,
      threshold: this.data.threshold,
      projectStage: this.data.projectStage,
      teamSize: this.data.teamSize,
      lookingForRoles: this.data.lookingForRoles,
      skillsNeeded: this.data.skillsNeeded,
      website: this.data.website,
      github: this.data.github,
      contactInfo: this.data.contactInfo,
      savedAt: new Date().toISOString()
    }
    
    wx.setStorageSync('publishDraft', draftData)
    wx.showToast({ title: '草稿已保存', icon: 'success' })
  },

  // 加载草稿
  loadDraft() {
    const draft = wx.getStorageSync('publishDraft')
    if (draft) {
      wx.showModal({
        title: '发现草稿',
        content: '是否恢复上次编辑的内容？',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              ...draft,
              presetTags: presetTags[draft.publishType] || presetTags.demand
            })
          }
        }
      })
    }
  }
})

