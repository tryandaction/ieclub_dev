// pages/edit-profile/index.js
import { request } from '../../utils/request'

Page({
  data: {
    // 表单数据
    form: {
      nickname: '',
      avatar: '',
      gender: '',
      bio: '',
      coverImage: '',
      motto: '',
      introduction: '',
      website: '',
      github: '',
      bilibili: '',
      wechat: '',
      school: '',
      major: '',
      grade: '',
      skills: [],
      interests: []
    },
    
    // 性别选项
    genderOptions: ['保密', '男', '女'],
    genderMap: ['', 'male', 'female'],
    genderIndex: 0,
    
    // 标签输入
    skillInput: '',
    interestInput: '',
    
    loading: false,
    submitting: false
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '编辑资料' })
    this.loadUserProfile()
  },

  // 加载用户信息
  async loadUserProfile() {
    this.setData({ loading: true })
    
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (!userInfo || !userInfo.id) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }
      
      const res = await request({
        url: `/profile/${userInfo.id}`,
        method: 'GET'
      })
      
      const profile = res.data || res
      
      // 找到性别索引
      const genderIndex = this.data.genderMap.indexOf(profile.gender || '')
      
      this.setData({
        form: {
          nickname: profile.nickname || '',
          avatar: profile.avatar || '',
          gender: profile.gender || '',
          bio: profile.bio || '',
          coverImage: profile.coverImage || '',
          motto: profile.motto || '',
          introduction: profile.introduction || '',
          website: profile.website || '',
          github: profile.github || '',
          bilibili: profile.bilibili || '',
          wechat: profile.wechat || '',
          school: profile.school || '',
          major: profile.major || '',
          grade: profile.grade || '',
          skills: profile.skills || [],
          interests: profile.interests || []
        },
        genderIndex: genderIndex === -1 ? 0 : genderIndex,
        loading: false
      })
    } catch (error) {
      console.error('加载用户信息失败:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({
      'form.nickname': e.detail.value
    })
  },

  // 输入简介
  onBioInput(e) {
    this.setData({
      'form.bio': e.detail.value
    })
  },

  // 选择性别
  onGenderChange(e) {
    const index = e.detail.value
    this.setData({
      genderIndex: index,
      'form.gender': this.data.genderMap[index]
    })
  },

  // 输入座右铭
  onMottoInput(e) {
    this.setData({
      'form.motto': e.detail.value
    })
  },

  // 输入详细介绍
  onIntroductionInput(e) {
    this.setData({
      'form.introduction': e.detail.value
    })
  },

  // 输入社交链接
  onWebsiteInput(e) {
    this.setData({
      'form.website': e.detail.value
    })
  },

  onGithubInput(e) {
    this.setData({
      'form.github': e.detail.value
    })
  },

  onBilibiliInput(e) {
    this.setData({
      'form.bilibili': e.detail.value
    })
  },

  onWechatInput(e) {
    this.setData({
      'form.wechat': e.detail.value
    })
  },

  // 输入学校信息
  onSchoolInput(e) {
    this.setData({
      'form.school': e.detail.value
    })
  },

  onMajorInput(e) {
    this.setData({
      'form.major': e.detail.value
    })
  },

  onGradeInput(e) {
    this.setData({
      'form.grade': e.detail.value
    })
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // TODO: 上传图片到服务器
        const tempPath = res.tempFilePaths[0]
        this.setData({
          'form.avatar': tempPath
        })
        wx.showToast({
          title: '头像已选择',
          icon: 'success'
        })
      }
    })
  },

  // 选择封面图
  chooseCover() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // TODO: 上传图片到服务器
        const tempPath = res.tempFilePaths[0]
        this.setData({
          'form.coverImage': tempPath
        })
        wx.showToast({
          title: '封面已选择',
          icon: 'success'
        })
      }
    })
  },

  // 技能标签输入
  onSkillInput(e) {
    this.setData({
      skillInput: e.detail.value
    })
  },

  // 添加技能标签
  addSkill() {
    const skill = this.data.skillInput.trim()
    if (!skill) {
      wx.showToast({
        title: '请输入技能',
        icon: 'none'
      })
      return
    }
    
    if (this.data.form.skills.includes(skill)) {
      wx.showToast({
        title: '技能已存在',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      'form.skills': [...this.data.form.skills, skill],
      skillInput: ''
    })
  },

  // 删除技能标签
  deleteSkill(e) {
    const { index } = e.currentTarget.dataset
    const skills = [...this.data.form.skills]
    skills.splice(index, 1)
    this.setData({
      'form.skills': skills
    })
  },

  // 兴趣标签输入
  onInterestInput(e) {
    this.setData({
      interestInput: e.detail.value
    })
  },

  // 添加兴趣标签
  addInterest() {
    const interest = this.data.interestInput.trim()
    if (!interest) {
      wx.showToast({
        title: '请输入兴趣',
        icon: 'none'
      })
      return
    }
    
    if (this.data.form.interests.includes(interest)) {
      wx.showToast({
        title: '兴趣已存在',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      'form.interests': [...this.data.form.interests, interest],
      interestInput: ''
    })
  },

  // 删除兴趣标签
  deleteInterest(e) {
    const { index } = e.currentTarget.dataset
    const interests = [...this.data.form.interests]
    interests.splice(index, 1)
    this.setData({
      'form.interests': interests
    })
  },

  // 保存资料
  async saveProfile() {
    const { form, submitting } = this.data
    
    if (submitting) return
    
    // 验证
    if (!form.nickname || form.nickname.trim().length < 2) {
      wx.showToast({
        title: '昵称至少2个字符',
        icon: 'none'
      })
      return
    }
    
    this.setData({ submitting: true })
    
    try {
      await request({
        url: '/profile',
        method: 'PUT',
        data: {
          nickname: form.nickname.trim(),
          avatar: form.avatar,
          gender: form.gender,
          bio: form.bio.trim(),
          coverImage: form.coverImage,
          motto: form.motto.trim(),
          introduction: form.introduction.trim(),
          website: form.website.trim(),
          github: form.github.trim(),
          bilibili: form.bilibili.trim(),
          wechat: form.wechat.trim(),
          school: form.school.trim(),
          major: form.major.trim(),
          grade: form.grade.trim(),
          skills: form.skills,
          interests: form.interests
        }
      })
      
      // 更新本地存储的用户信息
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        userInfo.nickname = form.nickname
        userInfo.avatar = form.avatar
        wx.setStorageSync('userInfo', userInfo)
      }
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 延迟返回
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      
    } catch (error) {
      console.error('保存失败:', error)
      this.setData({ submitting: false })
      
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      })
    }
  }
})
