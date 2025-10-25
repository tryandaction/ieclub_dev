import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Login() {
  const [loginType, setLoginType] = useState<'phone' | 'wechat'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)

  const sendCode = async () => {
    if (!phone) {
      Taro.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Taro.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return
    }

    // TODO: 发送验证码
    Taro.showToast({
      title: '验证码已发送',
      icon: 'success'
    })

    // 开始倒计时
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleLogin = async () => {
    if (loginType === 'phone') {
      if (!phone || !code) {
        Taro.showToast({
          title: '请输入手机号和验证码',
          icon: 'none'
        })
        return
      }

      Taro.showLoading({ title: '登录中...' })
      
      try {
        // TODO: 实际登录逻辑
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        Taro.hideLoading()
        Taro.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/square/index' })
        }, 1500)
      } catch (error) {
        Taro.hideLoading()
        Taro.showToast({
          title: '登录失败',
          icon: 'none'
        })
      }
    }
  }

  const handleWeChatLogin = async () => {
    // TODO: 微信登录
    Taro.showToast({
      title: '微信登录开发中',
      icon: 'none'
    })
  }

  const goBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className='login-page'>
      {/* 背景装饰 */}
      <View className='background-decoration' />

      {/* 返回按钮 */}
      <View className='back-btn' onClick={goBack}>
        <View className='iconify-icon' data-icon='mdi:close' />
      </View>

      {/* Logo和标题 */}
      <View className='header'>
        <View className='logo-wrapper'>
          <View className='iconify-icon' data-icon='mdi:school' />
        </View>
        <Text className='app-name'>IEClub</Text>
        <Text className='slogan'>知识共享，共同成长</Text>
      </View>

      {/* 登录方式切换 */}
      <View className='login-type-tabs'>
        <View 
          className={`tab ${loginType === 'phone' ? 'active' : ''}`}
          onClick={() => setLoginType('phone')}
        >
          <Text>手机登录</Text>
        </View>
        <View 
          className={`tab ${loginType === 'wechat' ? 'active' : ''}`}
          onClick={() => setLoginType('wechat')}
        >
          <Text>微信登录</Text>
        </View>
      </View>

      {/* 登录表单 */}
      {loginType === 'phone' ? (
        <View className='form'>
          <View className='input-group'>
            <View className='input-wrapper'>
              <View className='iconify-icon' data-icon='mdi:phone' />
              <Input
                className='input'
                type='number'
                placeholder='请输入手机号'
                maxlength={11}
                value={phone}
                onInput={(e) => setPhone(e.detail.value)}
              />
            </View>
          </View>

          <View className='input-group'>
            <View className='input-wrapper'>
              <View className='iconify-icon' data-icon='mdi:message' />
              <Input
                className='input'
                type='number'
                placeholder='请输入验证码'
                maxlength={6}
                value={code}
                onInput={(e) => setCode(e.detail.value)}
              />
              <View 
                className={`code-btn ${countdown > 0 ? 'disabled' : ''}`}
                onClick={countdown > 0 ? undefined : sendCode}
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </View>
            </View>
          </View>

          <View className='submit-btn' onClick={handleLogin}>
            <Text>登录</Text>
          </View>
        </View>
      ) : (
        <View className='wechat-login'>
          <View className='wechat-btn' onClick={handleWeChatLogin}>
            <View className='iconify-icon' data-icon='mdi:wechat' />
            <Text>微信一键登录</Text>
          </View>
        </View>
      )}

      {/* 协议 */}
      <View className='agreement'>
        <Text className='prefix'>登录即表示同意</Text>
        <Text className='link'>《用户协议》</Text>
        <Text className='prefix'>和</Text>
        <Text className='link'>《隐私政策》</Text>
      </View>
    </View>
  )
}
