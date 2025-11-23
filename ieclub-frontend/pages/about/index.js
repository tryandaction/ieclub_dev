// pages/about/index.js
Page({
  data: {
    appInfo: {
      name: 'IEClub',
      version: '1.7.0',
      slogan: '连接创新者，共建创业生态',
      description: 'IEClub是南方科技大学创新创业俱乐部的官方社区平台，致力于为创新创业者提供交流、协作、学习的空间。'
    },
    
    features: [
      {
        icon: '💡',
        title: '话题广场',
        desc: '分享创意，讨论项目，寻找合作伙伴'
      },
      {
        icon: '🎉',
        title: '活动发布',
        desc: '组织活动，报名参与，扩展人脉'
      },
      {
        icon: '👥',
        title: '社交网络',
        desc: '关注感兴趣的用户，建立自己的圈子'
      },
      {
        icon: '🎯',
        title: '项目协作',
        desc: '发布需求或供给，匹配合适的团队成员'
      }
    ],
    
    team: [
      {
        role: '项目发起',
        name: '南方科技大学创新创业俱乐部',
        desc: '致力于培养学生的创新精神和创业能力'
      },
      {
        role: '技术支持',
        name: 'IEClub技术团队',
        desc: '全栈开发，持续迭代优化'
      }
    ],
    
    contact: {
      email: 'ieclub@sustech.edu.cn',
      website: 'https://ieclub.online',
      github: 'https://github.com/tryandaction/ieclub_dev'
    },
    
    stats: {
      users: '500+',
      topics: '1000+',
      activities: '100+'
    }
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '关于我们' })
  },

  // 复制文本
  copyText(e) {
    const { text } = e.currentTarget.dataset
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        })
      }
    })
  },

  // 打开外部链接
  openLink(e) {
    const { url } = e.currentTarget.dataset
    wx.showModal({
      title: '提示',
      content: '即将打开外部链接：' + url,
      confirmText: '继续',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: url,
            success: () => {
              wx.showToast({
                title: '链接已复制，请在浏览器中打开',
                icon: 'none',
                duration: 2000
              })
            }
          })
        }
      }
    })
  },

  // 联系我们
  contactUs() {
    wx.showModal({
      title: '联系我们',
      content: `邮箱：${this.data.contact.email}\n\n点击确定复制邮箱地址`,
      confirmText: '复制',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: this.data.contact.email,
            success: () => {
              wx.showToast({
                title: '邮箱已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  }
})
