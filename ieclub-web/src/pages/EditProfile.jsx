import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Globe, X, Plus } from 'lucide-react';
import request from '../utils/request';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';
import AvatarUpload from '../components/AvatarUpload';
import CoverUpload from '../components/CoverUpload';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    nickname: '',
    avatar: '',
    gender: '',
    bio: '',
    coverImage: '',
    motto: '',
    introduction: '',
    website: '',
    github: '',
    bilibili: '',
    wechat: '',
    school: '',
    major: '',
    grade: '',
    skills: [],
    interests: [],
    projects: []
  });
  
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await request.get(`/profile/${user.id}`);
      const profile = res.data || res;
      
      setForm({
        nickname: profile.nickname || '',
        avatar: profile.avatar || '',
        gender: profile.gender || '',
        bio: profile.bio || '',
        coverImage: profile.coverImage || '',
        motto: profile.motto || '',
        introduction: profile.introduction || '',
        website: profile.website || '',
        github: profile.github || '',
        bilibili: profile.bilibili || '',
        wechat: profile.wechat || '',
        school: profile.school || '',
        major: profile.major || '',
        grade: profile.grade || '',
        skills: profile.skills || [],
        interests: profile.interests || [],
        projects: profile.projects || []
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
      showToast(error.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (!skill) return;
    if (form.skills.includes(skill)) {
      showToast('技能已存在', 'warning');
      return;
    }
    setForm(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    setSkillInput('');
  };

  const deleteSkill = (index) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addInterest = () => {
    const interest = interestInput.trim();
    if (!interest) return;
    if (form.interests.includes(interest)) {
      showToast('兴趣已存在', 'warning');
      return;
    }
    setForm(prev => ({ ...prev, interests: [...prev.interests, interest] }));
    setInterestInput('');
  };
  
  const deleteInterest = (index) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔥🔥🔥 [保存] handleSubmit被触发！时间:', new Date().toISOString());
    console.log('🔥 [保存] Token存在:', !!localStorage.getItem('token'));
    console.log('🔥 [保存] User ID:', user?.id);
    console.log('🔥 [保存] 当前昵称:', form.nickname);
    
    if (!form.nickname || form.nickname.trim().length < 2) {
      console.error('❌ [保存] 昵称验证失败:', form.nickname);
      showToast('昵称至少2个字符', 'warning');
      return;
    }
    
    console.log('✅ [保存] 昵称验证通过，准备提交...');

    setSubmitting(true);
    try {
      const submitData = {
        nickname: form.nickname.trim(),
        avatar: form.avatar,
        gender: form.gender,
        bio: form.bio.trim(),
        coverImage: form.coverImage,
        motto: form.motto.trim(),
        introduction: form.introduction.trim(),
        website: form.website.trim(),
        github: form.github.trim(),
        bilibili: form.bilibili.trim(),
        wechat: form.wechat.trim(),
        school: form.school.trim(),
        major: form.major.trim(),
        grade: form.grade.trim(),
        skills: form.skills,
        interests: form.interests,
        projects: form.projects
      };
      
      console.log('� [保存] 提交数据:', submitData);
      console.log('📤 [保存] 正在发送PUT /profile请求...');
      
      const res = await request.put('/profile', submitData);
      
      console.log('� [保存] 收到响应:', res);
      console.log('📥 [保存] 响应类型:', typeof res, '是否为对象:', typeof res === 'object');

      // 更新用户信息 - res已经是data对象（响应拦截器处理过）
      if (user && res) {
        const updatedUserData = {
          ...user,
          // 完整更新所有返回的字段
          ...res
        };
        console.log('💾 [保存] 更新本地用户数据:', updatedUserData);
        updateUser(updatedUserData);
        console.log('✅ [保存] 本地状态已更新，字段数:', Object.keys(updatedUserData).length);
      } else {
        console.warn('⚠️ [保存] 未更新本地状态 - user:', !!user, 'res:', !!res);
      }

      showToast('保存成功！', 'success');
      console.log('🎉 [保存] 显示成功提示，准备跳转...');
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        console.log('🔄 [保存] 跳转到个人主页:', `/profile/${user.id}`);
        navigate(`/profile/${user.id}`);
      }, 800);
    } catch (error) {
      console.error('保存失败:', error);
      showToast(error.message || '保存失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* 页面标题 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">编辑资料</h1>
            <p className="text-sm text-gray-500 mt-1">完善你的个人信息，让大家更了解你</p>
          </div>

          <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
            {/* 基本信息 */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                基本信息
              </h2>

              <div className="space-y-6">
                {/* 头像上传 - 支持裁剪 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">头像</label>
                  <AvatarUpload
                    currentAvatar={form.avatar}
                    onAvatarChange={(url) => setForm(prev => ({ ...prev, avatar: url }))}
                    size={96}
                    disabled={submitting}
                  />
                </div>

                {/* 封面图上传 - 支持裁剪和渐变 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">主页封面</label>
                  <CoverUpload
                    currentCover={form.coverImage}
                    onCoverChange={(url) => setForm(prev => ({ ...prev, coverImage: url }))}
                    aspectRatio={3}
                    disabled={submitting}
                  />
                </div>

                {/* 昵称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    昵称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nickname}
                    onChange={(e) => handleChange('nickname', e.target.value)}
                    placeholder="请输入昵称（2-20字符）"
                    maxLength={20}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* 性别 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
                  <select
                    value={form.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">保密</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>

                {/* 个人简介 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="一句话介绍自己..."
                    maxLength={100}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  <div className="text-right text-xs text-gray-400 mt-1">{form.bio.length}/100</div>
                </div>
              </div>
            </div>

            {/* 主页信息 */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">主页信息</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">座右铭</label>
                  <input
                    type="text"
                    value={form.motto}
                    onChange={(e) => handleChange('motto', e.target.value)}
                    placeholder="你的座右铭或口号..."
                    maxLength={50}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">详细介绍</label>
                  <textarea
                    value={form.introduction}
                    onChange={(e) => handleChange('introduction', e.target.value)}
                    placeholder="详细介绍自己的背景、经历、特长等..."
                    maxLength={500}
                    rows={5}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  <div className="text-right text-xs text-gray-400 mt-1">{form.introduction.length}/500</div>
                </div>
              </div>
            </div>

            {/* 社交链接 */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                社交链接
              </h2>

              <div className="space-y-4">
                {[
                  { field: 'website', label: '个人网站', icon: '🌐', placeholder: 'https://...' },
                  { field: 'github', label: 'GitHub', icon: '💻', placeholder: 'GitHub用户名或链接' },
                  { field: 'bilibili', label: 'B站', icon: '📺', placeholder: 'B站用户名或链接' },
                  { field: 'wechat', label: '微信', icon: '💬', placeholder: '微信号' }
                ].map(item => (
                  <div key={item.field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </label>
                    <input
                      type="text"
                      value={form[item.field]}
                      onChange={(e) => handleChange(item.field, e.target.value)}
                      placeholder={item.placeholder}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 学校信息 */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">学校信息</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">学校</label>
                  <input
                    type="text"
                    value={form.school}
                    onChange={(e) => handleChange('school', e.target.value)}
                    placeholder="学校名称"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">专业</label>
                  <input
                    type="text"
                    value={form.major}
                    onChange={(e) => handleChange('major', e.target.value)}
                    placeholder="专业"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">年级</label>
                  <input
                    type="text"
                    value={form.grade}
                    onChange={(e) => handleChange('grade', e.target.value)}
                    placeholder="如：2021级"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* 技能标签 */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">技能标签</h2>

              <div className="flex flex-wrap gap-2 mb-4 min-h-[60px]">
                {form.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-sm font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => deleteSkill(index)}
                      className="hover:opacity-80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="输入技能标签"
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>
            </div>

            {/* 兴趣爱好 */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">兴趣爱好</h2>

              <div className="flex flex-wrap gap-2 mb-4 min-h-[60px]">
                {form.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-sm font-medium"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => deleteInterest(index)}
                      className="hover:opacity-80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                  placeholder="输入兴趣标签"
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={addInterest}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="p-6 bg-gray-50">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition ${
                    submitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg'
                  }`}
                >
                  {submitting ? '保存中...' : '保存资料'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
