import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { sendCode, resetPassword } from '../api/auth'

export default function ForgotPassword() {
  const [step, setStep] = useState(1) // 1: 验证邮箱, 2: 重置密码
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  // 南科大邮箱验证
  const validateEmail = (email) => {
    const emailReg = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/
    return emailReg.test(email)
  }

  // 发送验证码
  const handleSendCode = async () => {
    setError('')
    
    if (!validateEmail(email)) {
      setError('请输入正确的南科大邮箱')
      return
    }

    if (countdown > 0) return

    try {
      await sendCode(email, 'reset_password')
      
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

      console.log('验证码已发送到邮箱')
    } catch (err) {
      setError(err.message || '发送验证码失败')
    }
  }

  // 步骤1: 验证邮箱
  const handleStep1 = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setError('请输入正确的南科大邮箱')
      return
    }

    if (!code || code.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    // 验证码验证成功，进入下一步
    setStep(2)
  }

  // 步骤2: 重置密码
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (!newPassword || newPassword.length < 6) {
      setError('密码至少6位')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)

    try {
      await resetPassword(email, code, newPassword)
      
      console.log('✅ 密码重置成功！')
      
      // 提示成功并跳转到登录页
      alert('密码重置成功，请使用新密码登录')
      navigate('/login')
    } catch (err) {
      setError(err.message || '密码重置失败，请重试')
      console.error('❌ 密码重置失败:', err)
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
            重置密码
          </h1>
          <p className="text-gray-600">找回您的IEClub账号</p>
        </div>

        {/* 重置密码表单 */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* 步骤1: 验证邮箱 */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                验证邮箱
              </h2>
              <p className="text-sm text-gray-500 mb-6 text-center">
                请输入您注册时使用的南科大邮箱
              </p>

              <form onSubmit={handleStep1} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📧 南科大邮箱
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="例如：12345678@mail.sustech.edu.cn"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔢 验证码
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={countdown > 0 || !validateEmail(email)}
                      className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                        countdown > 0 || !validateEmail(email)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-primary text-white hover:shadow-lg hover:scale-105'
                      }`}
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">⚠️ {error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-primary text-white hover:shadow-xl hover:scale-105 transition-all"
                >
                  下一步
                </button>
              </form>
            </>
          )}

          {/* 步骤2: 设置新密码 */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                设置新密码
              </h2>
              <p className="text-sm text-gray-500 mb-6 text-center">
                请设置一个新的安全密码
              </p>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔒 新密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="至少6位，建议包含字母和数字"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔒 确认新密码
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入新密码"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">⚠️ {error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="flex-1 py-4 rounded-xl font-bold text-lg border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    上一步
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                      loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-primary text-white hover:shadow-xl hover:scale-105'
                    }`}
                  >
                    {loading ? '重置中...' : '重置密码'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* 底部提示 */}
        <p className="text-center text-sm text-gray-500 mt-8">
          想起密码了？
          <Link to="/login" className="text-purple-600 font-medium hover:underline ml-1">
            返回登录
          </Link>
        </p>
      </div>
    </div>
  )
}

