// src/pages/forgot-password/index.tsx - 密码找回页面

import { View, Text, Input, Button, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

// 获取API基础URL
function getApiBaseUrl(): string {
  const env = Taro.getEnv()
  
  switch (env) {
    case 'WEAPP':
      return 'https://api.ieclub.online/api'
    case 'H5':
      return '/api'
    case 'RN':
      return 'https://api.ieclub.online/api'
    default:
      return 'http://localhost:3000/api'
  }
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1) // 1: 输入邮箱, 2: 重置密码
  const [form, setForm] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)

  // 验证邮箱格式
  const validateEmail = (email: string): boolean => {
    const regex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/
    return regex.test(email)
  }

  // 发送重置邮件
  const sendResetEmail = async () => {
    if (!form.email) {
      Taro.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }

    if (!validateEmail(form.email)) {
      Taro.showToast({
        title: '请使用南科大邮箱\n(@mail.sustech.edu.cn)',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      setLoading(true)
      
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/auth/forgot-password`,
        method: 'POST',
        data: { email: form.email }
      })

      if (res.data.success) {
        Taro.showToast({ title: '重置链接已发送', icon: 'success' })
        setStep(2)
      } else {
        Taro.showToast({ title: res.data.message || '发送失败', icon: 'none' })
      }
    } catch (error: any) {
      console.error('发送重置邮件失败:', error)
      Taro.showToast({ title: '发送失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 重置密码
  const resetPassword = async () => {
    if (!form.newPassword || form.newPassword.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      Taro.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }

    try {
      setLoading(true)
      
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/auth/reset-password`,
        method: 'POST',
        data: {
          token: token || Taro.getCurrentInstance().router?.params?.token,
          newPassword: form.newPassword
        }
      })

      if (res.data.success) {
        Taro.showToast({ title: '密码重置成功', icon: 'success' })
        setTimeout(() => {
          Taro.reLaunch({ url: '/pages/login/index' })
        }, 1500)
      } else {
        Taro.showToast({ title: res.data.message || '重置失败', icon: 'none' })
      }
    } catch (error: any) {
      console.error('重置密码失败:', error)
      Taro.showToast({ title: '重置失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 页面加载时检查token
  useState(() => {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const tokenParam = currentPage.options?.token
    if (tokenParam) {
      setToken(tokenParam)
      setStep(2)
    }
  })

  return (
    <View className='forgot-password-page'>
      {/* 顶部装饰 */}
      <View className='top-decoration'>
        <View className='gradient-bg' />
        <View className='logo-section'>
          <Image
            className='logo'
            src='https://via.placeholder.com/100/667eea/ffffff?text=IEClub'
            mode='aspectFit'
          />
          <Text className='logo-text'>IEClub</Text>
          <Text className='tagline'>密码找回</Text>
        </View>
      </View>

      {/* 表单内容 */}
      <View className='form-container'>
        {/* 步骤1：输入邮箱 */}
        {step === 1 && (
          <View className='form-content'>
            <View className='form-header'>
              <Text className='form-title'>找回密码</Text>
              <Text className='form-subtitle'>输入您的南科大邮箱</Text>
            </View>

            <View className='form-item'>
              <View className='input-label'>
                <Text className='label-text'>邮箱地址</Text>
                <Text className='label-tip'>(@mail.sustech.edu.cn)</Text>
              </View>
              <Input
                className='form-input'
                type='text'
                placeholder='请输入南科大邮箱'
                value={form.email}
                onInput={(e) => setForm({ ...form, email: e.detail.value })}
              />
            </View>

            <Button
              className='submit-btn'
              onClick={sendResetEmail}
              loading={loading}
            >
              发送重置链接
            </Button>

            <View className='back-login' onClick={() => Taro.navigateBack()}>
              <Text>← 返回登录</Text>
            </View>
          </View>
        )}

        {/* 步骤2：重置密码 */}
        {step === 2 && (
          <View className='form-content'>
            <View className='form-header'>
              <Text className='form-title'>设置新密码</Text>
              <Text className='form-subtitle'>请设置您的新密码</Text>
            </View>

            <View className='form-item'>
              <View className='input-label'>
                <Text className='label-text'>新密码</Text>
                <Text className='label-tip'>至少6位</Text>
              </View>
              <Input
                className='form-input'
                password
                placeholder='请输入新密码'
                value={form.newPassword}
                onInput={(e) => setForm({ ...form, newPassword: e.detail.value })}
              />
            </View>

            <View className='form-item'>
              <View className='input-label'>
                <Text className='label-text'>确认密码</Text>
              </View>
              <Input
                className='form-input'
                password
                placeholder='请再次输入新密码'
                value={form.confirmPassword}
                onInput={(e) => setForm({ ...form, confirmPassword: e.detail.value })}
              />
            </View>

            <View className='password-tips'>
              <Text className='tip-item'>• 密码长度至少6位</Text>
              <Text className='tip-item'>• 建议包含字母和数字</Text>
            </View>

            <Button
              className='submit-btn'
              onClick={resetPassword}
              loading={loading}
            >
              重置密码
            </Button>

            <View className='back-login' onClick={() => setStep(1)}>
              <Text>← 返回上一步</Text>
            </View>
          </View>
        )}
      </View>

      {/* 用户协议 */}
      <View className='agreement'>
        <Text className='agreement-text'>
          重置密码即表示同意
          <Text className='link'>《用户协议》</Text>和
          <Text className='link'>《隐私政策》</Text>
        </Text>
      </View>
    </View>
  )
}
