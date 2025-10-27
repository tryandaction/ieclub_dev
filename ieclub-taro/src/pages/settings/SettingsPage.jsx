import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext.jsx';
import { Icon } from '@iconify/react';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Input } from '../../components/common/Input.jsx';

/**
 * 设置页面 - 优化版
 * 功能：
 * - 账号设置（修改密码、绑定邮箱/手机）
 * - 隐私设置（资料可见性、黑名单）
 * - 通知设置（邮件、推送、频率控制）
 * - 偏好设置（语言、主题、字体大小）
 * - 关于页面（版本信息、用户协议）
 * - 数据管理（清除缓存、数据导出）
 */
export const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // 设置状态
  const [settings, setSettings] = useState({
    // 通知设置
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false,
    commentNotif: true,
    likeNotif: true,
    followNotif: true,
    eventNotif: true,
    // 隐私设置
    showProfile: true,
    showEmail: false,
    showPhone: false,
    allowFollow: true,
    allowMessage: true,
    // 偏好设置
    language: 'zh-CN',
    theme: 'light',
    fontSize: 'medium',
  });

  // Modal 状态
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // 密码表单
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 切换设置
  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    // TODO: 调用API保存设置
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('请填写所有字段');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('密码长度不能少于6位');
      return;
    }
    // TODO: 调用API修改密码
    alert('密码修改成功');
    setShowPasswordModal(false);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  // 注销账号
  const handleDeleteAccount = async () => {
    // TODO: 调用API注销账号
    alert('账号已注销');
    logout();
    navigate('/login');
  };

  // 退出登录
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 清除缓存
  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    alert('缓存已清除');
  };

  return (
    <div className="pb-20 md:pb-6 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="px-4 py-4 max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Icon icon="mdi:cog" className="text-purple-600" />
            设置
          </h2>
          <p className="text-gray-600 mt-1">管理你的账号和偏好设置</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 账号设置 */}
        <SettingsSection
          icon="mdi:account-circle"
          title="账号设置"
          description="管理你的账号信息和安全设置"
        >
          <SettingsItem
            icon="mdi:key"
            title="修改密码"
            description="定期更新密码以保护账号安全"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordModal(true)}
              >
                修改
              </Button>
            }
          />
          <SettingsItem
            icon="mdi:email"
            title="绑定邮箱"
            description={user?.email || '未绑定'}
            action={
              <Button variant="outline" size="sm">
                {user?.email ? '修改' : '绑定'}
              </Button>
            }
          />
          <SettingsItem
            icon="mdi:phone"
            title="绑定手机"
            description={user?.phone || '未绑定'}
            action={
              <Button variant="outline" size="sm">
                {user?.phone ? '修改' : '绑定'}
              </Button>
            }
          />
        </SettingsSection>

        {/* 通知设置 */}
        <SettingsSection
          icon="mdi:bell"
          title="通知设置"
          description="控制你接收通知的方式和频率"
        >
          <ToggleItem
            icon="mdi:email-outline"
            title="邮件通知"
            description="接收重要活动和更新的邮件"
            checked={settings.emailNotifications}
            onChange={() => handleToggle('emailNotifications')}
          />
          <ToggleItem
            icon="mdi:bell-ring"
            title="推送通知"
            description="在浏览器中接收实时通知"
            checked={settings.pushNotifications}
            onChange={() => handleToggle('pushNotifications')}
          />
          <ToggleItem
            icon="mdi:calendar-week"
            title="每周摘要"
            description="每周收到一封社区动态汇总邮件"
            checked={settings.weeklyDigest}
            onChange={() => handleToggle('weeklyDigest')}
          />
          
          <div className="pt-4 border-t">
            <p className="text-sm font-semibold text-gray-700 mb-3">通知类型</p>
            <div className="space-y-3 pl-4">
              <ToggleItem
                icon="mdi:comment"
                title="评论通知"
                checked={settings.commentNotif}
                onChange={() => handleToggle('commentNotif')}
                compact
              />
              <ToggleItem
                icon="mdi:heart"
                title="点赞通知"
                checked={settings.likeNotif}
                onChange={() => handleToggle('likeNotif')}
                compact
              />
              <ToggleItem
                icon="mdi:account-plus"
                title="关注通知"
                checked={settings.followNotif}
                onChange={() => handleToggle('followNotif')}
                compact
              />
              <ToggleItem
                icon="mdi:calendar"
                title="活动通知"
                checked={settings.eventNotif}
                onChange={() => handleToggle('eventNotif')}
                compact
              />
            </div>
          </div>
        </SettingsSection>

        {/* 隐私设置 */}
        <SettingsSection
          icon="mdi:shield-account"
          title="隐私设置"
          description="控制你的个人信息可见性"
        >
          <ToggleItem
            icon="mdi:account"
            title="公开个人资料"
            description="让其他用户查看你的完整资料"
            checked={settings.showProfile}
            onChange={() => handleToggle('showProfile')}
          />
          <ToggleItem
            icon="mdi:email"
            title="显示邮箱"
            description="在个人主页显示邮箱地址"
            checked={settings.showEmail}
            onChange={() => handleToggle('showEmail')}
          />
          <ToggleItem
            icon="mdi:phone"
            title="显示手机号"
            description="在个人主页显示手机号"
            checked={settings.showPhone}
            onChange={() => handleToggle('showPhone')}
          />
          <ToggleItem
            icon="mdi:account-multiple-plus"
            title="允许关注"
            description="其他用户可以关注你"
            checked={settings.allowFollow}
            onChange={() => handleToggle('allowFollow')}
          />
          <ToggleItem
            icon="mdi:message"
            title="允许私信"
            description="其他用户可以给你发私信"
            checked={settings.allowMessage}
            onChange={() => handleToggle('allowMessage')}
          />
          
          <SettingsItem
            icon="mdi:block-helper"
            title="黑名单"
            description="管理你屏蔽的用户"
            action={
              <Button variant="outline" size="sm" onClick={() => navigate('/settings/blocklist')}>
                管理
              </Button>
            }
          />
        </SettingsSection>

        {/* 偏好设置 */}
        <SettingsSection
          icon="mdi:palette"
          title="偏好设置"
          description="自定义你的使用体验"
        >
          <SettingsItem
            icon="mdi:translate"
            title="语言"
            description="简体中文"
            action={
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            }
          />
          <SettingsItem
            icon="mdi:theme-light-dark"
            title="主题"
            description="亮色模式"
            action={
              <select
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="light">亮色</option>
                <option value="dark">暗色</option>
                <option value="auto">跟随系统</option>
              </select>
            }
          />
          <SettingsItem
            icon="mdi:format-size"
            title="字体大小"
            description="中等"
            action={
              <select
                value={settings.fontSize}
                onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            }
          />
        </SettingsSection>

        {/* 数据管理 */}
        <SettingsSection
          icon="mdi:database"
          title="数据管理"
          description="管理你的数据和缓存"
        >
          <SettingsItem
            icon="mdi:cached"
            title="清除缓存"
            description="清除本地缓存数据"
            action={
              <Button variant="outline" size="sm" onClick={handleClearCache}>
                清除
              </Button>
            }
          />
          <SettingsItem
            icon="mdi:download"
            title="数据导出"
            description="下载你的个人数据"
            action={
              <Button variant="outline" size="sm">
                导出
              </Button>
            }
          />
        </SettingsSection>

        {/* 关于 */}
        <SettingsSection
          icon="mdi:information"
          title="关于"
          description="应用信息和帮助"
        >
          <SettingsItem
            icon="mdi:information-outline"
            title="版本信息"
            description="IEClub v2.0.0"
          />
          <SettingsItem
            icon="mdi:file-document"
            title="用户协议"
            action={
              <Button variant="outline" size="sm" onClick={() => navigate('/terms')}>
                查看
              </Button>
            }
          />
          <SettingsItem
            icon="mdi:shield-check"
            title="隐私政策"
            action={
              <Button variant="outline" size="sm" onClick={() => navigate('/privacy')}>
                查看
              </Button>
            }
          />
          <SettingsItem
            icon="mdi:help-circle"
            title="帮助中心"
            action={
              <Button variant="outline" size="sm" onClick={() => navigate('/help')}>
                访问
              </Button>
            }
          />
        </SettingsSection>

        {/* 账号操作 */}
        <SettingsSection
          icon="mdi:account-cog"
          title="账号操作"
        >
          <div className="space-y-3">
            <Button
              variant="secondary"
              icon="mdi:logout"
              className="w-full"
              onClick={() => setShowLogoutModal(true)}
            >
              退出登录
            </Button>
            <Button
              variant="danger"
              icon="mdi:delete"
              className="w-full"
              onClick={() => setShowDeleteModal(true)}
            >
              注销账号
            </Button>
            <p className="text-xs text-gray-500 text-center">
              注销账号后所有数据将被永久删除且无法恢复
            </p>
                </div>
        </SettingsSection>
              </div>

      {/* 修改密码Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="修改密码"
      >
        <div className="space-y-4">
          <Input
            type="password"
            label="当前密码"
            value={passwordForm.oldPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
            placeholder="请输入当前密码"
            required
          />
          <Input
            type="password"
            label="新密码"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            placeholder="至少6位字符"
            required
          />
          <Input
            type="password"
            label="确认新密码"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            placeholder="再次输入新密码"
            required
          />
          <div className="flex gap-3 pt-2">
            <Button variant="primary" onClick={handleChangePassword} className="flex-1">
              确认修改
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowPasswordModal(false)}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      </Modal>

      {/* 退出登录确认Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="退出登录"
      >
        <div className="text-center py-4">
          <Icon icon="mdi:logout" className="text-6xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 mb-6">确定要退出登录吗？</p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleLogout} className="flex-1">
              确认退出
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowLogoutModal(false)}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      </Modal>

      {/* 注销账号确认Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="注销账号"
      >
        <div className="text-center py-4">
          <Icon icon="mdi:alert-circle" className="text-6xl text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 font-bold mb-2">确定要注销账号吗？</p>
          <p className="text-gray-600 mb-6 text-sm">
            注销后所有数据将被永久删除，此操作不可撤销！
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDeleteAccount} className="flex-1">
              确认注销
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// 设置区块组件
const SettingsSection = ({ icon, title, description, children }) => (
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
    <div className="px-6 py-4 border-b bg-gray-50">
      <div className="flex items-center gap-2 mb-1">
        <Icon icon={icon} className="text-2xl text-purple-600" />
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>
      {description && <p className="text-sm text-gray-600 ml-8">{description}</p>}
    </div>
    <div className="p-6 space-y-4">
      {children}
    </div>
  </div>
);

// 设置项组件
const SettingsItem = ({ icon, title, description, action }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-start gap-3 flex-1">
      <Icon icon={icon} className="text-xl text-gray-600 mt-0.5" />
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
    </div>
    {action && <div className="ml-4">{action}</div>}
  </div>
);

// 开关项组件
const ToggleItem = ({ icon, title, description, checked, onChange, compact = false }) => (
  <div className={`flex items-center justify-between ${compact ? 'py-1' : 'py-2'}`}>
    <div className="flex items-start gap-3 flex-1">
      <Icon icon={icon} className={`${compact ? 'text-lg' : 'text-xl'} text-gray-600 mt-0.5`} />
      <div>
        <p className={`${compact ? 'text-sm' : ''} font-semibold text-gray-800`}>{title}</p>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
    </div>
    <button
      onClick={onChange}
      className={`relative ${compact ? 'w-11 h-6' : 'w-14 h-8'} rounded-full transition-colors ${
        checked ? 'bg-purple-600' : 'bg-gray-300'
      }`}
    >
      <div
        className={`absolute ${compact ? 'top-0.5 left-0.5 w-5 h-5' : 'top-1 left-1 w-6 h-6'} bg-white rounded-full transition-transform shadow-sm ${
          checked ? `transform ${compact ? 'translate-x-5' : 'translate-x-6'}` : ''
        }`}
      ></div>
    </button>
  </div>
);

export default SettingsPage;
