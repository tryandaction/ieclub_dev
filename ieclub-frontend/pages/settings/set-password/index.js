// pages/settings/set-password/index.js
import { setPassword } from '../../../api/auth'

Page({
  data: {
    // 表单数据
    form: {
      password: '',
      confirmPassword: ''
    },

    // 表单错误
    errors: {
      password: '',
      confirmPassword: ''
    },

    // 密码显示状态
    showPassword: false,
    showConfirmPassword: false,

    // 密码强度
    passwordStrength: 'none',
    strengthText: '',

    // 加载状态
    loading: false
  },

  onLoad(options) {
    console.log('✅ [SetPassword] 页面加载')
  },

  // ========== 输入处理 ==========

  /**
   * 密码输入
   */
  onPasswordInput(e) {
    const password = e.detail.value
    const strength = this.checkPasswordStrength(password)
    
    this.setData({
      'form.password': password,
      'errors.password': '',
      passwordStrength: strength.level,
      strengthText: strength.text
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
   * 切换密码显示
   */
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
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

  // ========== 密码强度检测 ==========

  /**
   * 检查密码强度
   */
  checkPasswordStrength(password) {
    if (!password) {
      return { level: 'none', text: '' }
    }

    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

    if (password.length < 8) {
      return { level: 'weak', text: '密码太短（至少8位）' }
    }

    if (!hasLetter || !hasNumber) {
      return { level: 'weak', text: '必须包含字母和数字' }
    }

    // 强密码：包含大小写字母、数字和特殊字符，且长度 >= 12
    if (hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && password.length >= 12) {
      return { level: 'strong', text: '强密码' }
    }

    // 中等密码：包含大小写字母和数字，或包含特殊字符
    if ((hasUpperCase && hasLowerCase && hasNumber) || hasSpecialChar) {
      return { level: 'medium', text: '中等强度' }
    }

    return { level: 'weak', text: '弱密码' }
  },

  // ========== 表单验证 ==========

  /**
   * 验证表单
   */
  validateForm() {
    const { password, confirmPassword } = this.data.form
    const errors = {}
    let isValid = true

    // 验证密码
    if (!password) {
      errors.password = '请输入密码'
      isValid = false
    } else if (password.length < 8 || password.length > 20) {
      errors.password = '密码长度为8-20位'
      isValid = false
    } else if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      errors.password = '密码必须包含字母和数字'
      isValid = false
    }

    // 验证确认密码
    if (!confirmPassword) {
      errors.confirmPassword = '请再次输入密码'
      isValid = false
    } else if (password !== confirmPassword) {
      errors.confirmPassword = '两次密码不一致'
      isValid = false
    }

    this.setData({ errors })
    return isValid
  },

  // ========== 提交处理 ==========

  /**
   * 提交设置
   */
  async handleSubmit() {
    console.log('🔐 [SetPassword] 开始设置密码')

    // 验证表单
    if (!this.validateForm()) {
      wx.vibrateShort()
      return
    }

    // 防重复提交
    if (this.data.loading) {
      return
    }

    const { password, confirmPassword } = this.data.form

    this.setData({ loading: true })

    try {
      // 调用设置密码API
      console.log('📤 [SetPassword] 发送设置密码请求')
      const result = await setPassword({
        password,
        confirmPassword
      })

      console.log('✅ [SetPassword] 设置密码成功:', result)

      // 保存新的 token
      if (result.data && result.data.accessToken && result.data.refreshToken) {
        wx.setStorageSync('token', result.data.accessToken)
        wx.setStorageSync('refreshToken', result.data.refreshToken)
        console.log('✅ [SetPassword] 已保存新的 Token')
      }

      // 显示成功提示
      wx.showToast({
        title: '密码设置成功',
        icon: 'success',
        duration: 2000
      })

      // 清空表单
      this.setData({
        form: {
          password: '',
          confirmPassword: ''
        },
        loading: false
      })

      // 延迟返回
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)

    } catch (error) {
      console.error('❌ [SetPassword] 设置密码失败:', error)
      
      this.setData({ loading: false })
      
      // 触觉反馈
      wx.vibrateShort()

      // 显示错误提示
      wx.showToast({
        title: error.message || '设置失败',
        icon: 'none',
        duration: 2000
      })
    }
  }
})
