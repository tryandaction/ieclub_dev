/**
 * 专业级发布模态框
 * 支持三种类型：我来讲、想听、项目
 * 完全按照README.md设计规范实现
 */
import React, { useState, useEffect } from 'react';
import Icon from './Icon.jsx';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import { TextArea } from './TextArea.jsx';
import FileUpload from './FileUpload.jsx';
import OCRUploader from './OCRUploader.jsx';
import api from '../../services/api.js';
import { useToast } from './Toast.jsx';

const PublishModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [step, setStep] = useState('select'); // 'select' | 'offer' | 'demand' | 'project'
  const [formData, setFormData] = useState({
    // 通用字段
    title: '',
    description: '',
    category: 'study',
    tags: [],
    
    // "我来讲"特有字段
    availableTimes: [],
    duration: '2',
    flexibility: 'high',
    format: 'offline',
    location: '',
    maxParticipants: '30',
    targetAudience: [],
    prerequisites: 'none',
    
    // "想听"特有字段
    urgency: 'thisWeek',
    learningFormat: 'oneOnOne',
    preferOnline: true,
    preferOffline: true,
    budget: 'free',
    budgetAmount: '',
    
    // "项目"特有字段
    projectType: 'startup',
    projectStage: 'idea',
    teamSize: '',
    recruiting: true,
    positions: [],
    resourceNeeds: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [timeSlot, setTimeSlot] = useState({ day: 'monday', startTime: '', endTime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [positionInput, setPositionInput] = useState({ name: '', count: '1', requirement: '' });

  // 自动保存草稿（每30秒）
  useEffect(() => {
    if (!isOpen || step === 'select') return;

    const saveDraft = () => {
      const draftKey = `draft_${step}`;
      const draftData = {
        step,
        formData,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setDraftSaving(true);
      setTimeout(() => setDraftSaving(false), 1000);
    };

    const timer = setInterval(saveDraft, 30000); // 每30秒保存一次
    return () => clearInterval(timer);
  }, [isOpen, step, formData]);

  // 加载草稿
  useEffect(() => {
    if (!isOpen) return;
    
    const loadDraft = (type) => {
      const draftKey = `draft_${type}`;
      const draftStr = localStorage.getItem(draftKey);
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          const savedTime = new Date(draft.savedAt);
          const now = new Date();
          const hoursSinceLastSave = (now - savedTime) / 1000 / 60 / 60;
          
          // 如果草稿在24小时内，询问是否恢复
          if (hoursSinceLastSave < 24) {
            const restore = window.confirm(
              `发现未完成的${type === 'offer' ? '我来讲' : type === 'demand' ? '想听' : '项目'}草稿，是否恢复？`
            );
            if (restore) {
              setFormData(draft.formData);
              setStep(draft.step);
            }
          }
        } catch (e) {
          console.error('加载草稿失败', e);
        }
      }
    };

    // 检查是否有草稿
    ['offer', 'demand', 'project'].forEach(loadDraft);
  }, [isOpen]);

  // 不显示模态框
  if (!isOpen) return null;

  const handleClose = () => {
    setStep('select');
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags.length < 5) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) });
  };

  const handleAddTimeSlot = () => {
    if (timeSlot.startTime && timeSlot.endTime) {
      setFormData({
        ...formData,
        availableTimes: [...formData.availableTimes, { ...timeSlot }]
      });
      setTimeSlot({ day: 'monday', startTime: '', endTime: '' });
    }
  };

  const handleRemoveTimeSlot = (index) => {
    setFormData({
      ...formData,
      availableTimes: formData.availableTimes.filter((_, i) => i !== index)
    });
  };

  // OCR识别结果处理
  const handleOCRExtracted = (extracted) => {
    const updates = {};
    
    // 填充标题
    if (extracted.title && !formData.title) {
      updates.title = extracted.title;
    }
    
    // 填充描述
    if (extracted.description) {
      const descParts = [];
      if (extracted.speaker) descParts.push(`主讲人：${extracted.speaker}`);
      if (extracted.organizer) descParts.push(`主办方：${extracted.organizer}`);
      if (extracted.contact) descParts.push(`联系方式：${extracted.contact}`);
      if (extracted.description) descParts.push(extracted.description);
      updates.description = descParts.join('\n\n');
    }
    
    // 填充地点（我来讲）
    if (extracted.location && step === 'offer' && !formData.location) {
      updates.location = extracted.location;
    }
    
    // 填充时间信息（尝试解析）
    if (extracted.time && step === 'offer') {
      // 这里可以添加更智能的时间解析逻辑
      // 暂时添加到描述中
      if (updates.description) {
        updates.description = `时间：${extracted.time}\n\n` + updates.description;
      }
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
    
    toast.success('已自动填充表单！请检查并调整内容', {
      duration: 3000
    });
  };

  // 手动保存草稿
  const handleSaveDraft = () => {
    const draftKey = `draft_${step}`;
    const draftData = {
      step,
      formData,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    alert('草稿已保存');
  };

  // 添加招募岗位
  const handleAddPosition = () => {
    if (!positionInput.name.trim()) return;
    
    setFormData({
      ...formData,
      positions: [
        ...formData.positions,
        {
          name: positionInput.name.trim(),
          count: parseInt(positionInput.count) || 1,
          requirement: positionInput.requirement.trim()
        }
      ]
    });
    
    // 清空输入
    setPositionInput({ name: '', count: '1', requirement: '' });
  };

  // 删除招募岗位
  const handleRemovePosition = (index) => {
    setFormData({
      ...formData,
      positions: formData.positions.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // 准备提交数据
      const submitData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        type: step === 'offer' ? 'topic_offer' : step === 'demand' ? 'topic_demand' : 'project'
      };

      // 根据类型添加特定字段
      if (step === 'offer') {
        submitData.availableTimes = formData.availableTimes;
        submitData.duration = formData.duration;
        submitData.format = formData.format;
        submitData.location = formData.location;
        submitData.maxParticipants = formData.maxParticipants;
        submitData.targetAudience = formData.targetAudience;
        submitData.prerequisites = formData.prerequisites;
        submitData.materials = formData.materials || [];
      } else if (step === 'demand') {
        submitData.urgency = formData.urgency;
        submitData.learningFormat = formData.learningFormat;
        submitData.preferOnline = formData.preferOnline;
        submitData.preferOffline = formData.preferOffline;
        submitData.budget = formData.budget;
        submitData.budgetAmount = formData.budgetAmount;
      } else if (step === 'project') {
        submitData.projectType = formData.projectType;
        submitData.projectStage = formData.projectStage;
        submitData.teamSize = formData.teamSize;
        submitData.recruiting = formData.recruiting;
        submitData.resourceNeeds = formData.resourceNeeds;
      }

      // 调用API
      const response = await api.topics.create(submitData);
      
      // 删除草稿
      localStorage.removeItem(`draft_${step}`);
      
      alert('发布成功！');
    handleClose();
      
      // 刷新页面数据（这里可以通过props传入回调函数）
      window.location.reload();
    } catch (error) {
      console.error('发布失败:', error);
      alert(error.message || '发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 类型选择界面
  const renderTypeSelection = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-none">
        选择发布类型
      </h2>

      {/* 我来讲 */}
      <button
        onClick={() => setStep('offer')}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-2xl hover:shadow-xl transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm flex-shrink-0">
            💡
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-xl font-bold mb-1 leading-none">我来讲</h3>
            <p className="text-sm opacity-90 leading-none mt-2">分享你的知识和经验</p>
          </div>
          <Icon icon="arrowRight" size="md" color="currentColor" />
        </div>
      </button>

      {/* 想听 */}
      <button
        onClick={() => setStep('demand')}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white p-6 rounded-2xl hover:shadow-xl transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm flex-shrink-0">
            🙋
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-xl font-bold mb-1 leading-none">想听</h3>
            <p className="text-sm opacity-90 leading-none mt-2">寻求帮助或学习新知识</p>
          </div>
          <Icon icon="arrowRight" size="md" color="currentColor" />
        </div>
      </button>

      {/* 项目宣传 */}
      <button
        onClick={() => setStep('project')}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-2xl hover:shadow-xl transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm flex-shrink-0">
            🚀
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-xl font-bold mb-1 leading-none">项目宣传</h3>
            <p className="text-sm opacity-90 leading-none mt-2">展示你的项目或招募成员</p>
          </div>
          <Icon icon="arrowRight" size="md" color="currentColor" />
        </div>
      </button>
    </div>
  );

  // "我来讲"表单
  const renderOfferForm = () => (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 leading-none">发布"我来讲"</h2>
        <button onClick={() => setStep('select')} className="text-gray-400 hover:text-gray-600 transition-colors">
          <Icon icon="arrowLeft" size="md" />
        </button>
      </div>

      {/* OCR智能填写助手 */}
      {step !== 'select' && (
        <OCRUploader 
          onExtracted={handleOCRExtracted}
          className="mb-4"
        />
      )}

      {/* 基本信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="edit" size="sm" color="#8B5CF6" />
          <span className="leading-none">基本信息</span>
        </h3>
        
        <Input
          label="话题标题"
          placeholder="例如：线性代数期末重点串讲"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

      <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">内容分类</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'study', label: '学习', icon: 'study' },
              { value: 'research', label: '科研', icon: 'research' },
              { value: 'skill', label: '技能', icon: 'skill' },
              { value: 'startup', label: '创业', icon: 'startup' },
              { value: 'life', label: '生活', icon: 'life' }
            ].slice(0, 3).map((cat) => (
          <button
                key={cat.value}
                onClick={() => setFormData({ ...formData, category: cat.value })}
                className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                  formData.category === cat.value
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon icon={cat.icon} size="xs" color={formData.category === cat.value ? '#ffffff' : '#6B7280'} />
                <span className="leading-none">{cat.label}</span>
          </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              { value: 'startup', label: '创业', icon: 'startup' },
              { value: 'life', label: '生活', icon: 'life' }
            ].map((cat) => (
          <button
                key={cat.value}
                onClick={() => setFormData({ ...formData, category: cat.value })}
                className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                  formData.category === cat.value
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon icon={cat.icon} size="xs" color={formData.category === cat.value ? '#ffffff' : '#6B7280'} />
                <span className="leading-none">{cat.label}</span>
          </button>
            ))}
        </div>
      </div>

      <TextArea
        label="详细描述"
          placeholder="详细介绍你要分享的内容、涵盖的知识点、预期收获等..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={5}
          required
        />
      </div>

      {/* 时间安排 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="time" size="sm" color="#8B5CF6" />
          <span className="leading-none">时间安排</span>
        </h3>

        <div className="grid grid-cols-3 gap-3">
      <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">星期</label>
            <select
              value={timeSlot.day}
              onChange={(e) => setTimeSlot({ ...timeSlot, day: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="monday">周一</option>
              <option value="tuesday">周二</option>
              <option value="wednesday">周三</option>
              <option value="thursday">周四</option>
              <option value="friday">周五</option>
              <option value="saturday">周六</option>
              <option value="sunday">周日</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">开始时间</label>
            <input
              type="time"
              value={timeSlot.startTime}
              onChange={(e) => setTimeSlot({ ...timeSlot, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">结束时间</label>
            <input
              type="time"
              value={timeSlot.endTime}
              onChange={(e) => setTimeSlot({ ...timeSlot, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <Button onClick={handleAddTimeSlot} variant="outline" className="w-full">
          <span className="inline-flex items-center justify-center gap-2">
            <Icon icon="add" size="sm" />
            <span className="leading-none">添加时间段</span>
          </span>
        </Button>

        {formData.availableTimes.length > 0 && (
          <div className="space-y-2">
            {formData.availableTimes.map((time, index) => (
              <div key={index} className="flex items-center justify-between bg-purple-50 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-700 leading-none">
                  {time.day === 'monday' ? '周一' :
                   time.day === 'tuesday' ? '周二' :
                   time.day === 'wednesday' ? '周三' :
                   time.day === 'thursday' ? '周四' :
                   time.day === 'friday' ? '周五' :
                   time.day === 'saturday' ? '周六' : '周日'} {time.startTime} - {time.endTime}
                </span>
                <button
                  onClick={() => handleRemoveTimeSlot(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Icon icon="delete" size="sm" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">预计时长</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="1">1小时</option>
              <option value="2">2小时</option>
              <option value="3">3小时</option>
              <option value="4">4小时</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">时间灵活性</label>
            <select
              value={formData.flexibility}
              onChange={(e) => setFormData({ ...formData, flexibility: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="high">高（可协商）</option>
              <option value="medium">中</option>
              <option value="low">低（固定）</option>
            </select>
          </div>
        </div>
      </div>

      {/* 形式与地点 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="location" size="sm" color="#8B5CF6" />
          <span className="leading-none">形式与地点</span>
        </h3>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">授课形式</label>
        <div className="grid grid-cols-3 gap-2">
          {[
              { value: 'offline', label: '线下讲座', icon: '📍' },
              { value: 'online', label: '在线直播', icon: '🌐' },
              { value: 'hybrid', label: '线上线下', icon: '🔄' }
            ].map((format) => (
            <button
                key={format.value}
                onClick={() => setFormData({ ...formData, format: format.value })}
                className={`inline-flex flex-col items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-bold transition-all ${
                  formData.format === format.value
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-2xl">{format.icon}</span>
                <span className="leading-none">{format.label}</span>
            </button>
          ))}
        </div>
      </div>

        {(formData.format === 'offline' || formData.format === 'hybrid') && (
          <Input
            label="地点偏好"
            placeholder="例如：图书馆讨论室、教学楼301"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        )}

        <Input
          label="最多人数"
          type="number"
          placeholder="30"
          value={formData.maxParticipants}
          onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
        />
      </div>

      {/* 目标受众 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="participants" size="sm" color="#8B5CF6" />
          <span className="leading-none">目标受众</span>
        </h3>

      <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">适合对象（可多选）</label>
          <div className="space-y-2">
            {[
              { value: 'beginner', label: '初学者（零基础）' },
              { value: 'intermediate', label: '有一定基础' },
              { value: 'advanced', label: '进阶学习者' }
            ].map((level) => (
              <label key={level.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.targetAudience.includes(level.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        targetAudience: [...formData.targetAudience, level.value]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        targetAudience: formData.targetAudience.filter(v => v !== level.value)
                      });
                    }
                  }}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700 leading-none">{level.label}</span>
        </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">前置要求</label>
          <select
            value={formData.prerequisites}
            onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="none">无</option>
            <option value="basic">基础知识</option>
            <option value="intermediate">中级水平</option>
          </select>
        </div>
      </div>

      {/* 标签 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="tag" size="sm" color="#8B5CF6" />
          <span className="leading-none">标签 ({formData.tags.length}/5)</span>
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="添加标签，按回车确认"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            maxLength={10}
          />
          <Button onClick={handleAddTag} disabled={!tagInput.trim() || formData.tags.length >= 5}>
            添加
          </Button>
        </div>

        {formData.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
              <span
              key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
              >
                <span className="leading-none">#{tag}</span>
                <button
                  onClick={() => handleRemoveTag(index)}
                  className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                >
                  <Icon icon="close" size="xs" color="#7C3AED" />
                </button>
              </span>
          ))}
        </div>
        )}
      </div>

      {/* 补充材料 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="upload" size="sm" color="#8B5CF6" />
          <span className="leading-none">补充材料（可选）</span>
        </h3>

        <FileUpload
          label=""
          accept="image/*,.pdf,.ppt,.pptx,.doc,.docx"
          multiple={true}
          value={formData.materials || []}
          onChange={(files) => setFormData({ ...formData, materials: files })}
        />
      </div>

      {/* 提交按钮 */}
      <div className="space-y-3 pt-4 border-t">
        {/* 草稿保存状态提示 */}
        {draftSaving && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Icon icon="success" size="xs" color="#10B981" />
            <span className="leading-none">草稿已自动保存</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleClose}>
          取消
        </Button>
          <Button 
            variant="outline" 
            onClick={handleSaveDraft}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Icon icon="save" size="sm" />
              <span className="leading-none">保存草稿</span>
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={!formData.title || !formData.description}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Icon icon="eye" size="sm" />
              <span className="leading-none">预览</span>
            </span>
          </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
            disabled={!formData.title || !formData.description || submitting}
        >
            <span className="leading-none">{submitting ? '发布中...' : '发布'}</span>
        </Button>
        </div>
      </div>
    </div>
  );

  // "想听"表单
  const renderDemandForm = () => (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 leading-none">发布"想听"</h2>
        <button onClick={() => setStep('select')} className="text-gray-400 hover:text-gray-600 transition-colors">
          <Icon icon="arrowLeft" size="md" />
        </button>
      </div>

      {/* 需求描述 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="edit" size="sm" color="#EC4899" />
          <span className="leading-none">需求描述</span>
        </h3>

      <Input
          label="想学什么"
          placeholder="例如：Python数据分析入门"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
      />

      <TextArea
          label="当前困难"
          placeholder="描述你遇到的困难或想学习的具体内容..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          required
        />
      </div>

      {/* 时间要求 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="time" size="sm" color="#EC4899" />
          <span className="leading-none">时间要求</span>
        </h3>

      <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">紧急程度</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'thisWeek', label: '本周内' },
              { value: 'thisMonth', label: '本月内' },
              { value: 'flexible', label: '不着急' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFormData({ ...formData, urgency: option.value })}
                className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                  formData.urgency === option.value
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="leading-none">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 学习偏好 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="study" size="sm" color="#EC4899" />
          <span className="leading-none">学习偏好</span>
        </h3>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">学习形式</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'oneOnOne', label: '一对一' },
              { value: 'smallGroup', label: '小组(3-5人)' },
              { value: 'largeGroup', label: '大课堂' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFormData({ ...formData, learningFormat: option.value })}
                className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                  formData.learningFormat === option.value
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="leading-none">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
              checked={formData.preferOnline}
              onChange={(e) => setFormData({ ...formData, preferOnline: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
            />
            <span className="text-sm font-medium text-gray-700 leading-none">线上形式</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.preferOffline}
              onChange={(e) => setFormData({ ...formData, preferOffline: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
            />
            <span className="text-sm font-medium text-gray-700 leading-none">线下形式</span>
        </label>
        </div>
      </div>

      {/* 激励设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="star" size="sm" color="#EC4899" />
          <span className="leading-none">激励设置（可选）</span>
        </h3>

      <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">预算</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'free', label: '免费' },
              { value: 'points', label: '积分' },
              { value: 'paid', label: '有偿' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFormData({ ...formData, budget: option.value })}
                className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                  formData.budget === option.value
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="leading-none">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {formData.budget !== 'free' && (
          <Input
            label={formData.budget === 'points' ? '愿意支付积分' : '愿意支付金额'}
            type="number"
            placeholder={formData.budget === 'points' ? '50' : '100'}
            value={formData.budgetAmount}
            onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
          />
        )}
      </div>

      {/* 标签 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="tag" size="sm" color="#EC4899" />
          <span className="leading-none">标签 ({formData.tags.length}/5)</span>
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="添加标签"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            maxLength={10}
          />
          <Button onClick={handleAddTag} disabled={!tagInput.trim() || formData.tags.length >= 5}>
            添加
          </Button>
        </div>

        {formData.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
              <span
              key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-medium"
              >
                <span className="leading-none">#{tag}</span>
                <button
                  onClick={() => handleRemoveTag(index)}
                  className="hover:bg-pink-200 rounded-full p-0.5 transition-colors"
                >
                  <Icon icon="close" size="xs" color="#DB2777" />
                </button>
              </span>
          ))}
        </div>
        )}
      </div>

      {/* 提交按钮 */}
      <div className="space-y-3 pt-4 border-t">
        {draftSaving && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Icon icon="success" size="xs" color="#10B981" />
            <span className="leading-none">草稿已自动保存</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleClose}>
          取消
        </Button>
          <Button variant="outline" onClick={handleSaveDraft}>
            <span className="inline-flex items-center justify-center gap-2">
              <Icon icon="save" size="sm" />
              <span className="leading-none">保存草稿</span>
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={!formData.title || !formData.description}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Icon icon="eye" size="sm" />
              <span className="leading-none">预览</span>
            </span>
          </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
            disabled={!formData.title || !formData.description || submitting}
        >
            <span className="leading-none">{submitting ? '发布中...' : '发布需求'}</span>
        </Button>
        </div>
      </div>
    </div>
  );

  // "项目"表单
  const renderProjectForm = () => (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 leading-none">发布项目</h2>
        <button onClick={() => setStep('select')} className="text-gray-400 hover:text-gray-600 transition-colors">
          <Icon icon="arrowLeft" size="md" />
        </button>
      </div>

      {/* 项目信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="project" size="sm" color="#F97316" />
          <span className="leading-none">项目信息</span>
        </h3>

      <Input
          label="项目名称"
          placeholder="例如：智能选课助手"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">项目类型</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'startup', label: '学生创业' },
              { value: 'research', label: '科研课题' },
              { value: 'competition', label: '竞赛团队' }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setFormData({ ...formData, projectType: type.value })}
                className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                  formData.projectType === type.value
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="leading-none">{type.label}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              { value: 'opensource', label: '开源项目' },
              { value: 'course', label: '课程作业' }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setFormData({ ...formData, projectType: type.value })}
                className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                  formData.projectType === type.value
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="leading-none">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">项目阶段</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'idea', label: '创意阶段' },
              { value: 'prototype', label: '原型开发' },
              { value: 'development', label: '正式运营' },
              { value: 'mature', label: '成熟期' }
            ].map((stage) => (
              <button
                key={stage.value}
                onClick={() => setFormData({ ...formData, projectStage: stage.value })}
                className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                  formData.projectStage === stage.value
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="leading-none">{stage.label}</span>
              </button>
            ))}
          </div>
        </div>

      <TextArea
          label="项目简介"
          placeholder="详细介绍项目的问题、解决方案、价值、当前进展等..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={6}
          required
        />
      </div>

      {/* 团队与招募 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="participants" size="sm" color="#F97316" />
          <span className="leading-none">团队与招募</span>
        </h3>

        <Input
          label="当前团队人数"
          type="number"
          placeholder="5"
          value={formData.teamSize}
          onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
        />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.recruiting}
            onChange={(e) => setFormData({ ...formData, recruiting: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="text-sm font-medium text-gray-700 leading-none">正在招募团队成员</span>
        </label>

        {/* 招募岗位管理 */}
        {formData.recruiting && (
          <div className="space-y-3 bg-orange-50 p-4 rounded-xl">
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Icon icon="participants" size="sm" color="#F97316" />
              <span className="leading-none">招募岗位</span>
            </h4>

            {/* 添加岗位表单 */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="岗位名称（如：前端开发）"
                  value={positionInput.name}
                  onChange={(e) => setPositionInput({ ...positionInput, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <input
          type="number"
                  placeholder="招募人数"
                  min="1"
                  value={positionInput.count}
                  onChange={(e) => setPositionInput({ ...positionInput, count: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <textarea
                placeholder="岗位要求（可选，如：熟悉 React 开发）"
                value={positionInput.requirement}
                onChange={(e) => setPositionInput({ ...positionInput, requirement: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
              <Button
                variant="outline"
                onClick={handleAddPosition}
                disabled={!positionInput.name.trim()}
                className="w-full"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Icon icon="add" size="sm" />
                  <span className="leading-none">添加岗位</span>
                </span>
              </Button>
      </div>

            {/* 已添加的岗位列表 */}
            {formData.positions.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-xs text-gray-600 leading-none">已添加 {formData.positions.length} 个岗位</p>
                {formData.positions.map((position, index) => (
                  <div
                    key={index}
                    className="bg-white border border-orange-200 rounded-lg p-3 flex items-start justify-between gap-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-800 leading-none">
                          {position.name}
                        </span>
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full leading-none">
                          {position.count}人
                        </span>
                      </div>
                      {position.requirement && (
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {position.requirement}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemovePosition(index)}
                      className="flex-shrink-0 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Icon icon="delete" size="sm" color="#EF4444" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 资源需求 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="settings" size="sm" color="#F97316" />
          <span className="leading-none">资源需求</span>
        </h3>

        <TextArea
          label="所需资源"
          placeholder="例如：资金、导师指导、场地、设备等..."
          value={formData.resourceNeeds}
          onChange={(e) => setFormData({ ...formData, resourceNeeds: e.target.value })}
          rows={3}
        />
      </div>

      {/* 标签 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="tag" size="sm" color="#F97316" />
          <span className="leading-none">技术标签 ({formData.tags.length}/5)</span>
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="添加技术标签"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            maxLength={10}
          />
          <Button onClick={handleAddTag} disabled={!tagInput.trim() || formData.tags.length >= 5}>
            添加
          </Button>
        </div>

        {formData.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
              <span
              key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
              >
                <span className="leading-none">#{tag}</span>
                <button
                  onClick={() => handleRemoveTag(index)}
                  className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                >
                  <Icon icon="close" size="xs" color="#EA580C" />
                </button>
              </span>
          ))}
        </div>
        )}
      </div>

      {/* 提交按钮 */}
      <div className="space-y-3 pt-4 border-t">
        {draftSaving && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Icon icon="success" size="xs" color="#10B981" />
            <span className="leading-none">草稿已自动保存</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleClose}>
          取消
        </Button>
          <Button variant="outline" onClick={handleSaveDraft}>
            <span className="inline-flex items-center justify-center gap-2">
              <Icon icon="save" size="sm" />
              <span className="leading-none">保存草稿</span>
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={!formData.title || !formData.description}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Icon icon="eye" size="sm" />
              <span className="leading-none">预览</span>
            </span>
          </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
            disabled={!formData.title || !formData.description || submitting}
          >
            <span className="leading-none">{submitting ? '发布中...' : '发布项目'}</span>
          </Button>
        </div>
      </div>
    </div>
  );

  // 预览组件
  const renderPreview = () => {
    const typeInfo = {
      offer: { title: '我来讲', color: 'blue', icon: 'edit' },
      demand: { title: '想听', color: 'pink', icon: 'search' },
      project: { title: '项目', color: 'orange', icon: 'team' }
    };
    
    const info = typeInfo[step];
    
    return (
      <div className="space-y-6">
        {/* 头部 */}
        <div className="text-center pb-4 border-b">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${
            step === 'offer' ? 'from-blue-500 to-purple-500' :
            step === 'demand' ? 'from-pink-500 to-rose-500' :
            'from-orange-500 to-red-500'
          } text-white mb-3`}>
            <Icon icon={info.icon} size="sm" />
            <span className="font-bold leading-none">{info.title}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{formData.title || '（未填写标题）'}</h2>
          {formData.category && (
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {formData.category === 'study' ? '学习' :
               formData.category === 'research' ? '科研' :
               formData.category === 'skill' ? '技能' :
               formData.category === 'startup' ? '创业' : '生活'}
            </span>
          )}
        </div>

        {/* 内容描述 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Icon icon="document" size="sm" color="#6B7280" />
            <span className="leading-none">详细描述</span>
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap">
            {formData.description || '（未填写描述）'}
          </p>
        </div>

        {/* "我来讲"特有信息 */}
        {step === 'offer' && (
          <>
            {/* 时间安排 */}
            {formData.availableTimes.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Icon icon="time" size="sm" color="#3B82F6" />
                  <span className="leading-none">时间安排</span>
                </h3>
                <div className="space-y-2">
                  {formData.availableTimes.map((time, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="font-medium">
                        {time.day === 'monday' ? '周一' :
                         time.day === 'tuesday' ? '周二' :
                         time.day === 'wednesday' ? '周三' :
                         time.day === 'thursday' ? '周四' :
                         time.day === 'friday' ? '周五' :
                         time.day === 'saturday' ? '周六' : '周日'}
                      </span>
                      <span>{time.startTime} - {time.endTime}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-blue-200 text-sm text-gray-600">
                    <span>预计时长：{formData.duration}小时</span>
                    <span className="ml-4">灵活性：
                      {formData.flexibility === 'high' ? '高' :
                       formData.flexibility === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 形式与地点 */}
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Icon icon="location" size="sm" color="#8B5CF6" />
                <span className="leading-none">形式与地点</span>
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <span className="font-medium">形式：</span>
                  {formData.format === 'offline' ? '线下讲座' :
                   formData.format === 'online' ? '在线直播' : '线上线下混合'}
                </div>
                {formData.format !== 'online' && formData.location && (
                  <div>
                    <span className="font-medium">地点：</span>
                    {formData.location}
                  </div>
                )}
                <div>
                  <span className="font-medium">人数：</span>
                  最多{formData.maxParticipants}人
                </div>
              </div>
            </div>

            {/* 目标受众 */}
            {formData.targetAudience.length > 0 && (
              <div className="bg-indigo-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Icon icon="participants" size="sm" color="#6366F1" />
                  <span className="leading-none">目标受众</span>
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div>
                    <span className="font-medium">适合对象：</span>
                    {formData.targetAudience.map(a => 
                      a === 'beginner' ? '初学者' :
                      a === 'intermediate' ? '有一定基础' : '进阶学习者'
                    ).join('、')}
                  </div>
                  <div>
                    <span className="font-medium">前置要求：</span>
                    {formData.prerequisites === 'none' ? '无' :
                     formData.prerequisites === 'basic' ? '基础知识' : '中级水平'}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* "想听"特有信息 */}
        {step === 'demand' && (
          <>
            <div className="bg-pink-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Icon icon="time" size="sm" color="#EC4899" />
                <span className="leading-none">时间与形式</span>
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <span className="font-medium">紧急程度：</span>
                  {formData.urgency === 'thisWeek' ? '本周内' :
                   formData.urgency === 'thisMonth' ? '本月内' : '不着急'}
                </div>
                <div>
                  <span className="font-medium">学习形式：</span>
                  {formData.learningFormat === 'oneOnOne' ? '一对一辅导' :
                   formData.learningFormat === 'smallGroup' ? '小组学习（3-5人）' : '大课堂'}
                </div>
                <div>
                  <span className="font-medium">偏好：</span>
                  {formData.preferOnline && formData.preferOffline ? '线上或线下都可以' :
                   formData.preferOnline ? '线上' :
                   formData.preferOffline ? '线下' : '未设置'}
                </div>
              </div>
            </div>

            {formData.budget !== 'free' && (
              <div className="bg-rose-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Icon icon="coin" size="sm" color="#F43F5E" />
                  <span className="leading-none">激励设置</span>
                </h3>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">预算：</span>
                  {formData.budget === 'points' ? '积分' : '有偿'}
                  {formData.budgetAmount && ` - ${formData.budgetAmount}`}
                </div>
              </div>
            )}
          </>
        )}

        {/* "项目"特有信息 */}
        {step === 'project' && (
          <>
            <div className="bg-orange-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Icon icon="folder" size="sm" color="#F97316" />
                <span className="leading-none">项目信息</span>
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <span className="font-medium">类型：</span>
                  {formData.projectType === 'startup' ? '学生创业' :
                   formData.projectType === 'research' ? '科研课题' :
                   formData.projectType === 'competition' ? '竞赛团队' :
                   formData.projectType === 'opensource' ? '开源项目' : '课程作业'}
                </div>
                <div>
                  <span className="font-medium">阶段：</span>
                  {formData.projectStage === 'idea' ? '创意阶段' :
                   formData.projectStage === 'prototype' ? '原型开发' :
                   formData.projectStage === 'operating' ? '正式运营' : '成熟期'}
                </div>
                {formData.teamSize && (
                  <div>
                    <span className="font-medium">团队人数：</span>
                    {formData.teamSize}人
                  </div>
                )}
                {formData.recruiting && (
                  <div className="text-orange-600 font-medium">
                    🔥 正在招募团队成员
                  </div>
                )}
              </div>
            </div>

            {/* 招募岗位 */}
            {formData.positions && formData.positions.length > 0 && (
              <div className="bg-orange-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Icon icon="participants" size="sm" color="#F97316" />
                  <span className="leading-none">招募岗位</span>
                </h3>
                <div className="space-y-2">
                  {formData.positions.map((position, idx) => (
                    <div key={idx} className="bg-white border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-800 leading-none">
                          {position.name}
                        </span>
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full leading-none">
                          {position.count}人
                        </span>
                      </div>
                      {position.requirement && (
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {position.requirement}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.resourceNeeds && (
              <div className="bg-red-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Icon icon="resource" size="sm" color="#EF4444" />
                  <span className="leading-none">资源需求</span>
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {formData.resourceNeeds}
                </p>
              </div>
            )}
          </>
        )}

        {/* 标签 */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, idx) => (
              <span
                key={idx}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  step === 'offer' ? 'bg-purple-100 text-purple-700' :
                  step === 'demand' ? 'bg-pink-100 text-pink-700' :
                  'bg-orange-100 text-orange-700'
                }`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 返回编辑按钮 */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setShowPreview(false)}
          className="flex-1"
        >
            <span className="inline-flex items-center justify-center gap-2">
              <Icon icon="edit" size="sm" />
              <span className="leading-none">返回编辑</span>
            </span>
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!formData.title || !formData.description || submitting}
            className="flex-1"
          >
            <span className="leading-none">{submitting ? '发布中...' : '确认发布'}</span>
        </Button>
      </div>
    </div>
  );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-gray-800 leading-none">
            {showPreview ? '预览' :
             step === 'select' ? '发布内容' :
             step === 'offer' ? '我来讲' :
             step === 'demand' ? '想听' : '项目宣传'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon icon="close" size="md" color="#6B7280" />
          </button>
        </div>

        <div className="p-6">
          {showPreview ? renderPreview() : (
            <>
              {step === 'select' && renderTypeSelection()}
              {step === 'offer' && renderOfferForm()}
              {step === 'demand' && renderDemandForm()}
              {step === 'project' && renderProjectForm()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishModal;
