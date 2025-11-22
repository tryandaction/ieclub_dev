import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { sendCode, sendPhoneCode, login, loginWithPhone } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { validateEmail, getEmailErrorMessage, getEmailPlaceholder } from '../utils/emailValidator'

export default function Login() {
  const [loginMode, setLoginMode] = useState('password') // 'password', 'email_code', 'phone'
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login: authLogin } = useAuth()
  
  // 获取登录前的页面路径
  const from = location.state?.from?.pathname || '/plaza'

  // 手机号验证
  const validatePhone = (phone) => {
    const phoneReg = /^1[3-9]\d{9}$/
    return phoneReg.test(phone)
  }

  // 发送验证码
  const handleSendCode = async () => {
    setError('')
    
    // 倒计时中不允许重复发送
    if (countdown > 0 || loading) {
      return
    }

    setLoading(true)

    try {
      if (loginMode === 'email_code') {
        // 邮箱验证码登录
        if (!validateEmail(email)) {
          setError(getEmailErrorMessage())
          setLoading(false)
          return
        }
        const response = await sendCode(email, 'login')

        if (response?.emailSent === false) {
          if (response?.verificationCode) {
            const note = response?.note || '验证码已生成（测试环境）'
            setCode(response.verificationCode)
            showToast(note, 'info')
            console.log('🔐 [TEST] 验证码已生成:', response.verificationCode)
          } else {
            const errorMsg = response?.error || '邮件发送失败，请稍后重试或联系管理员'
            setError(errorMsg)
            showToast(errorMsg, 'error')
            setLoading(false)
            return
          }
        } else {
          showToast('验证码已发送到邮箱，请查收', 'success')
        }
      } else if (loginMode === 'phone') {
        // 手机号验证码登录
        if (!validatePhone(phone)) {
          setError('请输入正确的手机号')
          setLoading(false)
          return
        }
        await sendPhoneCode(phone, 'login')
        showToast('验证码已发送到手机', 'success')
      }
      
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
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '发送验证码失败，请稍后重试'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 登录
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    // 根据登录模式验证输入
    if (loginMode === 'password' || loginMode === 'email_code') {
      if (!validateEmail(email)) {
        setError('请输入正确的南科大邮箱')
        return
      }
    } else if (loginMode === 'phone') {
      if (!validatePhone(phone)) {
        setError('请输入正确的手机号')
        return
      }
    }

    if (loginMode === 'password') {
      // 密码登录
      if (!password || password.length < 6) {
        setError('密码至少6位')
        return
      }
    } else {
      // 验证码登录（邮箱或手机）
      if (!code || code.length !== 6) {
        setError('请输入6位验证码')
        return
      }
    }

    setLoading(true)

    try {
      let result
      if (loginMode === 'password') {
        result = await login(email, password)
      } else if (loginMode === 'email_code') {
        result = await login(email, code, 'code')
      } else if (loginMode === 'phone') {
        result = await loginWithPhone(phone, code)
      }
      
      // 使用 AuthContext 的 login 方法
      authLogin(result.user, result.accessToken || result.token, result.refreshToken)
      
      // 显示成功提示
      showToast('🎉 登录成功！', 'success')
      
      // 返回登录前的页面或首页
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 300)
    } catch (err) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4 py-4 sm:py-8 safe-area-top safe-area-bottom">
      <div className="max-w-md w-full">
        {/* Logo 和标题 */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-block w-16 h-16 sm:w-20 sm:h-20 bg-gradient-primary rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 shadow-lg">
            IE
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            IEClub
          </h1>
          <p className="text-sm sm:text-base text-gray-600">学习 · 科研 · 项目 · 创业</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
            欢迎回来
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6 text-center">
            使用南科大邮箱登录
          </p>

          {/* 登录方式切换 */}
          <div className="flex gap-1 mb-5 sm:mb-6 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setLoginMode('password'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                loginMode === 'password'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              密码
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('email_code'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                loginMode === 'email_code'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              邮箱验证码
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('phone'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                loginMode === 'phone'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              手机号
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            {/* 邮箱输入（密码登录和邮箱验证码登录） */}
            {(loginMode === 'password' || loginMode === 'email_code') && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  📧 南科大邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="@mail.sustech.edu.cn 或 @sustech.edu.cn"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {/* 手机号输入（手机号登录） */}
            {loginMode === 'phone' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  📱 手机号
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  maxLength={11}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {/* 密码输入（密码模式） */}
            {loginMode === 'password' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    🔒 密码
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-purple-600 hover:underline"
                  >
                    忘记密码？
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            )}

            {/* 验证码输入（验证码模式） */}
            {(loginMode === 'email_code' || loginMode === 'phone') && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  🔢 验证码
                </label>
                <div className="flex gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入6位验证码"
                    maxLength={6}
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || (loginMode === 'email_code' && !validateEmail(email)) || (loginMode === 'phone' && !validatePhone(phone))}
                    className={`px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl font-medium transition-all whitespace-nowrap ${
                      countdown > 0 || (loginMode === 'email_code' && !validateEmail(email)) || (loginMode === 'phone' && !validatePhone(phone))
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-primary text-white hover:shadow-lg active:scale-95 sm:hover:scale-105'
                    }`}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs sm:text-sm text-red-600">⚠️ {error}</p>
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-primary text-white hover:shadow-xl active:scale-95 sm:hover:scale-105'
              }`}
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          {/* 用户协议 */}
          <p className="text-center text-xs text-gray-500 mt-5 sm:mt-6">
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
        <p className="text-center text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8">
          还没有账号？
          <Link to="/register" className="text-purple-600 font-medium hover:underline ml-1">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  )
}

