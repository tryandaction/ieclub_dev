// pages/topic-detail/topic-detail.js
import request from '../../utils/request'

const typeConfig = {
  offer: { label: '我来讲', color: '#8b5cf6', icon: '🎤' },
  demand: { label: '想听', color: '#06b6d4', icon: '👂' },
  project: { label: '项目', color: '#10b981', icon: '🚀' },
  share: { label: '分享', color: '#f59e0b', icon: '💡' }
}

Page({
  data: {
    topic: null,
    comments: [],
    loading: true,
    commentLoading: false,
    commentContent: '',
    replyTo: null,
    submitting: false,
    isLogin: false,
    currentUserId: null,
    page: 1,
    hasMore: true,
    typeConfig
  },

  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    
    this.topicId = id
    this.checkLogin()
    this.loadTopicDetail()
    this.loadComments()
  },

  onPullDownRefresh() {
    this.loadTopicDetail()
    this.loadComments(true)
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.commentLoading) {
      this.loadComments()
    }
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    const user = wx.getStorageSync('user') || wx.getStorageSync('userInfo')
    this.setData({
      isLogin: !!token,
      currentUserId: user?.id || null
    })
  },

  // 加载话题详情
  async loadTopicDetail() {
    try {
      this.setData({ loading: true })
      
      const res = await request(`/topics/${this.topicId}`, { 
        method: 'GET',
        loading: false 
      })
      
      const topic = res.data || res
      
      // 处理作者头像
      if (topic.author && topic.author.avatar) {
        if (topic.author.avatar.indexOf('http') !== 0) {
          topic.author.avatar = 'https://ieclub.online' + topic.author.avatar
        }
      }
      
      // 获取类型配置
      const config = typeConfig[topic.type] || typeConfig.share
      topic.typeLabel = config.label
      topic.typeColor = config.color
      topic.typeIcon = config.icon
      
      // 格式化时间
      topic.formattedTime = this.formatTime(topic.createdAt)
      
      this.setData({ 
        topic,
        loading: false 
      })
      
      wx.setNavigationBarTitle({ title: topic.title || '话题详情' })
      
    } catch (error) {
      console.error('加载话题详情失败:', error)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  // 加载评论列表
  async loadComments(isRefresh = false) {
    if (this.data.commentLoading) return
    
    const page = isRefresh ? 1 : this.data.page
    
    try {
      this.setData({ commentLoading: true })
      
      const res = await request('/comments', {
        method: 'GET',
        data: { 
          topicId: this.topicId,
          page,
          limit: 20
        },
        loading: false
      })
      
      let comments = res.data?.comments || res.comments || []
      
      // 处理评论数据
      comments = comments.map(comment => {
        // 处理头像
        if (comment.author && comment.author.avatar) {
          if (comment.author.avatar.indexOf('http') !== 0) {
            comment.author.avatar = 'https://ieclub.online' + comment.author.avatar
          }
        }
        // 格式化时间
        comment.formattedTime = this.formatTime(comment.createdAt)
        return comment
      })
      
      this.setData({
        comments: isRefresh ? comments : [...this.data.comments, ...comments],
        page: page + 1,
        hasMore: comments.length >= 20,
        commentLoading: false
      })
      
    } catch (error) {
      console.error('加载评论失败:', error)
      this.setData({ commentLoading: false })
    }
  },

  // 点赞话题
  async handleLike() {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    
    const { topic } = this.data
    const newIsLiked = !topic.isLiked
    
    // 乐观更新
    this.setData({
      'topic.isLiked': newIsLiked,
      'topic.likesCount': topic.likesCount + (newIsLiked ? 1 : -1)
    })
    
    try {
      await request(`/topics/${this.topicId}/like`, { method: 'POST' })
    } catch (error) {
      // 回滚
      this.setData({
        'topic.isLiked': !newIsLiked,
        'topic.likesCount': topic.likesCount
      })
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 收藏话题
  async handleBookmark() {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    
    const { topic } = this.data
    const newIsBookmarked = !topic.isBookmarked
    
    // 乐观更新
    this.setData({
      'topic.isBookmarked': newIsBookmarked,
      'topic.bookmarksCount': (topic.bookmarksCount || 0) + (newIsBookmarked ? 1 : -1)
    })
    
    try {
      await request(`/topics/${this.topicId}/bookmark`, { method: 'POST' })
      wx.showToast({ 
        title: newIsBookmarked ? '收藏成功' : '取消收藏', 
        icon: 'success' 
      })
    } catch (error) {
      // 回滚
      this.setData({
        'topic.isBookmarked': !newIsBookmarked,
        'topic.bookmarksCount': topic.bookmarksCount
      })
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 输入评论
  onCommentInput(e) {
    this.setData({ commentContent: e.detail.value })
  },

  // 发表评论
  async submitComment() {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    
    const content = this.data.commentContent.trim()
    if (!content) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }
    
    this.setData({ submitting: true })
    
    try {
      const data = {
        topicId: this.topicId,
        content
      }
      
      if (this.data.replyTo) {
        data.parentId = this.data.replyTo.id
      }
      
      await request('/comments', {
        method: 'POST',
        data
      })
      
      wx.showToast({ title: '评论成功', icon: 'success' })
      
      // 清空输入并刷新评论
      this.setData({
        commentContent: '',
        replyTo: null,
        submitting: false
      })
      
      // 更新评论数
      this.setData({
        'topic.commentsCount': (this.data.topic.commentsCount || 0) + 1
      })
      
      // 刷新评论列表
      this.loadComments(true)
      
    } catch (error) {
      console.error('评论失败:', error)
      this.setData({ submitting: false })
      wx.showToast({ title: error.message || '评论失败', icon: 'none' })
    }
  },

  // 回复评论
  replyComment(e) {
    const { comment } = e.currentTarget.dataset
    this.setData({
      replyTo: comment,
      commentContent: `@${comment.author?.nickname || '用户'} `
    })
  },

  // 取消回复
  cancelReply() {
    this.setData({
      replyTo: null,
      commentContent: ''
    })
  },

  // 点赞评论
  async likeComment(e) {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    
    const { id, index } = e.currentTarget.dataset
    const comments = [...this.data.comments]
    const comment = comments[index]
    const newIsLiked = !comment.isLiked
    
    // 乐观更新
    comment.isLiked = newIsLiked
    comment.likesCount = (comment.likesCount || 0) + (newIsLiked ? 1 : -1)
    this.setData({ comments })
    
    try {
      await request(`/comments/${id}/like`, { method: 'POST' })
    } catch (error) {
      // 回滚
      comment.isLiked = !newIsLiked
      comment.likesCount = (comment.likesCount || 0) + (newIsLiked ? -1 : 1)
      this.setData({ comments })
    }
  },

  // 删除评论
  deleteComment(e) {
    const { id, index } = e.currentTarget.dataset
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request(`/comments/${id}`, { method: 'DELETE' })
            
            const comments = [...this.data.comments]
            comments.splice(index, 1)
            
            this.setData({ 
              comments,
              'topic.commentsCount': Math.max(0, (this.data.topic.commentsCount || 0) - 1)
            })
            
            wx.showToast({ title: '删除成功', icon: 'success' })
          } catch (error) {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 跳转到作者主页
  goToAuthor() {
    const authorId = this.data.topic?.author?.id
    if (authorId) {
      wx.navigateTo({
        url: `/pages/user-profile/index?userId=${authorId}`
      })
    }
  },

  // 分享
  onShareAppMessage() {
    const { topic } = this.data
    return {
      title: topic?.title || 'IEClub话题',
      path: `/pages/topic-detail/topic-detail?id=${this.topicId}`
    }
  },

  // 复制链接
  copyLink(e) {
    const link = e.currentTarget.dataset.link
    if (link) {
      wx.setClipboardData({
        data: link,
        success: () => {
          wx.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          })
        }
      })
    }
  },

  // 想听
  handleWantHear() {
    this.quickAction('want_hear')
  },

  // 我能讲
  handleCanTell() {
    this.quickAction('can_tell')
  },

  // 感兴趣
  handleInterested() {
    this.quickAction('interested')
  },

  // 快速操作
  async quickAction(actionType) {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    try {
      const res = await request(`/topics/${this.topicId}/quick-action`, {
        method: 'POST',
        data: { actionType }
      })

      const data = res.data || res
      
      // 更新本地状态
      const updates = {}
      if (actionType === 'want_hear') {
        updates['topic.userWantHear'] = data.userAction
        updates['topic.wantToHearCount'] = data.count
      } else if (actionType === 'can_tell') {
        updates['topic.userCanTell'] = data.userAction
        updates['topic.canTellCount'] = data.count
      } else if (actionType === 'interested') {
        updates['topic.userInterested'] = data.userAction
        updates['topic.interestedCount'] = data.count
      }
      
      this.setData(updates)
      
      const messages = {
        want_hear: data.userAction ? '已标记想听 👂' : '已取消',
        can_tell: data.userAction ? '已标记我能讲 🎤' : '已取消',
        interested: data.userAction ? '已感兴趣 🚀' : '已取消'
      }
      wx.showToast({ title: messages[actionType], icon: 'none' })
    } catch (error) {
      console.error('快速操作失败:', error)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 格式化时间
  formatTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
    
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
})
