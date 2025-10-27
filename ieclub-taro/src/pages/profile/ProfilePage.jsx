import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Button } from '../../components/common/Button.jsx';
import { Tag } from '../../components/common/Tag.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Input } from '../../components/common/Input.jsx';
import { TextArea } from '../../components/common/TextArea.jsx';

/**
 * 个人主页组件 - 深度优化版
 * 功能：
 * - 个人信息展示（头像、封面、基本信息）
 * - 数据统计可视化
 * - 动态流展示
 * - Tab切换（动态/话题/项目/活动/成就/关于我）
 * - 关注/粉丝列表
 * - 资料编辑（超详细）
 * - 成就与勋章系统
 * - 技能展示
 * - 访客记录
 */
export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('timeline'); // timeline, topics, projects, events, achievements, about
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // 编辑表单数据
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    cover: user?.cover || '',
    school: user?.school || '',
    major: user?.major || '',
    grade: user?.grade || '',
    email: user?.email || '',
    phone: user?.phone || '',
    github: user?.github || '',
    website: user?.website || '',
  });

  // 技能列表
  const [skills, setSkills] = useState([
    { id: 1, name: 'Python', level: 4, category: '编程语言' },
    { id: 2, name: '机器学习', level: 3, category: 'AI/ML' },
    { id: 3, name: 'React', level: 4, category: '前端开发' },
    { id: 4, name: '数据分析', level: 3, category: '数据科学' },
  ]);

  // 统计数据
  const stats = [
    { label: '话题', value: user?.topicCount || 12, icon: 'mdi:text-box', color: 'blue', link: () => setActiveTab('topics') },
    { label: '粉丝', value: user?.followers || 234, icon: 'mdi:account-group', color: 'purple', link: '/followers' },
    { label: '关注', value: user?.following || 156, icon: 'mdi:heart', color: 'pink', link: '/following' },
    { label: '声望', value: user?.reputation || 1520, icon: 'mdi:star', color: 'yellow', link: () => setActiveTab('achievements') },
    { label: '项目', value: user?.projectCount || 8, icon: 'mdi:folder-multiple', color: 'green', link: () => setActiveTab('projects') },
    { label: '活动', value: user?.eventCount || 15, icon: 'mdi:calendar', color: 'teal', link: () => setActiveTab('events') },
  ];

  // 成就数据
  const achievements = [
    { id: 1, name: '初来乍到', icon: 'mdi:account-check', description: '完成账号注册', unlocked: true, date: '2025-09-01' },
    { id: 2, name: '话题达人', icon: 'mdi:message-star', description: '发布10个话题', unlocked: true, date: '2025-09-15' },
    { id: 3, name: '人气之星', icon: 'mdi:fire', description: '获得100个粉丝', unlocked: true, date: '2025-10-01' },
    { id: 4, name: '技术专家', icon: 'mdi:code-braces', description: '发布5个技术项目', unlocked: true, date: '2025-10-10' },
    { id: 5, name: '社交达人', icon: 'mdi:handshake', description: '参与20个活动', unlocked: false, progress: 15, total: 20 },
    { id: 6, name: '知识分享者', icon: 'mdi:book-open-variant', description: '获得500声望值', unlocked: false, progress: 1520, total: 500, achieved: true },
  ];

  // 用户动态（模拟数据）
  const timeline = [
    { id: 1, type: 'topic', title: '分享了一个新话题', content: 'AI时代的教育变革思考', time: '2小时前', likes: 23 },
    { id: 2, type: 'event', title: '参加了活动', content: '跨学科创新论坛', time: '昨天', likes: 12 },
    { id: 3, type: 'project', title: '发布了新项目', content: 'AI学习助手v2.0', time: '3天前', likes: 45 },
    { id: 4, type: 'achievement', title: '获得新成就', content: '人气之星', time: '1周前', likes: 67 },
  ];

  // 我的话题
  const myTopics = [
    { id: 1, title: 'AI时代的教育变革思考', type: 'offer', views: 234, likes: 45, comments: 12, date: '2025-10-20' },
    { id: 2, title: '寻找机器学习学习小伙伴', type: 'demand', views: 156, likes: 23, comments: 8, date: '2025-10-18' },
  ];

  // 我的项目
  const myProjects = [
    { id: 1, title: 'AI学习助手', description: '基于大模型的个性化学习推荐系统', status: 'ongoing', tags: ['AI', 'Python', 'Education'], stars: 23, members: 5 },
    { id: 2, title: '跨学科知识图谱', description: '连接不同学科知识点的可视化平台', status: 'completed', tags: ['知识图谱', 'D3.js', '可视化'], stars: 45, members: 3 },
  ];

  // 我的活动
  const myEvents = [
    { id: 1, title: '跨学科创新论坛', date: '2025-10-15', role: 'participant', status: 'attended' },
    { id: 2, title: 'Python数据分析工作坊', date: '2025-10-12', role: 'organizer', status: 'attended' },
  ];

  // 处理资料编辑
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // TODO: 调用API更新用户信息
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      updateUser(editForm);
      setShowEditModal(false);
      alert('资料更新成功！');
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取类型图标
  const getTypeIcon = (type) => {
    const icons = {
      topic: 'mdi:message-text',
      event: 'mdi:calendar-check',
      project: 'mdi:folder',
      achievement: 'mdi:trophy',
    };
    return icons[type] || 'mdi:circle';
  };

  // 获取类型颜色
  const getTypeColor = (type) => {
    const colors = {
      topic: 'blue',
      event: 'green',
      project: 'purple',
      achievement: 'yellow',
    };
    return colors[type] || 'gray';
  };

  return (
    <div className="pb-20 md:pb-6 bg-gray-50">
      {/* 封面和个人信息区域 */}
      <div className="relative bg-white mb-6">
        {/* 封面图 */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
          {user?.cover && <img src={user.cover} alt="封面" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
          
          {/* 编辑封面按钮 */}
          <button className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors">
            <Icon icon="mdi:camera" className="text-xl" />
          </button>
        </div>

        {/* 个人信息 */}
        <div className="px-4 md:px-6 pb-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-16 md:-mt-20 relative z-10">
            {/* 头像 */}
            <div className="relative">
              <Avatar 
                src={user?.avatar} 
                name={user?.username}
                size="2xl" 
                className="ring-4 ring-white shadow-xl"
              />
              <button className="absolute bottom-0 right-0 p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white shadow-lg transition-colors">
                <Icon icon="mdi:camera" className="text-lg" />
              </button>
              {/* 在线状态 */}
              <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
                </div>

            {/* 基本信息 */}
            <div className="flex-1 text-center md:text-left mt-4 md:mt-0 mb-4 md:mb-0">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  {user?.username || '用户名'}
                </h1>
                <Icon icon="mdi:check-decagram" className="text-2xl text-blue-500" title="认证用户" />
              </div>
              <p className="text-gray-600 mb-1">{user?.major || '专业未设置'}</p>
              <p className="text-sm text-gray-500">
                {user?.school || '学校未设置'} · {user?.grade || '年级未设置'}
              </p>
              {user?.bio && (
                <p className="text-gray-700 mt-3 max-w-2xl">{user.bio}</p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
            <Button 
                variant="primary"
                icon="mdi:pencil"
                onClick={() => setShowEditModal(true)}
            >
              编辑资料
            </Button>
              <Button
                variant="outline"
                icon="mdi:share-variant"
              >
                分享
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 统计数据卡片 */}
      <div className="px-4 md:px-6 mb-6">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {stats.map((stat, idx) => (
            <button 
              key={idx}
              onClick={() => typeof stat.link === 'function' ? stat.link() : navigate(stat.link)}
              className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all text-center group"
            >
              <Icon 
                icon={stat.icon} 
                className={`text-3xl mx-auto mb-2 text-${stat.color}-500 group-hover:scale-110 transition-transform`}
              />
              <p className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tab导航 */}
      <div className="px-4 md:px-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="flex border-b overflow-x-auto scrollbar-hide">
            <TabButton
              active={activeTab === 'timeline'}
              onClick={() => setActiveTab('timeline')}
              icon="mdi:timeline-text"
            >
              动态
            </TabButton>
            <TabButton
              active={activeTab === 'topics'}
              onClick={() => setActiveTab('topics')}
              icon="mdi:message-text"
            >
              话题
            </TabButton>
            <TabButton
              active={activeTab === 'projects'}
              onClick={() => setActiveTab('projects')}
              icon="mdi:folder-multiple"
            >
              项目
            </TabButton>
            <TabButton
              active={activeTab === 'events'}
              onClick={() => setActiveTab('events')}
              icon="mdi:calendar-multiple"
            >
              活动
            </TabButton>
            <TabButton
              active={activeTab === 'achievements'}
              onClick={() => setActiveTab('achievements')}
              icon="mdi:trophy"
            >
              成就
            </TabButton>
            <TabButton
              active={activeTab === 'about'}
              onClick={() => setActiveTab('about')}
              icon="mdi:account-details"
            >
              关于我
            </TabButton>
          </div>

          <div className="p-6">
            {/* 动态Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {timeline.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-${getTypeColor(item.type)}-100 flex items-center justify-center`}>
                      <Icon icon={getTypeIcon(item.type)} className={`text-2xl text-${getTypeColor(item.type)}-600`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 mb-1">{item.title}</p>
                      <p className="text-gray-700 mb-2">{item.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{item.time}</span>
                        <button className="flex items-center gap-1 hover:text-red-600 transition-colors">
                          <Icon icon="mdi:heart-outline" />
                          <span>{item.likes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

            {/* 话题Tab */}
            {activeTab === 'topics' && (
            <div className="space-y-4">
                {myTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="p-4 border rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/topics/${topic.id}`)}
                  >
                  <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-gray-800 flex-1">{topic.title}</h3>
                      <Tag variant={topic.type === 'offer' ? 'blue' : 'purple'} size="sm">
                        {topic.type === 'offer' ? '我来讲' : '想听'}
                      </Tag>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Icon icon="mdi:eye" />
                        {topic.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon icon="mdi:heart" />
                        {topic.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon icon="mdi:comment" />
                        {topic.comments}
                      </span>
                      <span className="ml-auto">{topic.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 项目Tab */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                {myProjects.map((project) => (
                  <div
                    key={project.id}
                    className="border-l-4 border-purple-500 pl-6 py-4 bg-gray-50 rounded-r-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-xl text-gray-800 mb-1">{project.title}</h3>
                        <Tag
                          variant={project.status === 'ongoing' ? 'green' : 'blue'}
                          size="sm"
                        >
                          {project.status === 'ongoing' ? '进行中' : '已完成'}
                        </Tag>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Icon icon="mdi:star" className="text-yellow-500" />
                          {project.stars}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon icon="mdi:account-group" />
                          {project.members}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{project.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      {project.tags.map((tag, idx) => (
                        <Tag key={idx} variant="gray" size="sm">#{tag}</Tag>
                      ))}
                    </div>
                  </div>
                ))}
                <Button variant="outline" icon="mdi:plus" className="w-full">
                  添加新项目
                </Button>
              </div>
            )}

            {/* 活动Tab */}
            {activeTab === 'events' && (
              <div className="space-y-4">
                {myEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Icon icon="mdi:calendar-check" className="text-2xl text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{event.title}</h4>
                        <p className="text-sm text-gray-600">{event.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag variant={event.role === 'organizer' ? 'purple' : 'blue'} size="sm">
                        {event.role === 'organizer' ? '主办方' : '参与者'}
                      </Tag>
                      <Tag variant="green" size="sm">已参加</Tag>
                    </div>
                </div>
              ))}
            </div>
          )}

            {/* 成就Tab */}
            {activeTab === 'achievements' && (
            <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">我的勋章</h3>
                    <span className="text-sm text-gray-600">
                      已解锁 {achievements.filter(a => a.unlocked).length}/{achievements.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          achievement.unlocked || achievement.achieved
                            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400 shadow-md'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <Icon
                          icon={achievement.icon}
                          className={`text-5xl mx-auto mb-2 ${
                            achievement.unlocked || achievement.achieved ? 'text-yellow-600' : 'text-gray-400'
                          }`}
                        />
                        <h4 className="font-bold text-gray-800 mb-1">{achievement.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                        {achievement.unlocked && achievement.date && (
                          <p className="text-xs text-gray-500">解锁于 {achievement.date}</p>
                        )}
                        {!achievement.unlocked && achievement.progress !== undefined && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-500 h-2 rounded-full transition-all"
                                style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {achievement.progress}/{achievement.total}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 声望值趋势（可以添加图表） */}
                <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">声望值</h3>
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-4xl font-bold text-purple-600">{user?.reputation || 1520}</p>
                      <p className="text-sm text-gray-600">当前声望</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">+156</p>
                      <p className="text-sm text-gray-600">本周增长</p>
                    </div>
                  </div>
                  {/* TODO: 添加声望趋势图表 */}
                </div>
              </div>
            )}

            {/* 关于我Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                {/* 技能 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">技能专长</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      icon="mdi:plus"
                      onClick={() => setShowSkillModal(true)}
                    >
                      添加技能
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {skills.map((skill) => (
                      <div key={skill.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-semibold text-gray-800">{skill.name}</span>
                            <span className="text-sm text-gray-500 ml-2">· {skill.category}</span>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <Icon
                                key={level}
                                icon={level <= skill.level ? 'mdi:star' : 'mdi:star-outline'}
                                className={`text-lg ${level <= skill.level ? 'text-yellow-500' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 联系方式 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">联系方式</h3>
                  <div className="space-y-3">
                    {user?.email && (
                      <InfoItem icon="mdi:email" label="邮箱" value={user.email} />
                    )}
                    {user?.phone && (
                      <InfoItem icon="mdi:phone" label="电话" value={user.phone} />
                    )}
                    {user?.github && (
                      <InfoItem icon="mdi:github" label="GitHub" value={user.github} link />
                    )}
                    {user?.website && (
                      <InfoItem icon="mdi:web" label="个人网站" value={user.website} link />
                    )}
                  </div>
                </div>

                {/* 教育背景 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">教育背景</h3>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Icon icon="mdi:school" className="text-2xl text-blue-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-800">{user?.school || '学校未设置'}</p>
                        <p className="text-gray-600">{user?.major || '专业未设置'}</p>
                        <p className="text-sm text-gray-500">{user?.grade || '年级未设置'}</p>
                      </div>
                    </div>
                  </div>
              </div>
              </div>
            )}
            </div>
        </div>
      </div>

      {/* 编辑资料Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑个人资料"
        size="large"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="用户名"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              required
            />
            <Input
              label="邮箱"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>

          <TextArea
            label="个人简介"
            value={editForm.bio}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            placeholder="介绍一下自己吧..."
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="学校"
              value={editForm.school}
              onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
            />
            <Input
              label="专业"
              value={editForm.major}
              onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
            />
            <Input
              label="年级"
              value={editForm.grade}
              onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="GitHub"
              value={editForm.github}
              onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
              placeholder="https://github.com/username"
            />
            <Input
              label="个人网站"
              value={editForm.website}
              onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="primary"
              onClick={handleSaveProfile}
              disabled={loading}
              className="flex-1"
            >
              {loading ? '保存中...' : '保存'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowEditModal(false)}
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

// Tab按钮组件
const TabButton = ({ active, onClick, icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 font-semibold whitespace-nowrap transition-all ${
      active
        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
    }`}
  >
    <Icon icon={icon} className="text-lg" />
    <span>{children}</span>
  </button>
);

// 信息项组件
const InfoItem = ({ icon, label, value, link }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
    <Icon icon={icon} className="text-xl text-gray-600" />
    <div className="flex-1">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">
          {value}
        </a>
      ) : (
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      )}
    </div>
  </div>
);

export default ProfilePage;
