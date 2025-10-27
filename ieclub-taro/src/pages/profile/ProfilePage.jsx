import React, { useState } from 'react';
import { useAuth } from '../../store/AuthContext.jsx';
// 导入所有需要的通用组件
import { Button } from '../../components/common/Button.jsx';
import { Tag } from '../../components/common/Tag.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
// 导入所有需要的图标
import { Edit3, FileText, Users, Heart, Award, Camera, Shield, Star, Plus } from 'lucide-react';
// 导入API
import api from '../../services/api.js';

// ==================== 个人主页 (主导出组件) ====================
export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const stats = [
    { label: '帖子', value: 12, icon: FileText },
    { label: '粉丝', value: user?.followers || 23, icon: Users },
    { label: '关注', value: user?.following || 45, icon: Heart },
    { label: '声望', value: user?.reputation || 156, icon: Award }
  ];

  const userProjects = [
    { id: 1, title: 'AI学习助手', description: '基于大模型的个性化学习推荐系统，已服务100+用户', status: 'ongoing', tags: ['AI', 'Python', 'Education'], stars: 23 },
    { id: 2, title: '跨学科知识图谱', description: '连接不同学科知识点的可视化平台，获校级创新奖', status: 'completed', tags: ['知识图谱', 'D3.js', '可视化'], stars: 45 }
  ];

  // OCR功能已移至发布和评论场景，这里不再需要

  return (
    <div className="pb-20 md:pb-6">
      {/* 个人信息卡片 - 优化移动端布局 */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-b-3xl md:rounded-3xl overflow-hidden shadow-xl relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="p-4 md:p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left w-full md:w-auto">
              <Avatar src={user?.avatar} size="xl" status="online" className="ring-4 ring-white/30" />
              <div className="flex-1">
                <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-2">
                  <h2 className="text-2xl md:text-4xl font-bold">{user?.username || '用户'}</h2>
                  <Shield size={20} className="md:w-6 md:h-6" fill="white" />
                </div>
                <p className="text-base md:text-xl opacity-90 mb-1">{user?.major || '专业'}</p>
                <p className="text-sm md:text-lg opacity-75">{user?.school || '学校'} · {user?.grade || '年级'}</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              icon={Edit3} 
              onClick={() => setIsEditing(true)}
              className="w-full md:w-auto"
            >
              编辑资料
            </Button>
          </div>
        </div>
      </div>

      {/* 统计数据 - 优化移动端间距 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-4 md:px-0 mt-4 md:mt-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-4 md:p-6 rounded-xl border shadow-sm hover:shadow-md transition-all text-center">
              <Icon size={20} className="md:w-6 md:h-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">{stat.value}</p>
              <p className="text-xs md:text-sm text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-xl md:rounded-xl mx-4 md:mx-0 shadow-sm border overflow-hidden mt-4 md:mt-6">
        <div className="flex border-b overflow-x-auto">
          {['posts', 'projects'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`flex-1 min-w-[100px] px-4 md:px-6 py-3 md:py-4 font-semibold text-sm md:text-base transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'posts' && '我的帖子'} 
              {tab === 'projects' && '我的项目'}
            </button>
          ))}
        </div>
        <div className="p-4 md:p-6">
          {activeTab === 'posts' && (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">还没有发布帖子</p>
              <Button variant="primary" icon={Plus}>发布第一篇帖子</Button>
            </div>
          )}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              {userProjects.map(project => (
                <div key={project.id} className="border-l-4 border-blue-500 pl-6 py-4 hover:bg-gray-50 rounded-r-lg transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-xl text-gray-800">{project.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${project.status === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {project.status === 'ongoing' ? '进行中' : '已完成'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={16} fill="currentColor" />
                      <span className="font-semibold">{project.stars}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">{project.description}</p>
                  <div className="flex gap-2">
                    {project.tags.map((tag, idx) => (<Tag key={idx} variant="gray">{tag}</Tag>))}
                  </div>
                </div>
              ))}
              <Button variant="outline" icon={Plus} className="w-full">添加新项目</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};