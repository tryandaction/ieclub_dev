import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setPassword } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { Eye, EyeOff, Lock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function SetPassword() {
  const [password, setPasswordValue] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()

  // 密码强度检测
  const checkPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 'none', message: '', color: 'gray' }
    
    const hasLetter = /[a-zA-Z]/.test(pwd)
    const hasNumber = /\d/.test(pwd)
    const hasUpperCase = /[A-Z]/.test(pwd)
    const hasLowerCase = /[a-z]/.test(pwd)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
    
    if (pwd.length < 8) {
      return { strength: 'weak', message: '密码太短（至少8位）', color: 'red' }
    }
    
    if (!hasLetter || !hasNumber) {
      return { strength: 'weak', message: '必须包含字母和数字', color: 'red' }
    }
    
    if (pwd.length >= 12 && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar) {
      return { strength: 'strong', message: '强密码', color: 'green' }
    }
    
    if ((hasUpperCase && hasLowerCase && hasNumber) || hasSpecialChar) {
      return { strength: 'medium', message: '中等强度', color: 'yellow' }
    }
    
    return { strength: 'weak', message: '弱密码', color: 'red' }
  }

  const passwordStrength = checkPasswordStrength(password)

  // 提交设置密码
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 前端验证
    if (!password || !confirmPassword) {
      setError('请填写所有字段')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 8) {
      setError('密码长度不能少于8个字符')
      return
    }

    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError('密码必须包含字母和数字')
      return
    }

    setLoading(true)

    try {
      const res = await setPassword(password, confirmPassword)
      
      // 保存新的 token
      if (res.data?.accessToken && res.data?.refreshToken) {
        authLogin(res.data.accessToken, res.data.refreshToken)
      }

      showToast('密码设置成功', 'success')
      
      // 跳转到个人资料页面
      setTimeout(() => {
        navigate('/profile', { replace: true })
      }, 1000)
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '设置密码失败，请稍后重试'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">设置密码</h1>
            <p className="text-gray-500 mt-2">为您的账号设置一个安全密码</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* 新密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="至少8位，包含字母和数字"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* 密码强度指示器 */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.strength === 'strong'
                            ? 'bg-green-500 w-full'
                            : passwordStrength.strength === 'medium'
                            ? 'bg-yellow-500 w-2/3'
                            : 'bg-red-500 w-1/3'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        passwordStrength.strength === 'strong'
                          ? 'text-green-600'
                          : passwordStrength.strength === 'medium'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {passwordStrength.message}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                密码要求：8-20位，必须包含字母和数字
              </p>
            </div>

            {/* 确认密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="请再次输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* 匹配提示 */}
              {confirmPassword && (
                <div className="mt-2 flex items-center space-x-2">
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">密码匹配</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">密码不匹配</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? '设置中...' : '设置密码'}
            </button>
          </form>

          {/* 底部提示 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              设置密码后，您可以使用邮箱+密码登录
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
