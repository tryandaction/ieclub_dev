import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createActivity } from '../api/activities'
import { showToast } from '../components/Toast'

// 活动分类选项
const categoryOptions = [
  { value: 'lecture', label: '讲座分享', icon: '🎤' },
  { value: 'workshop', label: '工作坊', icon: '🔧' },
  { value: 'competition', label: '比赛活动', icon: '🏆' },
  { value: 'social', label: '社交联谊', icon: '🤝' },
  { value: 'outdoor', label: '户外活动', icon: '🏕️' },
  { value: 'other', label: '其他', icon: '📌' },
]

export default function PublishActivity() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    maxParticipants: '',
    category: '',
    tags: [],
  })
  
  const [tagInput, setTagInput] = useState('')
  const [images, setImages] = useState([])
  
  // 防重复提交锁
  const isSubmitting = useRef(false)

  // 更新表单字段
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 添加标签
  const addTag = () => {
    const tag = tagInput.trim()
    if (!tag) return
    if (formData.tags.includes(tag)) {
      showToast('标签已存在', 'warning')
      return
    }
    if (formData.tags.length >= 5) {
      showToast('最多添加5个标签', 'warning')
      return
    }
    setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    setTagInput('')
  }

  // 移除标签
  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }))
  }

  // 处理图片上传
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 5) {
      showToast('最多上传5张图片', 'warning')
      return
    }
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImages(prev => [...prev, {
          file,
          preview: event.target.result
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  // 移除图片
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // 验证表单
  const validateForm = () => {
    if (!formData.title.trim()) {
      showToast('请输入活动标题', 'warning')
      return false
    }
    if (formData.title.length < 5) {
      showToast('标题至少5个字', 'warning')
      return false
    }
    if (!formData.description.trim()) {
      showToast('请输入活动描述', 'warning')
      return false
    }
    if (formData.description.length < 20) {
      showToast('描述至少20个字', 'warning')
      return false
    }
    if (!formData.location.trim()) {
      showToast('请输入活动地点', 'warning')
      return false
    }
    if (!formData.startDate || !formData.startTime) {
      showToast('请选择开始时间', 'warning')
      return false
    }
    if (!formData.endDate || !formData.endTime) {
      showToast('请选择结束时间', 'warning')
      return false
    }
    if (!formData.category) {
      showToast('请选择活动分类', 'warning')
      return false
    }
    
    // 验证时间
    const start = new Date(`${formData.startDate}T${formData.startTime}`)
    const end = new Date(`${formData.endDate}T${formData.endTime}`)
    const now = new Date()
    
    if (start < now) {
      showToast('开始时间不能早于当前时间', 'warning')
      return false
    }
    if (end <= start) {
      showToast('结束时间必须晚于开始时间', 'warning')
      return false
    }
    
    return true
  }

  // 提交表单
  const handleSubmit = async () => {
    // 防止重复提交
    if (isSubmitting.current || loading) {
      console.log('⚠️ 防止重复提交')
      return
    }
    
    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录', 'warning')
      navigate('/login')
      return
    }

    if (!validateForm()) return

    // 立即设置提交锁
    isSubmitting.current = true
    
    try {
      setLoading(true)
      
      // 构建提交数据
      const startTime = new Date(`${formData.startDate}T${formData.startTime}`).toISOString()
      const endTime = new Date(`${formData.endDate}T${formData.endTime}`).toISOString()
      
      const postData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startTime,
        endTime,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : 0,
        category: formData.category,
        tags: formData.tags,
        images: [], // TODO: 实现图片上传
      }

      await createActivity(postData)
      
      showToast('活动发布成功 🎉', 'success')
      setTimeout(() => navigate('/activities'), 1500)
    } catch (error) {
      console.error('发布失败:', error)
      showToast(error.response?.data?.message || '发布失败，请稍后重试', 'error')
    } finally {
      setLoading(false)
      isSubmitting.current = false
    }
  }

  // 获取今天日期字符串
  const getTodayStr = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/activities')}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
      >
        <span className="mr-2">←</span>
        返回活动列表
      </button>

      {/* 标题 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-8 mb-6">
        <h1 className="text-3xl font-bold mb-2">🎉 发布新活动</h1>
        <p className="text-white/90">创建精彩活动，邀请小伙伴一起参与</p>
      </div>

      {/* 表单 */}
      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* 活动标题 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            活动标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="请输入活动标题（5-50字）"
            maxLength={50}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <div className="text-right text-sm text-gray-400 mt-1">
            {formData.title.length}/50
          </div>
        </div>

        {/* 活动描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            活动描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="详细介绍活动内容、流程、注意事项等..."
            maxLength={2000}
            rows={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
          <div className="text-right text-sm text-gray-400 mt-1">
            {formData.description.length}/2000
          </div>
        </div>

        {/* 活动分类 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            活动分类 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {categoryOptions.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => updateField('category', cat.value)}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  formData.category === cat.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="text-sm font-medium">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 活动地点 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            活动地点 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="例如：图书馆301室、操场、线上腾讯会议"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* 活动时间 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              开始时间 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                min={getTodayStr()}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => updateField('startTime', e.target.value)}
                className="w-32 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              结束时间 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
                min={formData.startDate || getTodayStr()}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => updateField('endTime', e.target.value)}
                className="w-32 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 人数限制 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            人数限制
          </label>
          <input
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => updateField('maxParticipants', e.target.value)}
            placeholder="不填则不限制人数"
            min={0}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <p className="text-sm text-gray-500 mt-1">
            设置为0或留空表示不限制参与人数
          </p>
        </div>

        {/* 标签 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            活动标签
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="输入标签后回车添加"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
            >
              添加
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 图片上传 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            活动图片（最多5张）
          </label>
          <div className="flex flex-wrap gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative w-24 h-24">
                <img
                  src={img.preview}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                <span className="text-2xl text-gray-400">+</span>
                <span className="text-xs text-gray-400">添加图片</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            {loading ? '发布中...' : '发布活动 🎉'}
          </button>
        </div>
      </div>
    </div>
  )
}
