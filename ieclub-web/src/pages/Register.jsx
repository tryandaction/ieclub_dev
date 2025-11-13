import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { sendCode, verifyCode, register } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { validateEmail, getEmailErrorMessage, getEmailPlaceholder } from '../utils/emailValidator'

export default function Register() {
  const [step, setStep] = useState(1) // 1: 邮箱验证, 2: 设置密码, 3: 完善信息
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState('0') // 0: 未知, 1: 男, 2: 女
  const [grade, setGrade] = useState('')
  const [major, setMajor] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()

  // 发送验证码
  const handleSendCode = async () => {
    setError('')
    
    if (!validateEmail(email)) {
      setError(getEmailErrorMessage())
      return
    }

    if (countdown > 0 || loading) return

    setLoading(true)

    try {
      const response = await sendCode(email, 'register')

      if (response?.emailSent === false) {
        if (response?.verificationCode) {
          const note = response?.note || '验证码已生成（测试环境）'
          setCode(response.verificationCode)
          showToast(note, 'info')
          console.log('🔐 [TEST] 注册验证码:', response.verificationCode)
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

  // 步骤1: 验证邮箱和验证码
  const handleStep1 = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setError(getEmailErrorMessage())
      return
    }

    if (!code || code.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    setLoading(true)

    try {
      // 调用后端验证接口验证验证码
      await verifyCode(email, code)
      
      // 验证成功，进入下一步
      showToast('验证码验证成功！', 'success')
      setStep(2)
    } catch (err) {
      setError(err.message || '验证码错误或已过期')
    } finally {
      setLoading(false)
    }
  }

  // 密码强度验证
  const validatePassword = (password) => {
    if (password.length < 8) {
      return '密码至少8位'
    }
    if (!/[a-zA-Z]/.test(password)) {
      return '密码需包含字母'
    }
    if (!/[0-9]/.test(password)) {
      return '密码需包含数字'
    }
    return null
  }

  // 步骤2: 设置密码
  const handleStep2 = (e) => {
    e.preventDefault()
    setError('')

    // 验证密码强度
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setStep(3)
  }

  // 步骤3: 完成注册
  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (!nickname || nickname.trim().length < 2) {
      setError('昵称至少2个字符')
      return
    }

    setLoading(true)

    try {
      const result = await register({
        email,
        password,
        verifyCode: code,
        nickname: nickname.trim(),
        gender: parseInt(gender),
        grade,
        major
      })
      
      // 使用 AuthContext 的 login 方法
      authLogin(result.user, result.token)
      
      showToast('🎉 注册成功！欢迎加入IEClub', 'success')
      
      // 跳转到首页
      setTimeout(() => {
        navigate('/plaza')
      }, 500)
    } catch (err) {
      setError(err.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4 py-4 sm:py-8 safe-area-top safe-area-bottom">
      <div className="max-w-md w-full">
        {/* Logo 和标题 */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block w-16 h-16 sm:w-20 sm:h-20 bg-gradient-primary rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 shadow-lg">
            IE
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            加入 IEClub
          </h1>
          <p className="text-sm sm:text-base text-gray-600">连接思想，创造可能</p>
        </div>

        {/* 进度指示器 */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="flex items-center">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base font-bold ${
              step >= 1 ? 'bg-gradient-primary text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-12 sm:w-16 h-1 ${step >= 2 ? 'bg-gradient-primary' : 'bg-gray-200'}`}></div>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base font-bold ${
              step >= 2 ? 'bg-gradient-primary text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <div className={`w-12 sm:w-16 h-1 ${step >= 3 ? 'bg-gradient-primary' : 'bg-gray-200'}`}></div>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base font-bold ${
              step >= 3 ? 'bg-gradient-primary text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* 注册表单 */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8">
          {/* 步骤1: 邮箱验证 */}
          {step === 1 && (
            <>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
                验证邮箱
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6 text-center">
                使用南科大邮箱注册
              </p>

              <form onSubmit={handleStep1} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    📧 南科大邮箱
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={getEmailPlaceholder()}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

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
                      disabled={countdown > 0 || !validateEmail(email)}
                      className={`px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl font-medium transition-all whitespace-nowrap ${
                        countdown > 0 || !validateEmail(email)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-primary text-white hover:shadow-lg active:scale-95 sm:hover:scale-105'
                      }`}
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs sm:text-sm text-red-600">⚠️ {error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg bg-gradient-primary text-white hover:shadow-xl active:scale-95 sm:hover:scale-105 transition-all"
                >
                  下一步
                </button>
              </form>
            </>
          )}

          {/* 步骤2: 设置密码 */}
          {step === 2 && (
            <>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
                设置密码
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6 text-center">
                请设置一个安全的密码
              </p>

              <form onSubmit={handleStep2} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    🔒 设置密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="至少8位，包含字母和数字"
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
                  {/* 密码强度提示 */}
                  {password && (
                    <div className="mt-2 space-y-1 text-xs">
                      <div className={password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                        {password.length >= 8 ? '✓' : '○'} 至少8位字符
                      </div>
                      <div className={/[a-zA-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                        {/[a-zA-Z]/.test(password) ? '✓' : '○'} 包含字母
                      </div>
                      <div className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                        {/[0-9]/.test(password) ? '✓' : '○'} 包含数字
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    🔒 确认密码
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入密码"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs sm:text-sm text-red-600">⚠️ {error}</p>
                  </div>
                )}

                <div className="flex gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg border-2 border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    上一步
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg bg-gradient-primary text-white hover:shadow-xl active:scale-95 sm:hover:scale-105 transition-all"
                  >
                    下一步
                  </button>
                </div>
              </form>
            </>
          )}

          {/* 步骤3: 完善信息 */}
          {step === 3 && (
            <>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
                完善信息
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6 text-center">
                让大家更好地认识你
              </p>

              <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    ✨ 昵称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="请输入昵称（2-20字符）"
                    maxLength={20}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    👤 性别
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setGender('1')}
                      className={`flex-1 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all ${
                        gender === '1'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      👨 男生
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('2')}
                      className={`flex-1 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all ${
                        gender === '2'
                          ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      👩 女生
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('0')}
                      className={`flex-1 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all ${
                        gender === '0'
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      🤷 保密
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 选择性别后，系统会为你生成专属头像
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    🎓 年级
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">请选择年级（可选）</option>
                    <option value="大一">大一</option>
                    <option value="大二">大二</option>
                    <option value="大三">大三</option>
                    <option value="大四">大四</option>
                    <option value="研一">研一</option>
                    <option value="研二">研二</option>
                    <option value="研三">研三</option>
                    <option value="博士">博士</option>
                    <option value="教职工">教职工</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    📚 专业
                  </label>
                  <input
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="请输入专业（可选）"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs sm:text-sm text-red-600">⚠️ {error}</p>
                  </div>
                )}

                <div className="flex gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={loading}
                    className="flex-1 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg border-2 border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
                  >
                    上一步
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all ${
                      loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-primary text-white hover:shadow-xl active:scale-95 sm:hover:scale-105'
                    }`}
                  >
                    {loading ? '注册中...' : '完成注册'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* 用户协议 */}
          <p className="text-center text-xs text-gray-500 mt-5 sm:mt-6">
            注册即代表同意
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
          已有账号？
          <Link to="/login" className="text-purple-600 font-medium hover:underline ml-1">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  )
}

