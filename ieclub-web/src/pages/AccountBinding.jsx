import { useState, useEffect } from 'react';
import { Link2, Phone, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { bindPhone, getUserInfo, sendPhoneCode } from '../api/auth';

/**
 * 账号绑定页面
 */
export default function AccountBinding() {
  const [userInfo, setUserInfo] = useState(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const loadUserInfo = async () => {
    try {
      const data = await getUserInfo();
      setUserInfo(data);
    } catch (err) {
      setError('获取用户信息失败');
    }
  };

  const handleSendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    
    try {
      await sendPhoneCode(phone, 'bind_phone');
      setCountdown(60);
      setError('');
    } catch (err) {
      setError(err.message || '发送验证码失败');
    }
  };

  const handleBindPhone = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    
    if (!code || code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setLoading(true);
    try {
      await bindPhone({ phone, code });
      alert('绑定成功！');
      loadUserInfo();
      setPhone('');
      setCode('');
    } catch (err) {
      setError(err.message || '绑定失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Link2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">账号绑定</h1>
          <p className="text-gray-600">绑定手机号和其他账号，提升账号安全性</p>
        </div>

        {/* 当前绑定状态 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">当前绑定状态</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">邮箱</p>
                  <p className="text-sm text-gray-600">{userInfo?.email || '未绑定'}</p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium text-gray-900">手机号</p>
                  <p className="text-sm text-gray-600">
                    {userInfo?.phone ? `${userInfo.phone.slice(0, 3)}****${userInfo.phone.slice(-4)}` : '未绑定'}
                  </p>
                </div>
              </div>
              {userInfo?.phone ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* 绑定手机号表单 */}
        {!userInfo?.phone && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">绑定手机号</h2>
            <form onSubmit={handleBindPhone} className="space-y-4">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  验证码
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入6位验证码"
                    maxLength={6}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || !phone}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown}秒` : '获取验证码'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? '绑定中...' : '确认绑定'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
