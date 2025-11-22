import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/Toast'
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
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

  const newPasswordStrength = checkPasswordStrength(newPassword)

  // 提交修改密码
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 前端验证
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段')
      return
    }

    if (oldPassword === newPassword) {
      setError('新密码不能与旧密码相同')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }

    if (newPassword.length < 8) {
      setError('新密码长度不能少于8个字符')
      return
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('新密码必须包含字母和数字')
      return
    }

    setLoading(true)

    try {
      const res = await changePassword(oldPassword, newPassword, confirmPassword)
      
      // 保存新的 token
      if (res.data?.accessToken && res.data?.refreshToken) {
        authLogin(res.data.accessToken, res.data.refreshToken)
      }

      showToast('密码修改成功，请使用新密码登录', 'success')
      
      // 跳转到设置页面
      setTimeout(() => {
        navigate('/settings', { replace: true })
      }, 1500)
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '修改密码失败，请稍后重试'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">修改密码</h1>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          {/* 说明 */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">安全提示</h2>
                <p className="text-sm text-gray-600 mt-1">
                  修改密码后，所有设备将需要使用新密码重新登录
                </p>
              </div>
            </div>
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

            {/* 旧密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前密码
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="请输入当前密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOldPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 新密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新密码
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="至少8位，包含字母和数字"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* 密码强度指示器 */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          newPasswordStrength.strength === 'strong'
                            ? 'bg-green-500 w-full'
                            : newPasswordStrength.strength === 'medium'
                            ? 'bg-yellow-500 w-2/3'
                            : 'bg-red-500 w-1/3'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        newPasswordStrength.strength === 'strong'
                          ? 'text-green-600'
                          : newPasswordStrength.strength === 'medium'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {newPasswordStrength.message}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                密码要求：8-20位，必须包含字母和数字
              </p>
            </div>

            {/* 确认新密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认新密码
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="请再次输入新密码"
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
                  {newPassword === confirmPassword ? (
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

            {/* 按钮组 */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || !oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
              >
                {loading ? '修改中...' : '确认修改'}
              </button>
            </div>
          </form>
        </div>

        {/* 忘记密码链接 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            忘记当前密码？
            <button
              onClick={() => navigate('/forgot-password')}
              className="text-indigo-600 hover:text-indigo-700 font-medium ml-1"
            >
              重置密码
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
