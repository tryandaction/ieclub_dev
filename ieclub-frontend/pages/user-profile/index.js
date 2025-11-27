// pages/user-profile/index.js
// 用户主页页面（从社区点击用户进入）
import { getProfile, getUserPosts, getUserStats } from '../../api/profile'
import request from '../../utils/request'

Page({
  data: {
    userId: '',
    profile: null,
    posts: [],
    stats: null,
    loading: true,
    activeTab: 'posts', // posts, about, achievements
    isOwner: false,
    isFollowing: false
  },

  onLoad(options) {
    const { userId } = options
    if (!userId) {
      wx.showToast({
        title: '用户ID无效',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    this.setData({ userId })
    this.loadProfile()
    this.loadPosts()
    this.loadStats()
  },

  // 加载用户主页
  async loadProfile() {
    this.setData({ loading: true })

    try {
      const res = await getProfile(this.data.userId)

      const profile = res.data || res
      const currentUser = wx.getStorageSync('userInfo')
      const isOwner = currentUser && currentUser.id === this.data.userId

      this.setData({
        profile,
        isOwner,
        isFollowing: profile.isFollowing || false,
        loading: false
      })

      wx.setNavigationBarTitle({
        title: `${profile.nickname || '用户'}的主页`
      })
    } catch (error) {
      console.error('加载用户主页失败:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  // 加载用户发布
  async loadPosts() {
    try {
      const res = await getUserPosts(this.data.userId, {
        page: 1,
        pageSize: 20
      })

      const data = res.data || res
      this.setData({
        posts: data.posts || []
      })
    } catch (error) {
      console.error('加载发布内容失败:', error)
    }
  },

  // 加载统计数据
  async loadStats() {
    try {
      const res = await getUserStats(this.data.userId)

      const stats = res.data || res
      this.setData({ stats })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  },

  // 切换Tab
  switchTab(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({ activeTab: tab })
  },

  // 关注/取消关注
  async toggleFollow() {
    const { isFollowing, profile } = this.data

    try {
      await request(`/users/${profile.id}/${isFollowing ? 'unfollow' : 'follow'}`, {
        method: 'POST'
      })

      this.setData({
        isFollowing: !isFollowing,
        'profile.followerCount': (profile.followerCount || 0) + (isFollowing ? -1 : 1)
      })

      wx.showToast({
        title: isFollowing ? '已取消关注' : '关注成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('关注操作失败:', error)
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      })
    }
  },

  // 复制社交链接
  copyText(e) {
    const { text, name } = e.currentTarget.dataset
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: `${name}已复制`,
          icon: 'success'
        })
      }
    })
  },

  // 跳转到话题详情
  goToTopic(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/topic-detail/index?id=${id}`
    })
  },

  // 跳转到关注列表
  goToFollowing() {
    wx.navigateTo({
      url: `/pages/following/index?userId=${this.data.userId}`
    })
  },

  // 跳转到粉丝列表
  goToFollowers() {
    wx.navigateTo({
      url: `/pages/followers/index?userId=${this.data.userId}`
    })
  },

  // 跳转到编辑资料
  goToEditProfile() {
    wx.navigateTo({
      url: '/pages/edit-profile/index'
    })
  },

  // 发送私信
  async sendMessage() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    try {
      // 获取或创建会话
      const res = await request(`/messages/conversation/${this.data.userId}`, {
        method: 'GET'
      })
      
      const data = res.data || res
      const { profile } = this.data
      
      wx.navigateTo({
        url: `/pages/chat/index?conversationId=${data.conversationId}&userId=${this.data.userId}&nickname=${encodeURIComponent(profile.nickname || '')}&avatar=${encodeURIComponent(profile.avatar || '')}`
      })
    } catch (error) {
      console.error('获取会话失败:', error)
      wx.showToast({ title: '无法发起对话', icon: 'none' })
    }
  }
})
