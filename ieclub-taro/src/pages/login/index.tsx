// src/pages/login/index.tsx - 登录注册系统

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

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [step, setStep] = useState(1) // 注册步骤：1=邮箱验证，2=设置密码
  
  // 表单数据
  const [form, setForm] = useState({
    email: '',
    verifyCode: '',
    password: '',
    confirmPassword: ''
  })

  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)

  // 验证邮箱格式（南科大邮箱）
  const validateEmail = (email: string): boolean => {
    const regex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/
    return regex.test(email)
  }

  // 发送验证码
  const sendVerifyCode = async () => {
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
      
      // 调用后端API发送验证码
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/auth/send-code`,
        method: 'POST',
        data: {
          email: form.email,
          type: 'register'
        }
      })

      if (!res.data.success && res.data.code !== 200) {
        throw new Error(res.data.message || '发送失败')
      }
      
      Taro.showToast({ title: '验证码已发送', icon: 'success' })
      
      // 开始倒计时
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (error) {
      Taro.showToast({ title: '发送失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 验证验证码并进入下一步
  const verifyCodeAndNext = async () => {
    if (!form.verifyCode || form.verifyCode.length !== 6) {
      Taro.showToast({ title: '请输入6位验证码', icon: 'none' })
      return
    }

    // 调用后端API验证验证码
    try {
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/auth/verify-code`,
        method: 'POST',
        data: {
          email: form.email,
          code: form.verifyCode
        }
      })

      if (!res.data.success) {
        Taro.showToast({ title: res.data.message || '验证码错误', icon: 'none' })
        return
      }
    } catch (error: any) {
      Taro.showToast({ title: '验证码验证失败', icon: 'none' })
      return
    }

    setStep(2)
  }

  // 注册
  const handleRegister = async () => {
    // 验证密码
    if (!form.password || form.password.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }

    if (form.password !== form.confirmPassword) {
      Taro.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }

    try {
      setLoading(true)

      // 调用后端注册API
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/auth/register`,
        method: 'POST',
        data: {
          email: form.email,
          password: form.password,
          verifyCode: form.verifyCode,
          nickname: form.email.split('@')[0] // 使用邮箱前缀作为默认昵称
        }
      })

      if (res.data.success) {
        Taro.showToast({ title: '注册成功', icon: 'success' })
        
        // 保存token和用户信息
        Taro.setStorageSync('token', res.data.data.token)
        Taro.setStorageSync('userInfo', res.data.data.user)

        // 跳转到首页
        setTimeout(() => {
          Taro.reLaunch({ url: '/pages/square/index' })
        }, 1500)
      } else {
        Taro.showToast({ title: res.data.message || '注册失败', icon: 'none' })
      }

    } catch (error: any) {
      console.error('注册失败:', error)
      let errorMessage = '注册失败，请重试'
      
      if (error.data?.message) {
        errorMessage = error.data.message
      } else if (error.errMsg?.includes('timeout')) {
        errorMessage = '网络超时，请重试'
      } else if (error.errMsg?.includes('fail')) {
        errorMessage = '网络连接失败，请检查网络'
      }
      
      Taro.showToast({ title: errorMessage, icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 登录
  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Taro.showToast({ title: '请填写邮箱和密码', icon: 'none' })
      return
    }

    if (!validateEmail(form.email)) {
      Taro.showToast({ title: '请使用南科大邮箱', icon: 'none' })
      return
    }

    try {
      setLoading(true)

      // 调用后端登录API
      const res = await Taro.request({
        url: `${getApiBaseUrl()}/auth/login`,
        method: 'POST',
        data: {
          email: form.email,
          password: form.password
        }
      })

      if (res.data.success) {
        Taro.showToast({ title: '登录成功', icon: 'success' })

        // 保存token和用户信息
        Taro.setStorageSync('token', res.data.data.token)
        Taro.setStorageSync('userInfo', res.data.data.user)

        // 跳转到首页
        setTimeout(() => {
          Taro.reLaunch({ url: '/pages/square/index' })
        }, 1500)
      } else {
        Taro.showToast({ title: res.data.message || '登录失败', icon: 'none' })
      }

    } catch (error: any) {
      console.error('登录失败:', error)
      let errorMessage = '登录失败，请检查账号密码'
      
      if (error.data?.message) {
        errorMessage = error.data.message
      } else if (error.errMsg?.includes('timeout')) {
        errorMessage = '网络超时，请重试'
      } else if (error.errMsg?.includes('fail')) {
        errorMessage = '网络连接失败，请检查网络'
      }
      
      Taro.showToast({ title: errorMessage, icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 切换模式
  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setStep(1)
    setForm({ email: '', verifyCode: '', password: '', confirmPassword: '' })
  }

  // 跳转到密码找回页面
  const goToForgotPassword = () => {
    Taro.navigateTo({ url: '/pages/forgot-password/index' })
  }

  return (
    <View className='login-page'>
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
          <Text className='tagline'>智能话题广场</Text>
        </View>
      </View>

      {/* 登录/注册表单 */}
      <View className='form-container'>
        {/* 标题切换 */}
        <View className='form-header'>
          <Text className='form-title'>
            {mode === 'login' ? '欢迎回来' : '加入IEClub'}
          </Text>
          <Text className='form-subtitle'>
            {mode === 'login'
              ? '使用南科大邮箱登录'
              : '使用南科大邮箱注册'}
          </Text>
        </View>

        {/* 登录表单 */}
        {mode === 'login' && (
          <View className='form-content'>
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
                id='login-email'
                name='email'
                onInput={(e) => setForm({ ...form, email: e.detail.value })}
              />
            </View>

            <View className='form-item'>
              <View className='input-label'>
                <Text className='label-text'>密码</Text>
              </View>
              <Input
                className='form-input'
                password
                placeholder='请输入密码'
                value={form.password}
                id='login-password'
                name='password'
                onInput={(e) => setForm({ ...form, password: e.detail.value })}
              />
            </View>

            <View className='forgot-password' onClick={goToForgotPassword}>
              <Text className='forgot-text'>忘记密码？</Text>
            </View>

            <Button
              className='submit-btn'
              onClick={handleLogin}
              loading={loading}
            >
              登录
            </Button>
          </View>
        )}

        {/* 注册表单 - 第一步：邮箱验证 */}
        {mode === 'register' && step === 1 && (
          <View className='form-content'>
            <View className='step-indicator'>
              <View className='step active'>
                <View className='step-dot'>1</View>
                <Text className='step-text'>邮箱验证</Text>
              </View>
              <View className='step-line' />
              <View className='step'>
                <View className='step-dot'>2</View>
                <Text className='step-text'>设置密码</Text>
              </View>
            </View>

            <View className='form-item'>
              <View className='input-label'>
                <Text className='label-text'>邮箱地址</Text>
                <Text className='label-tip'>仅限南科大邮箱</Text>
              </View>
              <Input
                className='form-input'
                type='text'
                placeholder='example@mail.sustech.edu.cn'
                value={form.email}
                id='register-email'
                name='email'
                onInput={(e) => setForm({ ...form, email: e.detail.value })}
              />
            </View>

            <View className='form-item'>
              <View className='input-label'>
                <Text className='label-text'>验证码</Text>
              </View>
              <View className='verify-code-box'>
                <Input
                  className='verify-input'
                  type='number'
                  maxlength={6}
                  placeholder='6位验证码'
                  value={form.verifyCode}
                  id='register-verify-code'
                  name='verifyCode'
                  onInput={(e) => setForm({ ...form, verifyCode: e.detail.value })}
                />
                <Button
                  className='send-code-btn'
                  onClick={sendVerifyCode}
                  disabled={countdown > 0}
                  loading={loading}
                >
                  {countdown > 0 ? `${countdown}秒后重试` : '发送验证码'}
                </Button>
              </View>
            </View>

            <Button
              className='submit-btn'
              onClick={verifyCodeAndNext}
            >
              下一步
            </Button>
          </View>
        )}

        {/* 注册表单 - 第二步：设置密码 */}
        {mode === 'register' && step === 2 && (
          <View className='form-content'>
            <View className='step-indicator'>
              <View className='step done'>
                <View className='step-dot'>✓</View>
                <Text className='step-text'>邮箱验证</Text>
              </View>
              <View className='step-line done' />
              <View className='step active'>
                <View className='step-dot'>2</View>
                <Text className='step-text'>设置密码</Text>
              </View>
            </View>

            <View className='form-item'>
              <View className='input-label'>
                <Text className='label-text'>设置密码</Text>
                <Text className='label-tip'>至少6位</Text>
              </View>
              <Input
                className='form-input'
                password
                placeholder='请设置登录密码'
                value={form.password}
                id='register-password'
                name='password'
                onInput={(e) => setForm({ ...form, password: e.detail.value })}
              />
            </View>

            <View className='form-item'>
              <View className='input-label'>
                <Text className='label-text'>确认密码</Text>
              </View>
              <Input
                className='form-input'
                password
                placeholder='请再次输入密码'
                value={form.confirmPassword}
                id='register-confirm-password'
                name='confirmPassword'
                onInput={(e) => setForm({ ...form, confirmPassword: e.detail.value })}
              />
            </View>

            <View className='password-tips'>
              <Text className='tip-item'>• 密码长度至少6位</Text>
              <Text className='tip-item'>• 建议包含字母和数字</Text>
            </View>

            <Button
              className='submit-btn'
              onClick={handleRegister}
              loading={loading}
            >
              完成注册
            </Button>

            <View className='back-step' onClick={() => setStep(1)}>
              <Text>← 返回上一步</Text>
            </View>
          </View>
        )}

        {/* 切换登录/注册 */}
        <View className='switch-mode'>
          <Text className='switch-text'>
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
          </Text>
          <Text className='switch-link' onClick={switchMode}>
            {mode === 'login' ? '立即注册' : '立即登录'}
          </Text>
        </View>
      </View>

      {/* 用户协议 */}
      <View className='agreement'>
        <Text className='agreement-text'>
          登录即表示同意
          <Text className='link'>《用户协议》</Text>和
          <Text className='link'>《隐私政策》</Text>
        </Text>
      </View>
    </View>
  )
}