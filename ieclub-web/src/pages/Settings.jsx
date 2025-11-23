import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Lock, Eye, EyeOff, Shield, Info, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { changePassword, bindPhone, unbindPhone, bindWechat, unbindWechat, sendPhoneCode } from '../api/auth'
import { request } from '../utils/request'
import { showToast } from '../components/Toast'

export default function Settings() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  
  // 通知设置
  const [notifications, setNotifications] = useState({
    system: true,
    like: true,
    comment: true,
    follow: true,
    activity: true
  })
  
  // 隐私设置
  const [privacy, setPrivacy] = useState({
    showPhone: false,
    showEmail: false,
    allowSearch: true,
    allowMessage: true
  })
  
  // 通用设置
  const [general, setGeneral] = useState({
    language: 'zh-CN',
    autoPlay: true,
    saveTraffic: false
  })
  
  // 加载设置
  useEffect(() => {
    loadSettings()
  }, [])
  
  const loadSettings = async () => {
    // 从localStorage加载隐私和通用设置
    const savedPrivacy = localStorage.getItem('privacy_settings')
    const savedGeneral = localStorage.getItem('general_settings')
    
    if (savedPrivacy) {
      setPrivacy(JSON.parse(savedPrivacy))
    }
    
    if (savedGeneral) {
      setGeneral(JSON.parse(savedGeneral))
    }
    
    // 从服务器加载通知设置
    try {
      const res = await request.get('/notifications/settings')
      if (res.data?.settings) {
        setNotifications(res.data.settings)
      }
    } catch (error) {
      console.error('加载通知设置失败:', error)
    }
  }
  
  // 更新通知设置
  const updateNotification = async (type) => {
    const newValue = !notifications[type]
    setNotifications(prev => ({ ...prev, [type]: newValue }))
    
    try {
      await request.put('/notifications/settings', {
        ...notifications,
        [type]: newValue
      })
    } catch (error) {
      // 回滚
      setNotifications(prev => ({ ...prev, [type]: !newValue }))
      showToast('设置失败', 'error')
    }
  }
  
  // 更新隐私设置
  const updatePrivacy = (type) => {
    const newPrivacy = { ...privacy, [type]: !privacy[type] }
    setPrivacy(newPrivacy)
    localStorage.setItem('privacy_settings', JSON.stringify(newPrivacy))
    showToast('设置成功', 'success')
  }
  
  // 更新通用设置
  const updateGeneral = (type) => {
    const newGeneral = { ...general, [type]: !general[type] }
    setGeneral(newGeneral)
    localStorage.setItem('general_settings', JSON.stringify(newGeneral))
    showToast('设置成功', 'success')
  }
  
  // 清除缓存
  const clearCache = () => {
    if (!confirm('确定要清除缓存吗？这不会删除你的个人数据。')) {
      return
    }
    
    // 保留重要数据
    const token = localStorage.getItem('token')
    const userInfo = localStorage.getItem('userInfo')
    const privacySettings = localStorage.getItem('privacy_settings')
    const generalSettings = localStorage.getItem('general_settings')
    
    localStorage.clear()
    
    // 恢复重要数据
    localStorage.setItem('token', token)
    localStorage.setItem('userInfo', userInfo)
    if (privacySettings) localStorage.setItem('privacy_settings', privacySettings)
    if (generalSettings) localStorage.setItem('general_settings', generalSettings)
    
    showToast('缓存已清除', 'success')
  }
  
  // 修改密码相关状态
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  
  // 绑定手机号相关状态
  const [showPhoneSection, setShowPhoneSection] = useState(false)
  const [phone, setPhone] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneCountdown, setPhoneCountdown] = useState(0)
  const [bindingPhone, setBindingPhone] = useState(false)
  
  // 显示密码输入框
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 修改密码
  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('请填写完整信息', 'error')
      return
    }
    
    if (newPassword.length < 6) {
      showToast('新密码至少6位', 'error')
      return
    }
    
    if (newPassword !== confirmPassword) {
      showToast('两次输入的密码不一致', 'error')
      return
    }
    
    setChangingPassword(true)
    
    try {
      await changePassword(oldPassword, newPassword)
      showToast('密码修改成功，请重新登录', 'success')
      
      // 清空表单
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordSection(false)
      
      // 2秒后退出登录
      setTimeout(() => {
        logout()
        navigate('/login')
      }, 2000)
    } catch (error) {
      showToast(error.message || '密码修改失败', 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  // 发送手机验证码
  const handleSendPhoneCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入正确的手机号', 'error')
      return
    }
    
    if (phoneCountdown > 0) {
      return
    }
    
    try {
      await sendPhoneCode(phone, 'bind')
      showToast('验证码已发送', 'success')
      
      // 开始倒计时
      setPhoneCountdown(60)
      const timer = setInterval(() => {
        setPhoneCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      showToast(error.message || '发送失败', 'error')
    }
  }

  // 绑定手机号
  const handleBindPhone = async (e) => {
    e.preventDefault()
    
    if (!phone || !phoneCode) {
      showToast('请填写完整信息', 'error')
      return
    }
    
    if (phoneCode.length !== 6) {
      showToast('请输入6位验证码', 'error')
      return
    }
    
    setBindingPhone(true)
    
    try {
      await bindPhone(phone, phoneCode)
      showToast('手机号绑定成功', 'success')
      
      // 更新用户信息
      updateUser({ ...user, phone })
      
      // 清空表单
      setPhone('')
      setPhoneCode('')
      setShowPhoneSection(false)
    } catch (error) {
      showToast(error.message || '绑定失败', 'error')
    } finally {
      setBindingPhone(false)
    }
  }

  // 解绑手机号
  const handleUnbindPhone = async () => {
    if (!confirm('确定要解绑手机号吗？')) {
      return
    }
    
    try {
      await unbindPhone()
      showToast('手机号解绑成功', 'success')
      updateUser({ ...user, phone: null })
    } catch (error) {
      showToast(error.message || '解绑失败', 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* 页面标题 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">设置</h1>
          <p className="text-sm text-gray-500 mt-1">管理您的账号、通知和隐私设置</p>
        </div>

        <div className="divide-y divide-gray-200">
          {/* 通知设置 */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              通知设置
            </h2>
            <div className="space-y-4">
              {[
                { key: 'system', label: '系统通知', desc: '接收系统消息和公告' },
                { key: 'like', label: '点赞通知', desc: '有人点赞你的内容' },
                { key: 'comment', label: '评论通知', desc: '有人评论你的内容' },
                { key: 'follow', label: '关注通知', desc: '有人关注了你' },
                { key: 'activity', label: '活动通知', desc: '活动提醒和更新' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => updateNotification(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[item.key] ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 隐私设置 */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              隐私设置
            </h2>
            <div className="space-y-4">
              {[
                { key: 'showPhone', label: '显示手机号', desc: '在个人主页显示' },
                { key: 'showEmail', label: '显示邮箱', desc: '在个人主页显示' },
                { key: 'allowSearch', label: '允许被搜索', desc: '其他用户可以搜索到你' },
                { key: 'allowMessage', label: '允许私信', desc: '其他用户可以给你发私信' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => updatePrivacy(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacy[item.key] ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacy[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 通用设置 */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              通用设置
            </h2>
            <div className="space-y-4">
              {[
                { key: 'autoPlay', label: '自动播放视频', desc: '在WiFi环境下自动播放' },
                { key: 'saveTraffic', label: '省流量模式', desc: '减少图片和视频质量' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => updateGeneral(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      general[item.key] ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        general[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 存储与缓存 */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              存储与缓存
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">清除缓存</div>
                <div className="text-xs text-gray-500 mt-1">清除临时文件和数据</div>
              </div>
              <button
                onClick={clearCache}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                清除
              </button>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              账号信息
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">邮箱</div>
                  <div className="text-sm text-gray-500 mt-1">{user?.email || '未设置'}</div>
                </div>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">已验证</span>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">昵称</div>
                  <div className="text-sm text-gray-500 mt-1">{user?.nickname || '未设置'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 修改密码 */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">登录密码</h2>
                <p className="text-xs text-gray-500 mt-1">定期更换密码可以提高账号安全性</p>
              </div>
              <button
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                {showPasswordSection ? '取消' : '修改密码'}
              </button>
            </div>
            
            {showPasswordSection && (
              <form onSubmit={handleChangePassword} className="space-y-4 mt-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    原密码
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="请输入原密码"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showOldPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新密码（至少6位）
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="请输入新密码"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    确认新密码
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="请再次输入新密码"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={changingPassword}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    changingPassword
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-primary text-white hover:shadow-lg active:scale-95'
                  }`}
                >
                  {changingPassword ? '修改中...' : '确认修改'}
                </button>
              </form>
            )}
          </div>

          {/* 手机号绑定 */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">手机号</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {user?.phone ? `已绑定手机号：${user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}` : '绑定手机号后可使用手机号登录'}
                </p>
              </div>
              {user?.phone ? (
                <button
                  onClick={handleUnbindPhone}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  解绑
                </button>
              ) : (
                <button
                  onClick={() => setShowPhoneSection(!showPhoneSection)}
                  className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  {showPhoneSection ? '取消' : '绑定手机'}
                </button>
              )}
            </div>
            
            {showPhoneSection && !user?.phone && (
              <form onSubmit={handleBindPhone} className="space-y-4 mt-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    手机号
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    maxLength={11}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    验证码
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendPhoneCode}
                      disabled={phoneCountdown > 0 || !/^1[3-9]\d{9}$/.test(phone)}
                      className={`px-6 py-2.5 text-sm rounded-xl font-medium transition-all whitespace-nowrap ${
                        phoneCountdown > 0 || !/^1[3-9]\d{9}$/.test(phone)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-primary text-white hover:shadow-lg active:scale-95'
                      }`}
                    >
                      {phoneCountdown > 0 ? `${phoneCountdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={bindingPhone}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    bindingPhone
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-primary text-white hover:shadow-lg active:scale-95'
                  }`}
                >
                  {bindingPhone ? '绑定中...' : '确认绑定'}
                </button>
              </form>
            )}
          </div>

          {/* 微信绑定 */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">微信</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {user?.wechatBound ? '已绑定微信账号' : '绑定微信后可使用微信快捷登录'}
                </p>
              </div>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                小程序内绑定
              </span>
            </div>
          </div>

          {/* 账号安全 */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">账号安全</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">登录设备管理</div>
                  <div className="text-xs text-gray-500 mt-1">查看和管理登录过的设备</div>
                </div>
                <span className="text-xs text-gray-400">敬请期待</span>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">登录日志</div>
                  <div className="text-xs text-gray-500 mt-1">查看最近的登录记录</div>
                </div>
                <span className="text-xs text-gray-400">敬请期待</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
