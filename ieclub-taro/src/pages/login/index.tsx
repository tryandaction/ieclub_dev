// ==================== 登录页面（增强版） ====================

import { View, Input, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../store/user'
import './index.scss'

export default function LoginPage() {
  const { login, register } = useUserStore()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    // 验证
    if (!email || !password) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (!isLogin && !nickname) {
      Taro.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        await login({ email, password })
      } else {
        await register({ username: nickname, email, password, nickname })
      }

      // 登录成功后跳转
      Taro.switchTab({ url: '/pages/topics/index' })
    } catch (error) {
      console.error('登录/注册失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='login-header'>
        <View className='logo'>🎓</View>
        <View className='title'>IEClub</View>
        <View className='subtitle'>跨学科交流平台</View>
      </View>

      <View className='login-form'>
        {!isLogin && (
          <View className='form-item'>
            <Input
              className='input'
              placeholder='请输入昵称'
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
            />
          </View>
        )}

        <View className='form-item'>
          <Input
            className='input'
            placeholder='请输入邮箱'
            type='text'
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Input
            className='input'
            placeholder='请输入密码'
            password
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <Button
          className='submit-btn'
          onClick={handleSubmit}
          loading={loading}
        >
          {isLogin ? '登录' : '注册'}
        </Button>

        <View className='switch-mode' onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? '没有账号？立即注册' : '已有账号？立即登录'}
        </View>
      </View>
    </View>
  )
}