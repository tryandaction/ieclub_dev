/**
 * 统一的发布模态框
 * 支持发布：话题、项目、活动
 */
import React, { useState } from 'react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import { TextArea } from './TextArea.jsx';
import { Tag } from './Tag.jsx';
import { X, Image as ImageIcon, MapPin, Calendar, Users, Rocket, MessageSquare, Lightbulb, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';

const PublishModal = ({ isOpen, onClose }) => {
  const [publishType, setPublishType] = useState(null); // 'topic' | 'project' | 'event'
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [],
    category: '',
    // 话题特有
    topicType: 'offer', // 'offer' | 'demand'
    format: 'online', // 'online' | 'offline' | 'hybrid'
    // 项目特有
    projectStage: '',
    recruiting: true,
    // 活动特有
    eventDate: '',
    eventLocation: '',
    maxParticipants: '',
  });

  const [tagInput, setTagInput] = useState('');

  const handleClose = () => {
    setPublishType(null);
    setFormData({
      title: '',
      content: '',
      tags: [],
      category: '',
      topicType: 'offer',
      format: 'online',
      projectStage: '',
      recruiting: true,
      eventDate: '',
      eventLocation: '',
      maxParticipants: '',
    });
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags.length < 5) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = () => {
    console.log('发布内容:', { type: publishType, ...formData });
    // TODO: 调用API
    handleClose();
  };

  // 选择发布类型界面
  const renderTypeSelection = () => (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        选择发布类型
      </h2>

      <button
        onClick={() => setPublishType('topic')}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-2xl hover:shadow-xl transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm">
            💬
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-xl font-bold mb-1">发布话题</h3>
            <p className="text-sm opacity-90">分享知识（我来讲）或寻求帮助（想听）</p>
          </div>
          <ArrowRight size={20} className="opacity-60 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>

      <button
        onClick={() => setPublishType('project')}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-2xl hover:shadow-xl transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm">
            🚀
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-xl font-bold mb-1">发布项目</h3>
            <p className="text-sm opacity-90">项目宣传或招募团队成员</p>
          </div>
          <ArrowRight size={20} className="opacity-60 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>

      <button
        onClick={() => setPublishType('event')}
        className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white p-6 rounded-2xl hover:shadow-xl transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm">
            📅
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-xl font-bold mb-1">发布活动</h3>
            <p className="text-sm opacity-90">组织线上/线下活动</p>
          </div>
          <ArrowRight size={20} className="opacity-60 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    </div>
  );

  // 话题发布表单
  const renderTopicForm = () => (
    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">发布话题</h2>
        <button onClick={() => setPublishType(null)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* 话题类型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">话题类型</label>
        <div className="flex gap-3">
          <button
            onClick={() => setFormData({ ...formData, topicType: 'offer' })}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              formData.topicType === 'offer'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            💡 我来讲
          </button>
          <button
            onClick={() => setFormData({ ...formData, topicType: 'demand' })}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              formData.topicType === 'demand'
                ? 'bg-pink-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🙋 想听
          </button>
        </div>
      </div>

      {/* 标题 */}
      <Input
        label="标题"
        placeholder="给你的话题起个吸引人的标题"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        maxLength={50}
      />

      {/* 内容 */}
      <TextArea
        label="详细描述"
        placeholder="详细描述你要分享的内容或想要学习的内容..."
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        rows={6}
        maxLength={500}
      />

      {/* 形式 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">交流形式</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'online', label: '线上', icon: '🌐' },
            { value: 'offline', label: '线下', icon: '📍' },
            { value: 'hybrid', label: '混合', icon: '🔄' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFormData({ ...formData, format: option.value })}
              className={`py-2 rounded-lg font-medium transition-all ${
                formData.format === option.value
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.icon} {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 标签 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          标签 ({formData.tags.length}/5)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="添加标签"
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            maxLength={10}
          />
          <Button onClick={handleAddTag} disabled={!tagInput.trim() || formData.tags.length >= 5}>
            添加
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <Tag
              key={index}
              label={`#${tag}`}
              onRemove={() => handleRemoveTag(index)}
              removable
            />
          ))}
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          取消
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!formData.title.trim() || !formData.content.trim()}
          className="flex-1"
        >
          发布
        </Button>
      </div>
    </div>
  );

  // 项目发布表单
  const renderProjectForm = () => (
    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">发布项目</h2>
        <button onClick={() => setPublishType(null)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
      </div>

      <Input
        label="项目名称"
        placeholder="给你的项目起个名字"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        maxLength={50}
      />

      <TextArea
        label="项目描述"
        placeholder="详细介绍你的项目，包括目标、技术栈、当前进度等..."
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        rows={6}
        maxLength={500}
      />

      <Input
        label="项目阶段"
        placeholder="例如：筹备中、开发中、MVP完成"
        value={formData.projectStage}
        onChange={(e) => setFormData({ ...formData, projectStage: e.target.value })}
      />

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.recruiting}
            onChange={(e) => setFormData({ ...formData, recruiting: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm font-medium text-gray-700">正在招募团队成员</span>
        </label>
      </div>

      {/* 标签 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          技术标签 ({formData.tags.length}/5)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="添加技术标签"
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            maxLength={10}
          />
          <Button onClick={handleAddTag} disabled={!tagInput.trim() || formData.tags.length >= 5}>
            添加
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <Tag
              key={index}
              label={`#${tag}`}
              onRemove={() => handleRemoveTag(index)}
              removable
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          取消
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!formData.title.trim() || !formData.content.trim()}
          className="flex-1"
        >
          发布项目
        </Button>
      </div>
    </div>
  );

  // 活动发布表单
  const renderEventForm = () => (
    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">发布活动</h2>
        <button onClick={() => setPublishType(null)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
      </div>

      <Input
        label="活动名称"
        placeholder="给活动起个名字"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        maxLength={50}
      />

      <TextArea
        label="活动描述"
        placeholder="详细描述活动内容、流程、注意事项等..."
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        rows={6}
        maxLength={500}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="活动时间"
          type="datetime-local"
          value={formData.eventDate}
          onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
        />
        <Input
          label="人数限制"
          type="number"
          placeholder="最多人数"
          value={formData.maxParticipants}
          onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
        />
      </div>

      <Input
        label="活动地点"
        placeholder="线下地点或线上链接"
        value={formData.eventLocation}
        onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
      />

      {/* 标签 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          活动标签 ({formData.tags.length}/5)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="添加标签"
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            maxLength={10}
          />
          <Button onClick={handleAddTag} disabled={!tagInput.trim() || formData.tags.length >= 5}>
            添加
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <Tag
              key={index}
              label={`#${tag}`}
              onRemove={() => handleRemoveTag(index)}
              removable
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          取消
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!formData.title.trim() || !formData.content.trim() || !formData.eventDate}
          className="flex-1"
        >
          发布活动
        </Button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="lg">
      {!publishType && renderTypeSelection()}
      {publishType === 'topic' && renderTopicForm()}
      {publishType === 'project' && renderProjectForm()}
      {publishType === 'event' && renderEventForm()}
    </Modal>
  );
};

export default PublishModal;

