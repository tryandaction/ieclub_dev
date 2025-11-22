// pages/settings/change-password/index.js
import { changePassword } from '../../../api/auth'

Page({
  data: {
    // 表单数据
    form: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    },

    // 表单错误
    errors: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    },

    // 密码显示状态
    showOldPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,

    // 加载状态
    loading: false
  },

  onLoad(options) {
    console.log('✅ [ChangePassword] 页面加载')
  },

  // ========== 输入处理 ==========

  /**
   * 旧密码输入
   */
  onOldPasswordInput(e) {
    this.setData({
      'form.oldPassword': e.detail.value,
      'errors.oldPassword': ''
    })
  },

  /**
   * 新密码输入
   */
  onNewPasswordInput(e) {
    this.setData({
      'form.newPassword': e.detail.value,
      'errors.newPassword': ''
    })
  },

  /**
   * 确认密码输入
   */
  onConfirmPasswordInput(e) {
    this.setData({
      'form.confirmPassword': e.detail.value,
      'errors.confirmPassword': ''
    })
  },

  // ========== 密码显示切换 ==========

  /**
   * 切换旧密码显示
   */
  toggleOldPassword() {
    this.setData({
      showOldPassword: !this.data.showOldPassword
    })
  },

  /**
   * 切换新密码显示
   */
  toggleNewPassword() {
    this.setData({
      showNewPassword: !this.data.showNewPassword
    })
  },

  /**
   * 切换确认密码显示
   */
  toggleConfirmPassword() {
    this.setData({
      showConfirmPassword: !this.data.showConfirmPassword
    })
  },

  // ========== 表单验证 ==========

  /**
   * 验证表单
   */
  validateForm() {
    const { oldPassword, newPassword, confirmPassword } = this.data.form
    const errors = {}
    let isValid = true

    // 验证旧密码
    if (!oldPassword) {
      errors.oldPassword = '请输入原密码'
      isValid = false
    }

    // 验证新密码
    if (!newPassword) {
      errors.newPassword = '请输入新密码'
      isValid = false
    } else if (newPassword.length < 8 || newPassword.length > 20) {
      errors.newPassword = '密码长度为8-20位'
      isValid = false
    } else if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      errors.newPassword = '密码必须包含字母和数字'
      isValid = false
    }

    // 验证确认密码
    if (!confirmPassword) {
      errors.confirmPassword = '请再次输入新密码'
      isValid = false
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = '两次密码不一致'
      isValid = false
    }

    // 检查新旧密码是否相同
    if (oldPassword && newPassword && oldPassword === newPassword) {
      errors.newPassword = '新密码不能与旧密码相同'
      isValid = false
    }

    this.setData({ errors })
    return isValid
  },

  // ========== 提交处理 ==========

  /**
   * 提交修改
   */
  async handleSubmit() {
    console.log('🔐 [ChangePassword] 开始修改密码')

    // 验证表单
    if (!this.validateForm()) {
      wx.vibrateShort()
      return
    }

    // 防重复提交
    if (this.data.loading) {
      return
    }

    const { oldPassword, newPassword } = this.data.form

    this.setData({ loading: true })

    const { confirmPassword } = this.data.form

    try {
      // 调用修改密码API
      console.log('📤 [ChangePassword] 发送修改密码请求')
      const result = await changePassword({
        oldPassword,
        newPassword,
        confirmPassword
      })

      console.log('✅ [ChangePassword] 修改密码成功:', result)

      // 保存新的 token
      if (result.data && result.data.accessToken && result.data.refreshToken) {
        wx.setStorageSync('token', result.data.accessToken)
        wx.setStorageSync('refreshToken', result.data.refreshToken)
        console.log('✅ [ChangePassword] 已保存新的 Token')
      }

      // 显示成功提示
      wx.showToast({
        title: '密码修改成功',
        icon: 'success',
        duration: 2000
      })

      // 清空表单
      this.setData({
        form: {
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        },
        loading: false
      })

      // 延迟返回
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)

    } catch (error) {
      console.error('❌ [ChangePassword] 修改密码失败:', error)
      
      this.setData({ loading: false })
      
      // 触觉反馈
      wx.vibrateShort()

      // 显示错误提示
      wx.showToast({
        title: error.message || '修改失败',
        icon: 'none',
        duration: 2000
      })
    }
  }
})

