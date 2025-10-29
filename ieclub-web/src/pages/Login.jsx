import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendCode, login } from '../api/auth'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // 手机号验证
  const validatePhone = (phone) => {
    const phoneReg = /^1[3-9]\d{9}$/
    return phoneReg.test(phone)
  }

  // 发送验证码
  const handleSendCode = async () => {
    setError('')
    
    // 验证手机号
    if (!validatePhone(phone)) {
      setError('请输入正确的手机号')
      return
    }

    // 倒计时中不允许重复发送
    if (countdown > 0) {
      return
    }

    try {
      await sendCode(phone)
      
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

      // 提示成功
      console.log('验证码已发送')
    } catch (err) {
      setError(err.message || '发送验证码失败')
    }
  }

  // 登录
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    // 验证手机号
    if (!validatePhone(phone)) {
      setError('请输入正确的手机号')
      return
    }

    // 验证验证码
    if (!code || code.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    setLoading(true)

    try {
      const { token, user } = await login(phone, code)
      
      // 存储 Token 和用户信息
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      // 显示成功提示
      console.log('✅ 登录成功！')
      
      // 短暂延迟后跳转，让用户看到成功状态
      setTimeout(() => {
        navigate('/plaza')
      }, 300)
    } catch (err) {
      setError(err.message || '登录失败，请重试')
      console.error('❌ 登录失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo 和标题 */}
        <div className="text-center mb-12">
          <div className="inline-block w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
            IE
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            IEClub
          </h1>
          <p className="text-gray-600">学习 · 科研 · 创业</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            欢迎回来
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* 手机号输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📱 手机号
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                maxLength={11}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* 验证码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔢 验证码
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="请输入验证码"
                  maxLength={6}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || !validatePhone(phone)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                    countdown > 0 || !validatePhone(phone)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-primary text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">⚠️ {error}</p>
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-primary text-white hover:shadow-xl hover:scale-105'
              }`}
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          {/* 用户协议 */}
          <p className="text-center text-xs text-gray-500 mt-6">
            登录即代表同意
            <a href="/terms" className="text-purple-600 hover:underline">
              《用户协议》
            </a>
            和
            <a href="/privacy" className="text-purple-600 hover:underline">
              《隐私政策》
            </a>
          </p>
        </div>

        {/* 底部提示 */}
        <p className="text-center text-sm text-gray-500 mt-8">
          没有账号？首次登录自动注册
        </p>
      </div>
    </div>
  )
}

